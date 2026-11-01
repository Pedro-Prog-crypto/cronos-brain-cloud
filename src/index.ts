import { deliverNotifications } from './capabilities/actions';
import { z } from 'zod';
import type { Env } from './types';
import { ApiError } from './types';
import { authenticate, createSession, owner, rateLimit } from './auth/auth';
import { chatSchema, memorySchema, sessionSchema, titleSchema, eventSchema } from './api/schemas';
import { D1MemoryStore, audit } from './storage/store';
import { chat } from './core/orchestrator';
import { catalog } from './agents/catalog';
import { providerStatus } from './providers/gateway';
import { schedule } from './core/time';
import { operations } from './api/operations';
import { automatedBackups,exportData } from './storage/backup';
import { adminResponse } from './admin/serve';

import { json, body } from './api/http';
async function route(r: Request, env: Env): Promise<Response> {
  const u = new URL(r.url), path = u.pathname, method = r.method;
  if (u.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(u.hostname)) throw new ApiError(400,'https_required');
  const admin=adminResponse(path,method); if(admin) return admin;
  if (path === '/v1/health' && method === 'GET') return json({name:'CRONOS BRAIN CLOUD',status:'ok',time:new Date().toISOString()});
  if (path === '/v1/auth/sessions' && method === 'POST') {
    await rateLimit(env.DB,`login:${r.headers.get('CF-Connecting-IP') ?? 'local'}`,10);
    const b = await body(r,sessionSchema);
    return json(await createSession(env,b.deviceId,b.credential),201);
  }
  const p = await authenticate(r,env);
  await rateLimit(env.DB,`user:${p.userId}`,60);
  if (!['GET','HEAD'].includes(method) && path!=='/v1/auth/logout') owner(p);
  const operation=await operations(r,env,p); if(operation) return operation;
  const store = new D1MemoryStore(env.DB);
  if (path === '/v1/chat' && method === 'POST') {
    const input=await body(r,chatSchema);
    if(r.headers.get('Accept')?.includes('text/event-stream')) {
      const encoder=new TextEncoder();
      const stream=new ReadableStream({async start(controller){
        const emit=(event:string,data:unknown)=>controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        try{emit('progress',{status:'processing'});emit('result',await chat(env,p,input));}
        catch(e){emit('error',{code:e instanceof ApiError?e.code:'internal_error'});}
        finally{controller.close();}
      }});
      return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    return json(await chat(env,p,input));
  }
  if (path === '/v1/agents' && method === 'GET') return json({agents:catalog(),executions:(await env.DB.prepare('SELECT agent_id,provider,latency_ms,status,created_at FROM agent_executions WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(p.userId).all()).results});
  if (path === '/v1/providers/status' && method === 'GET') return json({providers:providerStatus(env)});
  if (path === '/v1/memory' && method === 'POST') return json(await store.save(p.userId,await body(r,memorySchema)),201);
  if (path === '/v1/memory/search' && method === 'GET') {
    const q = u.searchParams.get('q') ?? ''; if (q.length > 500) throw new ApiError(422,'query_too_long');
    return json({memories:await store.search(p.userId,q,u.searchParams.get('kind') ?? undefined)});
  }
  if (/^\/v1\/memory\/[^/]+$/.test(path) && method === 'DELETE') {
    const id = path.split('/').pop()!;
    await env.DB.batch([
      env.DB.prepare('DELETE FROM memories WHERE id=? AND user_id=?').bind(id,p.userId),
      env.DB.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),p.userId,'memory.delete',id,new Date().toISOString()),
    ]); return json({deleted:true});
  }
  if (path === '/v1/knowledge/nodes' && method === 'POST') {
    const b = await body(r,z.object({label:z.string().trim().min(1).max(120),category:z.string().min(1).max(60)}).strict());
    await env.DB.prepare('INSERT OR IGNORE INTO knowledge_nodes VALUES (?,?,?,?)').bind(crypto.randomUUID(),p.userId,b.label,b.category).run();
    return json(await env.DB.prepare('SELECT id,label,category FROM knowledge_nodes WHERE user_id=? AND label=?').bind(p.userId,b.label).first(),201);
  }
  if (path === '/v1/knowledge/edges' && method === 'POST') {
    const b = await body(r,z.object({sourceId:z.string().uuid(),targetId:z.string().uuid(),relation:z.string().min(1).max(120),memoryId:z.string().uuid()}).strict());
    const nodes = await env.DB.prepare('SELECT count(*) AS n FROM knowledge_nodes WHERE user_id=? AND id IN (?,?)').bind(p.userId,b.sourceId,b.targetId).first<{n:number}>();
    const memory = await env.DB.prepare('SELECT id FROM memories WHERE user_id=? AND id=?').bind(p.userId,b.memoryId).first();
    if (nodes?.n !== 2 || !memory) throw new ApiError(422,'invalid_graph_reference');
    await env.DB.prepare('INSERT OR IGNORE INTO knowledge_edges VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),p.userId,b.sourceId,b.targetId,b.relation,b.memoryId).run();
    return json({saved:true},201);
  }
  if (path === '/v1/knowledge/graph' && method === 'GET') {
    const nodes = (await env.DB.prepare('SELECT id,label,category FROM knowledge_nodes WHERE user_id=? ORDER BY label LIMIT 500').bind(p.userId).all()).results;
    const edges = (await env.DB.prepare('SELECT id,source_id,target_id,relation,memory_id FROM knowledge_edges WHERE user_id=? LIMIT 1000').bind(p.userId).all()).results;
    const ids = new Set(nodes.map(n => n.id));
    return json({nodes,edges:edges.filter(e => ids.has(e.source_id) && ids.has(e.target_id)),limits:{nodes:500,edges:1000}});
  }
  for (const table of ['goals','tasks','events'] as const) {
    if (path === `/v1/${table}` && method === 'GET') return json({items:(await env.DB.prepare(`SELECT * FROM ${table} WHERE user_id=? ORDER BY created_at DESC LIMIT 100`).bind(p.userId).all()).results});
    if (path === `/v1/${table}` && method === 'POST') {
      const id = crypto.randomUUID(), now = new Date().toISOString();
      if (table === 'events') {
        const b = await body(r,eventSchema);
        await env.DB.prepare('INSERT INTO events(id,user_id,title,due_at,status,notify,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,p.userId,b.title,new Date(b.dueAt).toISOString(),'active',Number(b.notify),now).run();
      } else {
        const b = await body(r,titleSchema);
        await env.DB.prepare(`INSERT INTO ${table} VALUES (?,?,?,?,?)`).bind(id,p.userId,b.title,table === 'tasks' ? 'pending' : 'active',now).run();
      }
      return json({id},201);
    }
    if (path.startsWith(`/v1/${table}/`)) {
      const id = path.split('/').pop()!;
      if (method === 'GET') {
        const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id=? AND user_id=?`).bind(id,p.userId).first();
        if (!row) throw new ApiError(404,'not_found'); return json(row);
      }
      if (method === 'PATCH') {
        const b = await body(r,z.object({status:z.enum(['completed','cancelled'])}).strict());
        await env.DB.batch([
          env.DB.prepare(`UPDATE ${table} SET status=? WHERE id=? AND user_id=?`).bind(b.status,id,p.userId),
          ...(table === 'events' ? [env.DB.prepare('DELETE FROM reminders WHERE event_id=? AND user_id=?').bind(id,p.userId)] : []),
        ]); return json({updated:true});
      }
    }
  }
  if (path === '/v1/reminders' && method === 'GET') return json({items:(await env.DB.prepare('SELECT r.id,e.title,e.due_at FROM reminders r JOIN events e ON r.event_id=e.id WHERE r.user_id=? AND r.seen_at IS NULL AND e.notify=1 AND e.status=\'active\' ORDER BY e.due_at').bind(p.userId).all()).results});
  if (path === '/v1/devices' && method === 'GET') return json({devices:(await env.DB.prepare('SELECT id,name,role,revoked_at FROM devices WHERE user_id=?').bind(p.userId).all()).results});
  if (/^\/v1\/devices\/[^/]+$/.test(path) && method === 'DELETE') {
    const id = path.split('/').pop()!;
    await env.DB.batch([
      env.DB.prepare('UPDATE devices SET revoked_at=? WHERE id=? AND user_id=?').bind(new Date().toISOString(),id,p.userId),
      env.DB.prepare('DELETE FROM sessions WHERE device_id IN (SELECT id FROM devices WHERE id=? AND user_id=?)').bind(id,p.userId),
      env.DB.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),p.userId,'device.revoke',id,new Date().toISOString()),
    ]); return json({revoked:true});
  }
  if (path === '/v1/data/export' && method === 'GET') {
    owner(p); const result=await exportData(env.DB,p.userId);
    await audit(env.DB,p.userId,'data.export',p.userId);return json(result);
  }
  if (path === '/v1/data' && method === 'DELETE') {
    const b = await body(r,z.object({confirm:z.literal('DELETE MY DATA')}).strict());
    if (b.confirm) {
      const backups=(await env.DB.prepare('SELECT object_key FROM backups WHERE user_id=?').bind(p.userId).all<{object_key:string}>()).results;
      if(backups.length&&!env.BACKUPS)throw new ApiError(503,'backup_storage_required_for_deletion');
      for(const row of backups)await env.BACKUPS!.delete(row.object_key);
      await env.DB.prepare('DELETE FROM users WHERE id=?').bind(p.userId).run();
    }
    return json({deleted:true});
  }
  throw new ApiError(404,'not_found');
}
export default {
  async fetch(r: Request, env: Env): Promise<Response> {
    try { return await route(r,env); }
    catch (error) {
      const e = error instanceof ApiError ? error : new ApiError(500,'internal_error');
      const response = json({error:{code:e.code,requestId:crypto.randomUUID()}},e.status);
      if (e.retryAfter) response.headers.set('Retry-After',String(e.retryAfter));
      return response;
    }
  },
  async scheduled(_controller: ScheduledController,env: Env) { await schedule(env.DB); await automatedBackups(env); await deliverNotifications(env); },
};

import { migrate } from './migrate.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { hash } from '../src/auth/auth';
import { canonical, automatedBackups } from '../src/storage/backup';
import { quietNow, schedule } from '../src/core/time';

test('operações avançadas integradas no Worker/D1',async t=>{
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'operations'},r2Buckets:{BACKUPS:'backups'},bindings:{PROVIDERS_JSON:'[]',BACKUPS_ENABLED:'true'}});
  t.after(()=>mf.dispose());const db=await mf.getD1Database('DB');
  await migrate(db);
  const user=crypto.randomUUID(),device=crypto.randomUUID(),credential='d'.repeat(64);
  await db.prepare('INSERT INTO users(id) VALUES (?)').bind(user).run();
  await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(device,user,'owner',await hash(credential),'owner').run();
  let session='';
  const req=async(path:string,method='GET',data?:unknown,as=session)=>{
    const res=await mf.dispatchFetch('https://brain.test'+path,{method,headers:{Authorization:`Bearer ${as}`,...(data!==undefined?{'Content-Type':'application/json'}:{})},body:data!==undefined?JSON.stringify(data):undefined});
    return {status:res.status,data:await res.json() as any};
  };
  session=(await req('/v1/auth/sessions','POST',{deviceId:device,credential})).data.accessToken;
  const mem={kind:'semantic',content:'Meu projeto CRONOS',source:'user',metadata:{topics:['CRONOS','Engenharia']}};
  let memoryId='',backup:any;
  await t.test('painel público contém só shell; diagnóstico privado exige sessão',async()=>{
    const page=await mf.dispatchFetch('https://brain.test/admin');assert.equal(page.status,200);assert.ok((await page.text()).includes('CRONOS'));assert.ok(page.headers.get('Content-Security-Policy')?.includes("script-src 'self'"));
    assert.equal((await req('/v1/diagnostics','GET',undefined,'invalid')).status,401);
    const js=await mf.dispatchFetch('https://brain.test/admin/app.js');assert.equal(js.status,200);assert.ok(!(await js.text()).includes(credential));
  });
  await t.test('versões, conflito otimista e atualização das relações automáticas',async()=>{
    const saved=await req('/v1/memory','POST',mem);memoryId=saved.data.id;assert.equal(saved.status,201);
    let graph=await req('/v1/knowledge/graph');assert.equal(graph.data.nodes.length,2);assert.equal(graph.data.edges.length,1);
    const changed={...mem,content:'Projeto atualizado',metadata:{topics:['CRONOS','Memória']}};
    const updated=await req('/v1/memory/'+memoryId,'PUT',{expectedVersion:1,memory:changed});assert.equal(updated.status,200);assert.equal(updated.data.version,2);
    assert.equal((await req('/v1/memory/'+memoryId,'PUT',{expectedVersion:1,memory:mem})).status,409);
    const history=await req(`/v1/memory/${memoryId}/versions`);assert.equal(history.data.versions.length,1);assert.equal(history.data.versions[0].content,mem.content);
    assert.equal(JSON.parse(history.data.versions[0].snapshot).source,'user');
    graph=await req('/v1/knowledge/graph');assert.equal(graph.data.edges.length,1);
    assert.equal((await req('/v1/knowledge/graph/search?q=Memória')).data.nodes.length,1);
  });
  await t.test('ferramentas reais: documento, gráfico, imagem; erro controlado',async()=>{
    const document=await req('/v1/tools/execute','POST',{tool:'document.analyze',name:'Teste',text:'Olá CRONOS\nDocumento real'});assert.equal(document.status,200);assert.equal(document.data.result.words,4);assert.equal(document.data.result.lines,2);
    const chart=await req('/v1/tools/execute','POST',{tool:'visual.chart',title:'Progresso',points:[{label:'Estudo',value:12}]});assert.equal(chart.data.result.points[0].value,12);assert.equal(chart.data.result.type,'chart');
    const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZS0AAAAASUVORK5CYII=';
    const image=await req('/v1/tools/execute','POST',{tool:'image.inspect',base64:png});assert.equal(image.status,200);assert.equal(image.data.result.width,1);assert.equal(image.data.result.semanticAnalysis,false);
    assert.equal((await req('/v1/tools/execute','POST',{tool:'image.inspect',base64:'x'.repeat(30)})).status,415);
    assert.equal((await req('/v1/tools/execute','POST',{tool:'web.search',query:'galáxias'})).data.error.code,'web_search_not_configured');
    const diag=await req('/v1/diagnostics');assert.ok(diag.data.tools.some((r:any)=>r.status==='failed'));
  });
  await t.test('configuração, silêncio, confirmação de lembrete e recorrência',async()=>{
    const settings={timezone:'America/Sao_Paulo',proactive:true,quietStart:22,quietEnd:8,retentionDays:0,backupEnabled:false};
    assert.equal((await req('/v1/settings','PUT',{...settings,timezone:'invalid'})).status,422);
    assert.equal((await req('/v1/settings','PUT',settings)).status,200);
    // Scheduler tests advance the business clock; keep the fixture session valid across that advance.
    await db.prepare('UPDATE sessions SET expires_at=? WHERE device_id=?').bind(Math.floor(Date.now()/1000)+366*86400,device).run();
    const now=new Date('2026-11-01T15:00:00Z');const due=new Date(now.getTime()+86400000).toISOString();
    const event=await req('/v1/events','POST',{title:'Prova',dueAt:due,notify:true});assert.equal(event.status,201);
    await schedule(db as any,new Date('2026-11-01T03:00:00Z'),user);assert.equal((await req('/v1/reminders')).data.items.length,0);
    await schedule(db as any,now,user);await schedule(db as any,now,user);const reminders=(await req('/v1/reminders')).data.items;assert.equal(reminders.length,1);
    await req(`/v1/reminders/${reminders[0].id}/ack`,'POST',{});assert.equal((await req('/v1/reminders')).data.items.length,0);
    assert.equal((await req(`/v1/events/${event.data.id}`,'PATCH',{recurrenceDays:7})).status,200);
    assert.equal((await req(`/v1/events/${event.data.id}`,'PATCH',{status:'completed'})).status,200);
    const next=(await req('/v1/events')).data.items.filter((e:any)=>e.status==='active');assert.equal(next.length,1);assert.equal(next[0].due_at,'2026-11-09T15:00:00.000Z');
    await req(`/v1/events/${event.data.id}`,'PATCH',{status:'completed'});assert.equal((await req('/v1/events')).data.items.length,2);
  });
  await t.test('planejamento temporal cria meta e tarefas, sem inventar conteúdos',async()=>{
    const result=await req('/v1/events/plan','POST',{title:'Prova de matemática',expression:'daqui a três semanas'});assert.equal(result.status,201);assert.equal(result.data.precision,'day');
    assert.equal((await req('/v1/tasks')).data.items.length,3);assert.equal((await req('/v1/goals')).data.items.length,1);
    assert.equal((await req('/v1/time/resolve','POST',{expression:'data incerta'})).status,422);
  });
  await t.test('especialista local executa função e registra histórico',async()=>{
    const result=await req('/v1/agents/39/run','POST',{message:'Verificar permissões'});assert.equal(result.status,200);assert.equal(result.data.result.externalActionsAllowed,false);
    assert.equal((await req('/v1/agents/13/run','POST',{message:'Veja a imagem'})).status,503);
    const cat=await req('/v1/agents');assert.equal(cat.data.agents.length,40);assert.ok(cat.data.executions.some((e:any)=>e.agent_id==='39'&&e.status==='succeeded'));
  });
  await t.test('SSE anuncia processamento e erro honesto quando não há modelo',async()=>{
    const res=await mf.dispatchFetch('https://brain.test/v1/chat',{method:'POST',headers:{Authorization:`Bearer ${session}`,'Content-Type':'application/json',Accept:'text/event-stream'},body:JSON.stringify({message:'Olá'})});
    assert.equal(res.status,200);const text=await res.text();assert.ok(text.includes('event: progress'));assert.ok(text.includes('event: error'));assert.ok(text.includes('no_available_model'));
  });
  await t.test('backup preserva documentos, versões e referências sem segredos',async()=>{
    const result=await req('/v1/backup/export');assert.equal(result.status,200);backup=result.data;
    const {checksum,...payload}=backup;assert.equal(checksum,await hash(canonical(payload)));
    assert.equal(backup.data.memory_versions.length,1);assert.equal(backup.data.documents.length,1);assert.ok(!JSON.stringify(backup).includes(credential));
    assert.equal((await req('/v1/backup/restore','POST',{confirm:'RESTORE INTO EMPTY ACCOUNT',backup})).status,409);
  });
  await t.test('restauração em outra conta remapeia IDs, verifica checksum e referências',async()=>{
    const other=crypto.randomUUID(),otherDevice=crypto.randomUUID(),otherToken='e'.repeat(64);
    await db.prepare('INSERT INTO users(id) VALUES (?)').bind(other).run();
    await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(otherDevice,other,'restore',await hash('restore'),'owner').run();
    await db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(otherToken),otherDevice,Math.floor(Date.now()/1000)+900).run();
    const damaged=structuredClone(backup);damaged.data.memories[0].content='tampered';
    assert.equal((await req('/v1/backup/restore','POST',{confirm:'RESTORE INTO EMPTY ACCOUNT',backup:damaged},otherToken)).data.error.code,'backup_integrity_failed');
    const badReference=structuredClone(backup);badReference.data.knowledge_edges[0].memory_id=crypto.randomUUID();const {checksum,...payload}=badReference;badReference.checksum=await hash(canonical(payload));
    assert.equal((await req('/v1/backup/restore','POST',{confirm:'RESTORE INTO EMPTY ACCOUNT',backup:badReference},otherToken)).data.error.code,'backup_reference_invalid');
    assert.equal((await req('/v1/memory/search','GET',undefined,otherToken)).data.memories.length,0);
    const result=await req('/v1/backup/restore','POST',{confirm:'RESTORE INTO EMPTY ACCOUNT',backup},otherToken);assert.equal(result.status,200);assert.ok(result.data.restored>10);
    const restored=(await req('/v1/memory/search','GET',undefined,otherToken)).data.memories;assert.equal(restored.length,1);assert.notEqual(restored[0].id,memoryId);assert.equal(restored[0].user_id,other);
    const graph=(await req('/v1/knowledge/graph','GET',undefined,otherToken)).data;assert.equal(graph.edges[0].memory_id,restored[0].id);
    assert.equal((await req(`/v1/memory/${restored[0].id}/versions`,'GET',undefined,otherToken)).data.versions.length,1);
  });
  await t.test('backup automático opt-in em R2 local, deduplicação diária e exclusão',async()=>{
    await db.prepare('UPDATE preferences SET backup_enabled=1 WHERE user_id=?').bind(user).run();
    const bucket=await mf.getR2Bucket('BACKUPS');
    const env={DB:db,BACKUPS:bucket,BACKUPS_ENABLED:'true'} as any;
    await automatedBackups(env);await automatedBackups(env);
    assert.equal((await bucket.list()).objects.length,1);
    // Reset only this test user's request limiter before the final admin operation.
    await db.prepare('DELETE FROM rate_limits WHERE key LIKE ?').bind(`user:${user}:%`).run();
    assert.equal((await req('/v1/data','DELETE',{confirm:'DELETE MY DATA'})).status,200);assert.equal((await bucket.list()).objects.length,0);
  });
});

test('horários de silêncio com fuso e faixa diurna',()=>{
  assert.equal(quietNow(new Date('2026-11-01T03:00:00Z'),'America/Sao_Paulo',22,8),true);
  assert.equal(quietNow(new Date('2026-11-01T15:00:00Z'),'America/Sao_Paulo',22,8),false);
  assert.equal(quietNow(new Date('2026-11-01T15:00:00Z'),'America/Sao_Paulo',10,14),true);
});

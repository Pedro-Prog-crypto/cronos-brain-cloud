import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Miniflare, createFetchMock } from 'miniflare';
import { hash } from '../src/auth/auth';
import { relativeDate, schedule } from '../src/core/time';
import { selectAgent, catalog } from '../src/agents/catalog';
import { ModelGateway, HttpProvider, retrySeconds } from '../src/providers/gateway';
import { migrate } from './migrate.mjs';
const user = '11111111-1111-4111-8111-111111111111';
const device = '22222222-2222-4222-8222-222222222222';
const credential = 'a'.repeat(64);
function runtime(persist?: string) { return new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'test'},d1Persist:persist,bindings:{PROVIDERS_JSON:'[]'}}); }
async function setup(mf: Miniflare) {
  const db = await mf.getD1Database('DB');
  await migrate(db);
  await db.prepare('INSERT INTO users(id) VALUES (?)').bind(user).run();
  await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(device,user,'test',await hash(credential),'owner').run();
  return db;
}
async function request(mf: Miniflare,path: string,method = 'GET',body?: unknown,token?: string) {
  const response = await mf.dispatchFetch('https://brain.test'+path,{method,headers:{...(body !== undefined ? {'Content-Type':'application/json'} : {}),...(token ? {Authorization:`Bearer ${token}`} : {})},body:body !== undefined ? JSON.stringify(body) : undefined});
  return {status:response.status,data:await response.json() as any,headers:response.headers};
}
async function login(mf: Miniflare) {
  const result = await request(mf,'/v1/auth/sessions','POST',{deviceId:device,credential});
  assert.equal(result.status,201); return result.data.accessToken as string;
}
const memory = {kind:'semantic',content:'Projeto de programação CRONOS',source:'user',confidence:1,metadata:{topics:['CRONOS','Programação']}};

test('API: autenticação, isolamento, memórias, grafo, eventos, exportação e revogação',async t => {
  const mf = runtime(); t.after(()=>mf.dispose()); const db = await setup(mf);
  await t.test('health público e proteção dos recursos privados',async()=>{
    assert.equal((await request(mf,'/v1/health')).status,200);
    assert.equal((await request(mf,'/v1/memory/search')).status,401);
    assert.equal((await request(mf,'/v1/memory/search','GET',undefined,'b'.repeat(64))).status,401);
    assert.equal((await request(mf,'/v1/auth/sessions','POST',{deviceId:device,credential:'b'.repeat(64)})).status,401);
  });
  const token = await login(mf); let memoryId:string;
  await t.test('memória real, deduplicação e entradas inválidas',async()=>{
    const first = await request(mf,'/v1/memory','POST',memory,token); assert.equal(first.status,201); memoryId=first.data.id;
    assert.equal((await request(mf,'/v1/memory','POST',memory,token)).data.id,memoryId);
    assert.equal((await request(mf,'/v1/memory/search?q=CRONOS','GET',undefined,token)).data.memories.length,1);
    assert.equal((await request(mf,'/v1/memory','POST',{...memory,kind:'procedural'},token)).status,422);
    assert.equal((await request(mf,'/v1/memory/search?q=%25','GET',undefined,token)).data.memories.length,0);
  });
  await t.test('cinco mecanismos têm metadados próprios persistentes',async()=>{
    for (const variant of [
      {kind:'episodic',metadata:{occurredAt:new Date().toISOString(),context:'estudos'}},
      {kind:'temporal',metadata:{dueAt:new Date().toISOString()}},
      {kind:'procedural',metadata:{steps:['Ler documentação'],execution:'manual'}},
      {kind:'relational',metadata:{from:'CRONOS',to:'Programação',relation:'inclui'}},
    ]) assert.equal((await request(mf,'/v1/memory','POST',{...memory,...variant},token)).status,201);
    assert.equal((await request(mf,'/v1/memory/search','GET',undefined,token)).data.memories.length,5);
  });
  await t.test('grafo contém nós reais, arestas e origem',async()=>{
    const a = await request(mf,'/v1/knowledge/nodes','POST',{label:'CRONOS',category:'projeto'},token);
    const b = await request(mf,'/v1/knowledge/nodes','POST',{label:'Programação',category:'tema'},token);
    assert.equal((await request(mf,'/v1/knowledge/edges','POST',{sourceId:a.data.id,targetId:b.data.id,relation:'usa',memoryId},token)).status,201);
    const graph = (await request(mf,'/v1/knowledge/graph','GET',undefined,token)).data;
    assert.equal(graph.nodes.length,2); assert.equal(graph.edges.length,3); assert.equal(graph.nodes[0].label,'CRONOS');
  });
  await t.test('isolamento entre usuários e permissão de leitura',async()=>{
    const other = crypto.randomUUID(), reader = crypto.randomUUID(), session = 'c'.repeat(64);
    await db.prepare('INSERT INTO users(id) VALUES (?)').bind(other).run();
    await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(reader,other,'reader',await hash('other'),'reader').run();
    await db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(session),reader,Math.floor(Date.now()/1000)+900).run();
    assert.equal((await request(mf,'/v1/memory/search','GET',undefined,session)).data.memories.length,0);
    assert.equal((await request(mf,'/v1/memory','POST',memory,session)).status,403);
    assert.equal((await request(mf,'/v1/data/export','GET',undefined,session)).status,403);
  });
  await t.test('lembretes opt-in não duplicados e cancelamento',async()=>{
    const dueAt = new Date(Date.now()+86400000).toISOString();
    const event = await request(mf,'/v1/events','POST',{title:'Prova',dueAt,notify:true},token);
    await request(mf,'/v1/events','POST',{title:'Sem aviso',dueAt},token);
    await schedule(db as any); await schedule(db as any);
    assert.equal((await request(mf,'/v1/reminders','GET',undefined,token)).data.items.length,1);
    await request(mf,`/v1/events/${event.data.id}`,'PATCH',{status:'completed'},token);
    assert.equal((await request(mf,'/v1/reminders','GET',undefined,token)).data.items.length,0);
  });
  await t.test('chat sem provedor falha explicitamente e não inventa respostas',async()=>{
    const r = await request(mf,'/v1/chat','POST',{message:'Olá'},token);
    assert.equal(r.status,503); assert.equal(r.data.error.code,'no_available_model');
  });
  await t.test('exportação sem segredos e exclusão com cascata',async()=>{
    const r = await request(mf,'/v1/data/export','GET',undefined,token);
    assert.equal(r.data.data.memories.length,5); assert.ok(!JSON.stringify(r.data).includes(credential));
    await request(mf,`/v1/memory/${memoryId}`,'DELETE',undefined,token);
    const remaining=(await request(mf,'/v1/knowledge/graph','GET',undefined,token)).data.edges;
    assert.equal(remaining.length,1); assert.ok(remaining.every((edge:any)=>edge.memory_id!==memoryId));
  });
  await t.test('revogação invalida sessão imediatamente',async()=>{
    assert.equal((await request(mf,`/v1/devices/${device}`,'DELETE',undefined,token)).status,200);
    assert.equal((await request(mf,'/v1/agents','GET',undefined,token)).status,401);
  });
});

test('memória e sessão sobrevivem à reinicialização do runtime',async()=>{
  const dir = mkdtempSync(join(tmpdir(),'cronos-persist-')); let mf = runtime(dir);
  try {
    await setup(mf); const token = await login(mf);
    await request(mf,'/v1/memory','POST',memory,token); await mf.dispose();
    mf = runtime(dir);
    assert.equal((await request(mf,'/v1/memory/search?q=CRONOS','GET',undefined,token)).data.memories.length,1);
  } finally { await mf.dispose(); rmSync(dir,{recursive:true,force:true}); }
});

test('gateway: fallback, limite persistente e privacidade (HTTP simulado)',async t=>{
  const mf = runtime(); t.after(()=>mf.dispose()); const db = await setup(mf);
  const config = ['groq','openrouter'].map(id=>({id,model:'test-fixture',enabled:true,freeTierVerified:true,verifiedAt:new Date().toISOString(),dailyRequestLimit:3,allowPersonalContext:true}));
  const env = {DB:db,PROVIDERS_JSON:JSON.stringify(config),GROQ_API_KEY:'TEST-ONLY',OPENROUTER_API_KEY:'TEST-ONLY'} as any;
  let calls = 0;
  const fakeFetch = (async (url:string)=>{calls++; return url.includes('groq') ? new Response('{}',{status:429,headers:{'Retry-After':'120'}}) : Response.json({choices:[{message:{content:'fixture'}}]});}) as any;
  const gateway = new ModelGateway(env,fakeFetch);
  assert.equal((await gateway.generate([{role:'user',content:'test'}],true)).provider,'openrouter');
  assert.equal(calls,2);
  await gateway.generate([{role:'user',content:'test'}],true); assert.equal(calls,3);
  env.PROVIDERS_JSON=JSON.stringify(config.map(c=>({...c,allowPersonalContext:false})));
  await assert.rejects(()=>gateway.generate([{role:'user',content:'private'}],true),/no_available_model/); assert.equal(calls,3);
  assert.equal(retrySeconds('120'),120);
});

test('datas relativas e seleção econômica de agentes',()=>{
  assert.equal(relativeDate('daqui a três semanas',new Date('2026-10-31T15:00:00Z')),'2026-11-21T15:00:00.000Z');
  assert.throws(()=>relativeDate('algum dia'),/date_needs_clarification/);
  assert.equal(selectAgent('Analise este erro'),'22'); assert.equal(selectAgent('Olá'),'01');
  assert.equal(catalog().length,40); assert.ok(catalog().every(a=>a.implementation !== 'implementado e operacional'));
});

test('chat integrado: resposta estruturada e conversa persistente (modelo simulado)',async t=>{
  const fetchMock = createFetchMock(); fetchMock.disableNetConnect();
  const endpoint = fetchMock.get('https://api.groq.com');
  endpoint.intercept({path:'/openai/v1/chat/completions',method:'POST'}).reply(200,{choices:[{message:{content:'Resposta de fixture, não IA real'}}]}).times(2);
  const providers = [{id:'groq',model:'fixture-only',enabled:true,freeTierVerified:true,verifiedAt:new Date().toISOString(),dailyRequestLimit:2,allowPersonalContext:true}];
  const mf = new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'chat'},fetchMock,bindings:{PROVIDERS_JSON:JSON.stringify(providers),GROQ_API_KEY:'TEST-ONLY'}});
  t.after(()=>mf.dispose()); const db = await setup(mf); const token = await login(mf);
  assert.equal((await request(mf,'/v1/providers/status','GET',undefined,token)).data.providers[0].configured,true);
  const first = await request(mf,'/v1/chat','POST',{message:'Meu projeto é CRONOS',remember:true},token);
  assert.equal(first.status,200); assert.equal(first.data.components[0].type,'text');
  const second = await request(mf,'/v1/chat','POST',{message:'Continuar',conversationId:first.data.conversationId},token);
  assert.equal(second.status,200);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM messages').first() as any).n,4);
  assert.equal((await request(mf,'/v1/memory/search?q=CRONOS','GET',undefined,token)).data.memories.length,1);
  assert.equal((await request(mf,'/v1/chat','POST',{message:'Limite'},token)).status,503);
  fetchMock.assertNoPendingInterceptors();
});

test('expiração, limite de autenticação e exclusão definitiva',async t=>{
  const mf = runtime(); t.after(()=>mf.dispose()); const db = await setup(mf);
  const token = await login(mf);
  await db.prepare('UPDATE sessions SET expires_at=0').run();
  assert.equal((await request(mf,'/v1/agents','GET',undefined,token)).status,401);
  const next = await login(mf);
  await request(mf,'/v1/memory','POST',memory,next);
  assert.equal((await request(mf,'/v1/data','DELETE',{confirm:'wrong'},next)).status,422);
  assert.equal((await request(mf,'/v1/data','DELETE',{confirm:'DELETE MY DATA'},next)).status,200);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM memories').first() as any).n,0);
  assert.equal((await request(mf,'/v1/agents','GET',undefined,next)).status,401);
  for (let i=0;i<8;i++) await request(mf,'/v1/auth/sessions','POST',{deviceId:device,credential});
  const limited = await request(mf,'/v1/auth/sessions','POST',{deviceId:device,credential});
  assert.equal(limited.status,429); assert.equal(limited.headers.get('Retry-After'),'60');
});

test('orquestração complexa executa análise, crítica e síntese com orçamento limitado',async t=>{
  const fetchMock=createFetchMock();fetchMock.disableNetConnect();
  fetchMock.get('https://api.groq.com').intercept({path:'/openai/v1/chat/completions',method:'POST'}).reply(200,{choices:[{message:{content:'Análise de fixture para validação do fluxo'}}]}).times(4);
  const providers=[{id:'groq',model:'fixture-only',enabled:true,freeTierVerified:true,verifiedAt:new Date().toISOString(),dailyRequestLimit:4,allowPersonalContext:true}];
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'complex'},fetchMock,bindings:{PROVIDERS_JSON:JSON.stringify(providers),GROQ_API_KEY:'TEST-ONLY'}});
  t.after(()=>mf.dispose());const db=await setup(mf);const token=await login(mf);
  const result=await request(mf,'/v1/chat','POST',{message:'Compare dois caminhos para meu objetivo',complex:true},token);
  assert.equal(result.status,200);assert.equal(result.data.status,'completed');assert.deepEqual(result.data.selectedAgents,['01','02','04']);
  const executions=(await db.prepare('SELECT agent_id,status FROM agent_executions ORDER BY agent_id').all()).results;
  assert.deepEqual(executions.map(e=>e.agent_id),['01','02','04','06']);assert.ok(executions.every(e=>e.status==='succeeded'));
  assert.equal((await db.prepare('SELECT requests FROM provider_usage').first() as any).requests,4);
  fetchMock.assertNoPendingInterceptors();
});

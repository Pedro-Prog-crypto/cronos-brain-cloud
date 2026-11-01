import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,createFetchMock} from 'miniflare';
import {migrate} from './migrate.mjs';
import {hash} from '../src/auth/auth';
import {parseNews} from '../src/capabilities/research';
import {cosine} from '../src/capabilities/vector';
import {deliverNotifications} from '../src/capabilities/actions';
import {pdfFixture} from './fixtures.mjs';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZS0AAAAASUVORK5CYII=';
test('capacidades multimodais, vetor e ações autorizadas',async t=>{
 const mock=createFetchMock();mock.disableNetConnect();const provider=mock.get('https://provider.test');
 provider.intercept({path:'/v1/chat/completions',method:'POST'}).reply(200,{choices:[{message:{content:'Resultado visual de fixture'}}]}).times(2);
 provider.intercept({path:'/v1/audio/transcriptions',method:'POST'}).reply(200,{text:'Texto transcrito de fixture'});
 provider.intercept({path:'/v1/audio/speech',method:'POST'}).reply(200,Buffer.from('audio-fixture'),{headers:{'Content-Type':'audio/mpeg'}});
 provider.intercept({path:'/v1/images/generations',method:'POST'}).reply(200,{data:[{b64_json:png}]});
 provider.intercept({path:'/v1/embeddings',method:'POST'}).reply(200,{data:[{embedding:[1,0,0]}]}).times(3);
 const configs=['vision','transcription','speech','image-generation','embedding'].map(kind=>({id:kind,kind,baseUrl:'https://provider.test/v1',model:'fixture-only',enabled:true,freeTierVerified:true,verifiedAt:new Date().toISOString(),dailyRequestLimit:10,allowPersonalContext:true}));
 const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'capabilities'},fetchMock:mock,bindings:{PROVIDERS_JSON:'[]',CAPABILITIES_JSON:JSON.stringify(configs),CAPABILITY_API_KEY:'TEST-ONLY',NOTIFICATION_SIGNING_KEY:'TEST-SIGNATURE',NOTIFICATION_ALLOWED_HOSTS_JSON:'["notify.test"]'}});
 t.after(()=>mf.dispose());const db=await mf.getD1Database('DB');await migrate(db);const user=crypto.randomUUID(),device=crypto.randomUUID(),session='8'.repeat(64);
 await db.prepare('INSERT INTO users(id) VALUES (?)').bind(user).run();await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(device,user,'test','disabled','owner').run();await db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(session),device,Math.floor(Date.now()/1000)+900).run();
 const req=async(path:string,method='GET',data?:unknown)=>{const r=await mf.dispatchFetch('https://brain.test'+path,{method,headers:{Authorization:`Bearer ${session}`,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json() as any};};
 const tool=(data:unknown)=>req('/v1/tools/execute','POST',data);
 await t.test('PDF é extraído de arquivo real sem modelo e sem OCR fictício',async()=>{
  const r=await tool({tool:'document.pdf',name:'teste.pdf',base64:pdfFixture()});assert.equal(r.status,200,JSON.stringify(r.data));assert.match(r.data.result.text,/CRONOS PDF real/);assert.equal(r.data.result.pages,1);
 });
 await t.test('visão e vídeo usam conteúdo enviado, com cobertura explícita de quadros',async()=>{
  const image={base64:png,mime:'image/png'};const r=await tool({tool:'vision.analyze',question:'Descreva',image});assert.equal(r.status,200);assert.equal(r.data.result.type,'vision');
  const v=await tool({tool:'video.analyze',question:'Analise',frames:[{atSeconds:0,image},{atSeconds:2,image}]});assert.equal(v.status,200);assert.equal(v.data.result.fullVideoAnalyzed,false);assert.equal(v.data.result.sampledFrames,2);
 });
 await t.test('transcrição, voz e geração de imagem usam contratos reais com HTTP simulado',async()=>{
  const a=await tool({tool:'speech.transcribe',audio:Buffer.from('audio fixture').toString('base64'),mime:'audio/wav'});assert.equal(a.status,200);assert.match(a.data.result.text,/fixture/);
  const voice=await tool({tool:'speech.synthesize',text:'Olá',voice:'configured-voice'});assert.equal(voice.status,200);assert.equal(voice.data.result.mime,'audio/mpeg');
  const image=await tool({tool:'image.generate',prompt:'Diagrama'});assert.equal(image.status,200);assert.equal(image.data.result.base64,png);
 });
 await t.test('vetores persistem, encontram memórias e são invalidados na edição',async()=>{
  const m=await req('/v1/memory','POST',{kind:'semantic',content:'Conhecimento científico',source:'user',metadata:{topics:[]}});const id=m.data.id;
  assert.equal((await tool({tool:'memory.vector.index',memoryId:id})).status,200);
  const search=await tool({tool:'memory.vector.search',query:'ciência'});assert.equal(search.data.result.matches[0].id,id);assert.equal(search.data.result.matches[0].score,1);
  await req('/v1/memory/'+id,'PUT',{expectedVersion:1,memory:{kind:'semantic',content:'Conhecimento atualizado',source:'user',metadata:{topics:[]}}});
  assert.equal((await tool({tool:'memory.vector.search',query:'ciência'})).data.result.matches.length,0);
 });
 await t.test('controle de dispositivo exige permissão específica e confirmação',async()=>{
  const command={deviceId:device,action:'show_notification',payload:'Aviso local',confirm:true};
  assert.equal((await req('/v1/commands','POST',command)).status,403);
  await req(`/v1/devices/${device}/permissions`,'PUT',{actions:['show_notification']});
  const r=await req('/v1/commands','POST',command);assert.equal(r.status,201);assert.equal(r.data.executed,false);
  assert.equal((await req('/v1/commands')).data.commands[0].id,r.data.id);
  assert.equal((await req(`/v1/commands/${r.data.id}/result`,'POST',{status:'succeeded',result:'Exibido'})).status,200);
  assert.equal((await req('/v1/commands')).data.commands.length,0);
 });
 await t.test('notificação externa é opt-in, assinada, idempotente e respeita falha 429',async()=>{
  assert.equal((await req('/v1/notifications/subscription','PUT',{url:'https://other.test/hook',enabled:true})).status,422);
  assert.equal((await req('/v1/notifications/subscription','PUT',{url:'https://notify.test/hook',enabled:true})).status,200);
  const event=crypto.randomUUID(),reminder=crypto.randomUUID();await db.prepare('INSERT INTO events(id,user_id,title,due_at,status,notify,created_at) VALUES (?,?,?,?,?,?,?)').bind(event,user,'Prova',new Date(Date.now()+86400000).toISOString(),'active',1,new Date().toISOString()).run();await db.prepare('INSERT INTO reminders(id,event_id,user_id,created_at) VALUES (?,?,?,?)').bind(reminder,event,user,new Date().toISOString()).run();
  const env={DB:db,NOTIFICATION_SIGNING_KEY:'TEST-SIGNATURE',NOTIFICATION_ALLOWED_HOSTS_JSON:'["notify.test"]'} as any;let calls=0;
  const fail=(async()=>{calls++;return new Response('',{status:429,headers:{'Retry-After':'180'}});}) as any;
  await deliverNotifications(env,fail);await deliverNotifications(env,fail);assert.equal(calls,1);
  await db.prepare('UPDATE notification_deliveries SET next_attempt=0').run();
  await db.prepare('UPDATE reminders SET seen_at=? WHERE id=?').bind(new Date().toISOString(),reminder).run();
  await deliverNotifications(env,fail);assert.equal(calls,1,'Acknowledged reminders must not be retried');
  await db.prepare('UPDATE reminders SET seen_at=NULL WHERE id=?').bind(reminder).run();
  await deliverNotifications(env,(async(_url:string,options:any)=>{assert.equal(options.headers['Idempotency-Key'],reminder);assert.match(options.headers['X-Cronos-Signature'],/^[a-f0-9]{64}$/);return new Response('',{status:200});}) as any);
  assert.equal((await db.prepare('SELECT status FROM notification_deliveries').first() as any).status,'delivered');
 });
 mock.assertNoPendingInterceptors();
});
test('notícias rejeitam datas inválidas, entidades XML e URLs fora da fonte',()=>{
 const now=new Date('2026-11-01T15:00:00Z');const xml='<rss><channel><item><title>Ciência</title><link>https://news.test/article</link><pubDate>Sun, 01 Nov 2026 12:00:00 GMT</pubDate></item><item><title>Sem data</title><link>https://news.test/invalid</link></item></channel></rss>';
 assert.equal(parseNews(xml,['news.test'],now).length,1);assert.equal(parseNews(xml,['other.test'],now).length,0);assert.throws(()=>parseNews('<!DOCTYPE x>'+xml,['news.test'],now));assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);
});

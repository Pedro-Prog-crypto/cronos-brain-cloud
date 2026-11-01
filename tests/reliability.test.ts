import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare} from 'miniflare';
import {hash} from '../src/auth/auth';
import {relativeDate,schedule} from '../src/core/time';

test('datas em português: acentos, limites e ambiguidades',()=>{
 const now=new Date('2026-11-01T15:00:00Z');
 for(const [expression,days]of [['amanhã',1],['AMANHÃ!',1],['depois de amanhã',2],['hoje',0],['Minha prova será daqui a três semanas.',21],['daqui a duas semanas',14],['daqui a dez dias',10]] as const)assert.equal(relativeDate(expression,now),new Date(now.getTime()+days*86400000).toISOString());
 for(const expression of ['amanhã ou daqui a três dias','não amanhã','daqui a 0 dias','daqui a 999 semanas','amanhãzinha','algum dia'])assert.throws(()=>relativeDate(expression,now),/date_needs_clarification/);
});

test('busca indexada e agenda confiável após migração',async t=>{
 const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'reliability'},bindings:{PROVIDERS_JSON:'[]'}});
 t.after(()=>mf.dispose());const db=await mf.getD1Database('DB');
 for(const name of ['0001_foundation.sql','0002_operations.sql'])await db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8').replace(/\n/g,' '));
 const user=crypto.randomUUID(),device=crypto.randomUUID(),session='9'.repeat(64),id=crypto.randomUUID(),now=new Date().toISOString();
 await db.prepare('INSERT INTO users(id) VALUES (?)').bind(user).run();
 await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(device,user,'test','test','owner').run();
 await db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(session),device,Math.floor(Date.now()/1000)+900).run();
 await db.prepare('INSERT INTO memories(id,user_id,kind,content,source,confidence,metadata,fingerprint,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,user,'semantic','Programação e matemática aplicada','user',1,'{"topics":[]}','legacy-fingerprint',now,now).run();
 await db.exec(readFileSync(new URL('../migrations/0003_memory_search.sql',import.meta.url),'utf8').replace(/\n/g,' '));
 const req=async(path:string,method='GET',data?:unknown)=>{
  const r=await mf.dispatchFetch('https://brain.test'+path,{method,headers:{Authorization:`Bearer ${session}`,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json() as any};
 };
 await t.test('migração indexa dados existentes; busca ignora acentos e suporta prefixos',async()=>{
  for(const q of ['programacao','matematica','matem','programação matemática']){const r=await req('/v1/memory/search?q='+encodeURIComponent(q));assert.equal(r.status,200);assert.equal(r.data.memories[0].id,id);}
  assert.equal((await req('/v1/memory/search?q=%22%20OR%20%2A')).data.memories.length,0);
 });
 await t.test('índice acompanha edição e exclusão, mantendo isolamento entre usuários',async()=>{
  const other=crypto.randomUUID();await db.prepare('INSERT INTO users(id) VALUES (?)').bind(other).run();
  await db.prepare('INSERT INTO memories(id,user_id,kind,content,source,confidence,metadata,fingerprint,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),other,'semantic','Astrofísica secreta','user',1,'{"topics":[]}','private',now,now).run();
  assert.equal((await req('/v1/memory/search?q=astrofisica')).data.memories.length,0);
  assert.equal((await req('/v1/memory/'+id,'PUT',{expectedVersion:1,memory:{kind:'semantic',content:'Aprender astrofísica',source:'user',metadata:{topics:[]}}})).status,200);
  assert.equal((await req('/v1/memory/search?q=matematica')).data.memories.length,0);
  assert.equal((await req('/v1/memory/search?q=astrofisica')).data.memories.length,1);
  await req('/v1/memory/'+id,'DELETE');assert.equal((await req('/v1/memory/search?q=astrofisica')).data.memories.length,0);
 });
 await t.test('desativar lembrete remove aviso já criado e impede recriação',async()=>{
  const r=await req('/v1/events','POST',{title:'Compromisso',dueAt:new Date(Date.now()+3600000).toISOString(),notify:true});
  await schedule(db as any,new Date(),user);assert.equal((await req('/v1/reminders')).data.items.length,1);
  await req('/v1/events/'+r.data.id,'PATCH',{notify:false});assert.equal((await req('/v1/reminders')).data.items.length,0);
  await schedule(db as any,new Date(),user);assert.equal((await req('/v1/reminders')).data.items.length,0);
 });
 await t.test('agendador avança além do primeiro lote sem duplicar avisos',async()=>{
  const due=new Date(Date.now()+7200000).toISOString();
  await db.batch(Array.from({length:205},(_,i)=>db.prepare('INSERT INTO events(id,user_id,title,due_at,status,notify,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),user,`Evento ${i}`,due,'active',1,now)));
  await schedule(db as any,new Date(),user);assert.equal((await db.prepare('SELECT count(*) AS n FROM reminders WHERE user_id=?').bind(user).first() as any).n,200);
  await schedule(db as any,new Date(),user);await schedule(db as any,new Date(),user);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM reminders WHERE user_id=?').bind(user).first() as any).n,205);
 });
});

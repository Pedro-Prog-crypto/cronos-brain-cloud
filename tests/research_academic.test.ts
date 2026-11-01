import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare, createFetchMock } from 'miniflare';
import { migrate } from './migrate.mjs';
import { hash } from '../src/auth/auth';

test('artigos acadêmicos vêm do Crossref, sem alegar revisão das afirmações', async t => {
  const mock=createFetchMock();mock.disableNetConnect();
  mock.get('https://api.crossref.org').intercept({method:'GET',path:/^\/works\?/}).reply(200,{message:{items:[
    {DOI:'10.1234/example',title:['Pesquisa sobre CRONOS'],author:[{given:'Ana',family:'Silva'}],published:{'date-parts':[[2025,9,3]]},'container-title':['Revista de Teste']},
    {title:['Sem DOI']},
  ]}});
  const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'academic'},fetchMock:mock,bindings:{PROVIDERS_JSON:'[]',WEB_ENABLED:'true'}});
  t.after(()=>mf.dispose());
  const db=await mf.getD1Database('DB');await migrate(db);
  const user=crypto.randomUUID(),device=crypto.randomUUID(),session='a'.repeat(64);
  await db.prepare('INSERT INTO users(id) VALUES (?)').bind(user).run();
  await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(device,user,'test','test','owner').run();
  await db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(session),device,Math.floor(Date.now()/1000)+900).run();
  const response=await mf.dispatchFetch('https://brain.test/v1/tools/execute',{method:'POST',headers:{Authorization:`Bearer ${session}`,'Content-Type':'application/json'},body:JSON.stringify({tool:'academic.search',query:'CRONOS'})});
  assert.equal(response.status,200);
  const data=await response.json() as any;
  assert.equal(data.result.sources.length,1);
  assert.equal(data.result.sources[0].doi,'10.1234/example');
  assert.equal(data.result.claimsVerified,false);
});

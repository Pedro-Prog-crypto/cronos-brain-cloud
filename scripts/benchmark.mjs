import { Miniflare } from 'miniflare';
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash,randomUUID } from 'node:crypto';
const mf=new Miniflare({modules:true,scriptPath:'dist/worker.mjs',compatibilityDate:'2026-07-30',d1Databases:{DB:'benchmark'},bindings:{PROVIDERS_JSON:'[]'}});
try{
 const db=await mf.getD1Database('DB');
 for(const name of ['0001_foundation.sql','0002_operations.sql'])await db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8').replace(/\n/g,' '));
 const user=randomUUID(),device=randomUUID(),session='1'.repeat(64);
 await db.prepare('INSERT INTO users(id) VALUES (?)').bind(user).run();
 await db.prepare('INSERT INTO devices VALUES (?,?,?,?,?,NULL)').bind(device,user,'benchmark','disabled','owner').run();
 await db.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(createHash('sha256').update(session).digest('hex'),device,Math.floor(Date.now()/1000)+900).run();
 for(let chunk=0;chunk<10;chunk++)await db.batch(Array.from({length:50},(_,n)=>{const i=chunk*50+n;return db.prepare('INSERT INTO memories(id,user_id,kind,content,source,confidence,metadata,fingerprint,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(randomUUID(),user,'semantic',`Benchmark assunto ${i}`,'test',1,'{"topics":[]}',String(i),new Date().toISOString(),new Date().toISOString());}));
 const latencies=[];
 for(let i=0;i<30;i++){const start=performance.now();const response=await mf.dispatchFetch('https://brain.test/v1/memory/search?q=assunto',{headers:{Authorization:`Bearer ${session}`}});const result=await response.json();if(response.status!==200||result.memories.length!==30)throw Error('Unexpected benchmark response');latencies.push(performance.now()-start);}
 latencies.sort((a,b)=>a-b);
 const result={environment:'Miniflare local; não representa latência de produção ou IA',datasetMemories:500,queries:30,resultLimit:30,p50Ms:Number(latencies[14].toFixed(2)),p95Ms:Number(latencies[28].toFixed(2)),maxMs:Number(latencies[29].toFixed(2)),measuredAt:new Date().toISOString()};
 writeFileSync('docs/benchmark.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await mf.dispose();}

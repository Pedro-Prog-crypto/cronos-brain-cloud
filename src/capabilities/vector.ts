import {z} from 'zod';
import {ApiError,type Env,type Principal} from '../types';
import {CapabilityGateway} from './gateway';
export const vectorInput=z.discriminatedUnion('tool',[
 z.object({tool:z.literal('memory.vector.index'),memoryId:z.string().uuid()}).strict(),
 z.object({tool:z.literal('memory.vector.search'),query:z.string().min(1).max(4000)}).strict(),
]);
export function cosine(a:number[],b:number[]){if(a.length!==b.length||!a.length)return 0;let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa&&bb?dot/Math.sqrt(aa*bb):0;}
async function embed(env:Env,text:string){const r=await new CapabilityGateway(env).request('embedding','/embeddings',{input:text});const value=z.object({data:z.array(z.object({embedding:z.array(z.number().finite().min(-1e10).max(1e10)).min(1).max(4096)})).min(1)}).safeParse(r.data);if(!value.success)throw new ApiError(502,'invalid_embedding');return {vector:value.data.data[0].embedding,key:r.modelKey};}
export async function executeVector(env:Env,p:Principal,input:z.infer<typeof vectorInput>){
 if(input.tool==='memory.vector.index'){
  const memory=await env.DB.prepare('SELECT content,version FROM memories WHERE id=? AND user_id=?').bind(input.memoryId,p.userId).first<{content:string;version:number}>();if(!memory)throw new ApiError(404,'memory_not_found');
  const e=await embed(env,memory.content);
  const result=await env.DB.prepare('INSERT OR REPLACE INTO memory_vectors SELECT id,user_id,?,?,?,?,? FROM memories WHERE id=? AND user_id=? AND version=? RETURNING memory_id').bind(e.key,e.vector.length,JSON.stringify(e.vector),memory.version,new Date().toISOString(),input.memoryId,p.userId,memory.version).first();
  if(!result)throw new ApiError(409,'memory_changed_during_embedding');return {indexed:true,memoryId:input.memoryId,dimensions:e.vector.length};
 }
 const e=await embed(env,input.query);
 const rows=(await env.DB.prepare('SELECT m.id,m.content,m.source,v.vector FROM memory_vectors v JOIN memories m ON m.id=v.memory_id WHERE v.user_id=? AND m.user_id=? AND v.model_key=? AND v.memory_version=m.version LIMIT 1001').bind(p.userId,p.userId,e.key).all<{id:string;content:string;source:string;vector:string}>()).results;
 if(rows.length>1000)throw new ApiError(413,'vector_store_migration_required');
 return {type:'semantic-memories',modelKey:e.key,matches:rows.map(row=>({id:row.id,content:row.content,source:row.source,score:cosine(e.vector,JSON.parse(row.vector))})).sort((a,b)=>b.score-a.score).slice(0,6)};
}

import {hash} from '../auth/auth';
import { z } from 'zod';
import { ApiError,type Env } from '../types';
import { retrySeconds } from '../providers/gateway';
export const capabilityKind=z.enum(['vision','transcription','speech','image-generation','embedding']);
const configSchema=z.array(z.object({id:z.string().regex(/^[a-z0-9-]{1,40}$/),kind:capabilityKind,baseUrl:z.url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash;}),model:z.string().min(1).max(150),enabled:z.boolean(),freeTierVerified:z.boolean(),verifiedAt:z.iso.datetime(),dailyRequestLimit:z.number().int().min(1).max(500),allowPersonalContext:z.boolean()}).strict()).max(20).refine(rows=>new Set(rows.map(r=>r.id)).size===rows.length);
export type CapabilityConfig=z.infer<typeof configSchema>[number];
export function capabilityConfigs(env:Env){try{return configSchema.parse(JSON.parse(env.CAPABILITIES_JSON??'[]'));}catch{throw new ApiError(503,'invalid_capability_configuration');}}
export function configured(env:Env,c:CapabilityConfig){const age=Date.now()-Date.parse(c.verifiedAt);return c.enabled&&c.freeTierVerified&&c.allowPersonalContext&&age>=0&&age<30*86400000&&!!env.CAPABILITY_API_KEY;}
export async function limitedBytes(response:Response,maximum=8_000_000){
 const reader=response.body?.getReader();if(!reader)throw new ApiError(502,'empty_provider_response');
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>maximum){await reader.cancel();throw new ApiError(502,'provider_response_too_large');}chunks.push(value);}
 const result=new Uint8Array(length);let offset=0;for(const c of chunks){result.set(c,offset);offset+=c.length;}return result;
}
export function fromBase64(value:string){try{return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}catch{throw new ApiError(422,'invalid_base64');}}
export function toBase64(value:Uint8Array){let text='';for(let i=0;i<value.length;i+=8192)text+=String.fromCharCode(...value.slice(i,i+8192));return btoa(text);}
export class CapabilityGateway {
 constructor(private env:Env,private fetcher:typeof fetch=(...args)=>fetch(...args)){}
 async request(kind:z.infer<typeof capabilityKind>,path:string,payload:Record<string,unknown>|FormData,binary=false){
  const candidates=capabilityConfigs(this.env).filter(c=>c.kind===kind&&configured(this.env,c)).slice(0,2);
  for(const c of candidates){
   const provider=`capability:${c.id}`,day=new Date().toISOString().slice(0,10),now=Date.now();
   if(await this.env.DB.prepare('SELECT provider FROM provider_usage WHERE provider=? AND blocked_until>? LIMIT 1').bind(provider,now).first())continue;
   if(!await this.env.DB.prepare('INSERT INTO provider_usage(provider,day,requests,blocked_until) VALUES (?,?,1,0) ON CONFLICT(provider,day) DO UPDATE SET requests=requests+1 WHERE requests<? AND blocked_until<=? RETURNING requests').bind(provider,day,c.dailyRequestLimit,now).first())continue;
   try{
    const form=payload instanceof FormData;if(form)payload.set('model',c.model);
    const response=await this.fetcher(c.baseUrl.replace(/\/$/,'')+path,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${this.env.CAPABILITY_API_KEY}`,...(!form?{'Content-Type':'application/json'}:{})},body:form?payload:JSON.stringify({...payload,model:c.model})});
    if(response.status===429){await response.body?.cancel();await this.env.DB.prepare('UPDATE provider_usage SET blocked_until=? WHERE provider=? AND day=?').bind(Date.now()+retrySeconds(response.headers.get('Retry-After'))*1000,provider,day).run();continue;}
    if(!response.ok){await response.body?.cancel();continue;}
    const bytes=await limitedBytes(response);let data:unknown=bytes;
    if(!binary){try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ApiError(502,'invalid_capability_response');}}
    return {data,provider:c.id,model:c.model,modelKey:await hash(JSON.stringify([c.id,c.kind,c.model,c.baseUrl])),contentType:response.headers.get('Content-Type')??''};
   }catch{/* Try at most one compatible fallback; never log personal payloads. */}
  }
  throw new ApiError(503,`capability_unavailable:${kind}`);
 }
}

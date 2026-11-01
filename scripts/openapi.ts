import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { chatSchema,memorySchema,eventSchema,sessionSchema,titleSchema } from '../src/api/schemas';
import { preferencesSchema } from '../src/api/operations';
import { toolInput } from '../src/tools/registry';
import { envelopeSchema } from '../src/storage/backup';
const uuid=z.string().uuid(),text=z.string().min(1).max(8000),label=z.string().min(1).max(120);
const schemas:Record<string,z.ZodType>={
  ChatRequest:chatSchema,Memory:memorySchema,Event:eventSchema,SessionRequest:sessionSchema,Title:titleSchema,Settings:preferencesSchema,ToolInput:toolInput,Backup:envelopeSchema,
  MemoryUpdate:z.object({expectedVersion:z.number().int().positive(),memory:memorySchema}).strict(),
  MemoryReview:z.object({ids:z.array(uuid).min(1).max(10),mode:z.enum(['consolidate','audit'])}).strict(),
  Node:z.object({label,category:z.string().min(1).max(60)}).strict(),Edge:z.object({sourceId:uuid,targetId:uuid,relation:label,memoryId:uuid}).strict(),
  Status:z.object({status:z.enum(['completed','cancelled'])}).strict(),
  EventUpdate:z.object({status:z.enum(['active','completed','cancelled']).optional(),dueAt:z.iso.datetime({offset:true}).optional(),title:label.optional(),recurrenceDays:z.number().int().min(0).max(366).optional(),notify:z.boolean().optional()}).strict(),
  EventPlan:z.object({title:label,expression:z.string().min(1).max(300),notify:z.boolean().default(false)}).strict(),
  Time:z.object({expression:z.string().min(1).max(300)}).strict(),Device:z.object({name:label,role:z.enum(['reader','owner'])}).strict(),
  Restore:z.object({confirm:z.literal('RESTORE INTO EMPTY ACCOUNT'),backup:envelopeSchema}).strict(),
  Delete:z.object({confirm:z.literal('DELETE MY DATA')}).strict(),AgentInput:z.object({message:text}).strict(),
  Error:z.object({error:z.object({code:z.string(),requestId:uuid})}),
  ChatResponse:z.object({conversationId:uuid,text:z.string(),status:z.literal('completed'),components:z.array(z.object({type:z.literal('text'),text:z.string()})),sources:z.array(z.unknown()),memoriesUsed:z.array(z.string()),events:z.array(z.unknown()),toolsExecuted:z.array(z.unknown()),agentId:z.string(),selectedAgents:z.array(z.string()),provider:z.string(),cached:z.boolean(),warnings:z.array(z.string())}),
};
const routes:[string,string,string?,number?][]=[
 ['get','/v1/health'],['post','/v1/auth/sessions','SessionRequest',201],['post','/v1/auth/logout'],['post','/v1/chat','ChatRequest'],
 ['post','/v1/memory','Memory',201],['get','/v1/memory/search'],['put','/v1/memory/{id}','MemoryUpdate'],['delete','/v1/memory/{id}'],['get','/v1/memory/{id}/versions'],['post','/v1/memory/review','MemoryReview'],
 ['get','/v1/knowledge/graph'],['get','/v1/knowledge/graph/search'],['post','/v1/knowledge/nodes','Node',201],['post','/v1/knowledge/edges','Edge',201],['delete','/v1/knowledge/nodes/{id}'],['delete','/v1/knowledge/edges/{id}'],
 ...['tasks','goals'].flatMap(t=>[['get','/v1/'+t],['post','/v1/'+t,'Title',201],['get','/v1/'+t+'/{id}'],['patch','/v1/'+t+'/{id}','Status']] as [string,string,string?,number?][]),
 ['get','/v1/events'],['post','/v1/events','Event',201],['get','/v1/events/{id}'],['patch','/v1/events/{id}','EventUpdate'],['post','/v1/events/plan','EventPlan',201],['post','/v1/time/resolve','Time'],
 ['get','/v1/reminders'],['post','/v1/reminders/{id}/ack'],['post','/v1/scheduler/run'],['get','/v1/agents'],['post','/v1/agents/{id}/run','AgentInput'],['get','/v1/providers/status'],
 ['get','/v1/tools'],['post','/v1/tools/execute','ToolInput'],['get','/v1/documents'],['delete','/v1/documents/{id}'],
 ['get','/v1/devices'],['post','/v1/devices','Device',201],['delete','/v1/devices/{id}'],['get','/v1/settings'],['put','/v1/settings','Settings'],['get','/v1/diagnostics'],
 ['get','/v1/data/export'],['delete','/v1/data','Delete'],['get','/v1/backup/export'],['post','/v1/backup/restore','Restore'],
];
const paths:Record<string,Record<string,unknown>>={};
for(const [method,path,schema,status=200] of routes){
 const response=path==='/v1/chat'?'ChatResponse':path.endsWith('/export')?'Backup':null;
 const operation:Record<string,unknown>={operationId:method+path.replace(/[/{}/]/g,'_'),summary:method.toUpperCase()+' '+path,responses:{[status]:{description:'Sucesso',content:{'application/json':{schema:response?{$ref:'#/components/schemas/'+response}:{type:'object',additionalProperties:true}}}},...Object.fromEntries([400,401,403,404,409,413,415,422,429,500,503].map(code=>[code,{description:'Erro: consulte API.md',content:{'application/json':{schema:{$ref:'#/components/schemas/Error'}}}}]))}};
 if(schema)operation.requestBody={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/'+schema}}}};
 if(path.includes('{id}'))operation.parameters=[{name:'id',in:'path',required:true,schema:{type:'string',...(path.includes('/agents/')?{pattern:'^[0-9]{2}$'}:{format:'uuid'})}}];
 if(path.endsWith('/search'))operation.parameters=[{name:'q',in:'query',schema:{type:'string',maxLength:500}},...(path.includes('/memory/')?[{name:'kind',in:'query',schema:{type:'string',enum:['episodic','semantic','temporal','procedural','relational']}}]:[])];
 if(path==='/v1/health'||path==='/v1/auth/sessions')operation.security=[];
 if(path==='/v1/chat')operation.description='Accept: text/event-stream ativa eventos progress, result e error. A inferência atual é bufferizada: não transmite tokens individualmente.';
 (paths[path]??={})[method]=operation;
}
const document={openapi:'3.1.0',info:{title:'CRONOS BRAIN CLOUD',version:'0.2.0',description:'API privada. Escritas exigem owner, exceto logout. Consulte API.md para limites operacionais.'},security:[{session:[]}],paths,components:{securitySchemes:{session:{type:'http',scheme:'bearer'}},schemas:Object.fromEntries(Object.entries(schemas).map(([name,s])=>[name,z.toJSONSchema(s,{io:'input'})]))}};
writeFileSync('docs/openapi.json',JSON.stringify(document,null,2)+'\n');
console.log(`${routes.length} operações documentadas em OpenAPI 3.1.`);

import {z} from 'zod';
import {ApiError,type Env,type Principal} from '../types';
import {body,json} from '../api/http';
import {audit} from '../storage/store';
import {quietNow} from '../core/time';
import {retrySeconds} from '../providers/gateway';
export const deviceAction=z.enum(['show_notification','open_panel','report_status']);
export const commandSchema=z.object({deviceId:z.string().uuid(),action:deviceAction,payload:z.string().max(2000),confirm:z.literal(true)}).strict();
export async function queueCommand(env:Env,p:Principal,input:z.infer<typeof commandSchema>){
 const allowed=await env.DB.prepare('SELECT d.id FROM devices d JOIN device_permissions p ON p.device_id=d.id WHERE d.id=? AND d.user_id=? AND d.revoked_at IS NULL AND p.action=?').bind(input.deviceId,p.userId,input.action).first();
 if(!allowed)throw new ApiError(403,'device_action_not_granted');
 const id=crypto.randomUUID(),now=new Date();await env.DB.prepare('INSERT INTO device_commands(id,user_id,device_id,action,payload,created_at,expires_at) VALUES (?,?,?,?,?,?,?)').bind(id,p.userId,input.deviceId,input.action,input.payload,now.toISOString(),new Date(now.getTime()+300000).toISOString()).run();
 await audit(env.DB,p.userId,'device.command',id);return {id,status:'pending',executed:false};
}
function webhookUrl(env:Env,value:string){
 let hosts:string[];try{hosts=z.array(z.string()).max(20).parse(JSON.parse(env.NOTIFICATION_ALLOWED_HOSTS_JSON??'[]'));}catch{throw new ApiError(503,'notification_hosts_invalid');}
 const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.hash||(u.port&&u.port!=='443')||!hosts.includes(u.hostname)||!/[a-z]/i.test(u.hostname)||!u.hostname.includes('.'))throw new ApiError(422,'webhook_destination_not_allowed');return u.href;
}
export async function actionRoutes(r:Request,env:Env,p:Principal){
 const path=new URL(r.url).pathname;
 if(/^\/v1\/devices\/[^/]+\/permissions$/.test(path)&&r.method==='PUT'){
  const input=await body(r,z.object({actions:z.array(deviceAction).max(3)}).strict());const id=path.split('/')[3];
  if(!await env.DB.prepare('SELECT id FROM devices WHERE id=? AND user_id=? AND revoked_at IS NULL').bind(id,p.userId).first())throw new ApiError(404,'device_not_found');
  await env.DB.batch([env.DB.prepare('DELETE FROM device_permissions WHERE device_id=?').bind(id),...input.actions.map(action=>env.DB.prepare('INSERT OR IGNORE INTO device_permissions VALUES (?,?)').bind(id,action))]);
  await audit(env.DB,p.userId,'device.permissions',id);return json({updated:true});
 }
 if(path==='/v1/commands'&&r.method==='POST')return json(await queueCommand(env,p,await body(r,commandSchema)),201);
 if(path==='/v1/commands'&&r.method==='GET')return json({commands:(await env.DB.prepare("SELECT id,action,payload,expires_at FROM device_commands WHERE device_id=? AND user_id=? AND status='pending' AND expires_at>? AND action IN (SELECT action FROM device_permissions WHERE device_id=?) ORDER BY created_at LIMIT 10").bind(p.deviceId,p.userId,new Date().toISOString(),p.deviceId).all()).results});
 if(/^\/v1\/commands\/[^/]+\/result$/.test(path)&&r.method==='POST'){
  const input=await body(r,z.object({status:z.enum(['succeeded','failed']),result:z.string().max(2000)}).strict());
  const row=await env.DB.prepare("UPDATE device_commands SET status=?,result=? WHERE id=? AND device_id=? AND user_id=? AND status='pending' AND expires_at>? AND action IN (SELECT action FROM device_permissions WHERE device_id=?) RETURNING id").bind(input.status,input.result,path.split('/')[3],p.deviceId,p.userId,new Date().toISOString(),p.deviceId).first();
  if(!row)throw new ApiError(409,'command_expired_or_unavailable');return json({recorded:true});
 }
 if(path==='/v1/notifications/subscription'&&r.method==='GET')return json({subscription:await env.DB.prepare('SELECT url,enabled FROM notification_subscriptions WHERE user_id=?').bind(p.userId).first()});
 if(path==='/v1/notifications/subscription'&&r.method==='PUT'){
  const input=await body(r,z.object({url:z.url(),enabled:z.boolean()}).strict());const url=webhookUrl(env,input.url);
  if(input.enabled&&!env.NOTIFICATION_SIGNING_KEY)throw new ApiError(503,'notification_signing_not_configured');
  await env.DB.prepare('INSERT INTO notification_subscriptions VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET url=excluded.url,enabled=excluded.enabled').bind(p.userId,url,Number(input.enabled)).run();
  await audit(env.DB,p.userId,'notification.subscription',p.userId);return json({updated:true});
 }
 return null;
}
export async function deliverNotifications(env:Env,fetcher:typeof fetch=(...args)=>fetch(...args)){
 if(!env.NOTIFICATION_SIGNING_KEY)return;
 await env.DB.prepare("INSERT OR IGNORE INTO notification_deliveries(reminder_id,user_id) SELECT r.id,r.user_id FROM reminders r JOIN notification_subscriptions s ON s.user_id=r.user_id JOIN events e ON e.id=r.event_id WHERE s.enabled=1 AND e.notify=1 AND e.status='active' AND r.seen_at IS NULL").run();
 const rows=(await env.DB.prepare("SELECT d.reminder_id,d.user_id,s.url,e.title,e.due_at,u.timezone,p.quiet_start,p.quiet_end FROM notification_deliveries d JOIN notification_subscriptions s ON s.user_id=d.user_id JOIN reminders r ON r.id=d.reminder_id JOIN events e ON e.id=r.event_id JOIN users u ON u.id=d.user_id LEFT JOIN preferences p ON p.user_id=d.user_id WHERE s.enabled=1 AND r.seen_at IS NULL AND e.status='active' AND e.notify=1 AND d.status!='delivered' AND d.attempts<3 AND d.next_attempt<=? AND d.lease_until<=? ORDER BY d.next_attempt LIMIT 10").bind(Date.now(),Date.now()).all<{reminder_id:string;user_id:string;url:string;title:string;due_at:string;timezone:string;quiet_start:number|null;quiet_end:number|null}>()).results;
 for(const row of rows){
  if(row.quiet_start!==null&&quietNow(new Date(),row.timezone,row.quiet_start,row.quiet_end!))continue;
  const claim=await env.DB.prepare("UPDATE notification_deliveries SET attempts=attempts+1,lease_until=? WHERE reminder_id=? AND status!='delivered' AND attempts<3 AND lease_until<=? AND next_attempt<=? RETURNING attempts").bind(Date.now()+30000,row.reminder_id,Date.now(),Date.now()).first<{attempts:number}>();if(!claim)continue;
  let delay=60*2**claim.attempts,code='delivery_failed';
  try{
   const url=webhookUrl(env,row.url);const payload=JSON.stringify({id:row.reminder_id,title:row.title,dueAt:row.due_at});
   const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.NOTIFICATION_SIGNING_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
   const signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload))),b=>b.toString(16).padStart(2,'0')).join('');
   const r=await fetcher(url,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(5000),headers:{'Content-Type':'application/json','X-Cronos-Signature':signature,'Idempotency-Key':row.reminder_id},body:payload});
   if(r.ok){await r.body?.cancel();await env.DB.prepare("UPDATE notification_deliveries SET status='delivered',lease_until=0,error_code=NULL WHERE reminder_id=?").bind(row.reminder_id).run();continue;}
   if(r.status===429)delay=Math.max(delay,retrySeconds(r.headers.get('Retry-After')));await r.body?.cancel();code='http_'+r.status;
  }catch(e){code=e instanceof ApiError?e.code:'delivery_failed';}
  await env.DB.prepare("UPDATE notification_deliveries SET status='failed',lease_until=0,next_attempt=?,error_code=? WHERE reminder_id=?").bind(Date.now()+delay*1000,code,row.reminder_id).run();
 }
}

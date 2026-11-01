import { ApiError } from '../types';
export function relativeDate(text: string, now = new Date()): string {
  const normalized = text.toLowerCase().replace(/três/g,'3').replace(/duas|dois/g,'2').replace(/uma|um/g,'1');
  const match = /daqui a (\d{1,3}) (dia|semana)s?/.exec(normalized);
  const days = /\bamanhã\b/u.test(normalized) ? 1 : match ? Number(match[1]) * (match[2] === 'semana' ? 7 : 1) : 0;
  if (!days || days > 366) throw new ApiError(422,'date_needs_clarification');
  return new Date(now.getTime()+days*86400000).toISOString();
}
export function quietNow(now:Date,timezone:string,start:number,end:number) {
  if(start===end)return false;
  const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:timezone,hour:'2-digit',hourCycle:'h23'}).format(now));
  return start<end ? hour>=start&&hour<end : hour>=start||hour<end;
}
export async function schedule(db: D1Database, now = new Date(), userId:string|null = null) {
  const events=(await db.prepare(`SELECT e.id,e.user_id,u.timezone,p.quiet_start,p.quiet_end FROM events e
    JOIN users u ON e.user_id=u.id LEFT JOIN preferences p ON p.user_id=e.user_id
    WHERE e.status='active' AND e.notify=1 AND e.due_at>=? AND e.due_at<=? AND (? IS NULL OR e.user_id=?) LIMIT 200`)
    .bind(now.toISOString(),new Date(now.getTime()+3*86400000).toISOString(),userId,userId).all<{id:string;user_id:string;timezone:string;quiet_start:number|null;quiet_end:number|null}>()).results;
  for(const e of events) {
    // Legacy users without preferences keep explicit event opt-in behavior.
    if(e.quiet_start!==null&&quietNow(now,e.timezone,e.quiet_start,e.quiet_end!))continue;
    await db.prepare('INSERT OR IGNORE INTO reminders(id,event_id,user_id,created_at) VALUES (?,?,?,?)').bind(crypto.randomUUID(),e.id,e.user_id,now.toISOString()).run();
  }
  const retention=(await db.prepare('SELECT user_id,retention_days FROM preferences WHERE retention_days>0 AND (? IS NULL OR user_id=?) LIMIT 100').bind(userId,userId).all<{user_id:string;retention_days:number}>()).results;
  for(const pref of retention) {
    // Explicitly opted-in retention applies only to episodic records. Preserve semantic knowledge.
    await db.prepare("DELETE FROM memories WHERE user_id=? AND kind='episodic' AND updated_at<?").bind(pref.user_id,new Date(now.getTime()-pref.retention_days*86400000).toISOString()).run();
  }
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(Math.floor(now.getTime()/1000)),
    db.prepare('DELETE FROM rate_limits WHERE expires_at<=?').bind(Math.floor(now.getTime()/1000)),
    db.prepare('DELETE FROM response_cache WHERE expires_at<=?').bind(now.getTime()),
  ]);
}

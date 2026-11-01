import { ApiError } from '../types';
export function relativeDate(text: string, now = new Date()): string {
  const normalized=text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  const numbers:Record<string,number>={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10};
  const pattern=/(?<![\p{L}\p{N}])(?:depois de amanha|amanha|hoje|daqui a (\d{1,3}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez) (dia|semana)s?)(?![\p{L}\p{N}])/gu;
  const matches=[...normalized.matchAll(pattern)];
  if(matches.length!==1||/\bnao\b/.test(normalized))throw new ApiError(422,'date_needs_clarification');
  const match=matches[0];
  const amount=match[1] ? (numbers[match[1]]??Number(match[1])) : 0;
  const days=match[0]==='hoje'?0:match[0]==='amanha'?1:match[0]==='depois de amanha'?2:amount*(match[2]==='semana'?7:1);
  if(!Number.isFinite(now.getTime())||days>366||(days<=0&&match[0]!=='hoje'))throw new ApiError(422,'date_needs_clarification');
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
    WHERE e.status='active' AND e.notify=1 AND e.due_at>=? AND e.due_at<=? AND (? IS NULL OR e.user_id=?) AND NOT EXISTS (SELECT 1 FROM reminders r WHERE r.event_id=e.id) ORDER BY e.due_at,e.id LIMIT 200`)
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

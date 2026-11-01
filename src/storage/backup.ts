import { z } from 'zod';
import { hash } from '../auth/auth';
import { ApiError, type Env } from '../types';
import { memorySchema } from '../api/schemas';

// Fixed tables/columns, never SQL identifiers supplied by an import file.
export const columns: Record<string,string[]> = {
  memories:['id','kind','content','source','confidence','metadata','fingerprint','version','created_at','updated_at'],
  memory_versions:['id','memory_id','version','content','created_at','snapshot'],
  knowledge_nodes:['id','label','category'],
  knowledge_edges:['id','source_id','target_id','relation','memory_id'],
  memory_relations:['id','from_id','to_id','relation'],
  goals:['id','title','status','created_at'], tasks:['id','title','status','created_at'],
  events:['id','title','due_at','status','notify','created_at','recurrence_days','goal_id'],
  reminders:['id','event_id','created_at','seen_at'],
  conversations:['id','created_at'], messages:['id','conversation_id','role','content','created_at'],
  documents:['id','name','mime','content','created_at'],
  audit_events:['id','action','target','created_at'],
  agent_executions:['id','agent_id','provider','latency_ms','status','created_at'],
  tool_executions:['id','tool','status','latency_ms','error_code','created_at'],
};
const ownerless = new Set(['messages','memory_versions']);
const references: Record<string,Record<string,string>> = {
  memory_versions:{memory_id:'memories'},knowledge_edges:{source_id:'knowledge_nodes',target_id:'knowledge_nodes',memory_id:'memories'},
  memory_relations:{from_id:'memories',to_id:'memories'},events:{goal_id:'goals'},reminders:{event_id:'events'},messages:{conversation_id:'conversations'},
};
const order = ['memories','memory_versions','knowledge_nodes','knowledge_edges','memory_relations','goals','tasks','events','reminders','conversations','messages','documents','audit_events','agent_executions','tool_executions'];
type Row = Record<string,string|number|null>;
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical((value as Record<string,unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
const profileSchema=z.object({timezone:z.string().max(80).refine(v=>{try{new Intl.DateTimeFormat('pt-BR',{timeZone:v});return true;}catch{return false;}}),preferences:z.object({proactive:z.number().int().min(0).max(1),quiet_start:z.number().int().min(0).max(23),quiet_end:z.number().int().min(0).max(23),retention_days:z.number().int().min(0).max(3650),backup_enabled:z.number().int().min(0).max(1)}).strict().nullable()}).strict();
export const envelopeSchema = z.object({schemaVersion:z.literal(2),exportedAt:z.iso.datetime(),profile:profileSchema,data:z.record(z.string(),z.array(z.record(z.string(),z.union([z.string().max(100000),z.number().finite(),z.null()]))).max(1000)),checksum:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export type Envelope = z.infer<typeof envelopeSchema>;
export async function exportData(db: D1Database, userId: string): Promise<Envelope> {
  const data: Record<string,Row[]> = {};
  let total = 0;
  for (const [table,fields] of Object.entries(columns)) {
    const scope = table === 'messages' ? 'conversation_id IN (SELECT id FROM conversations WHERE user_id=?)' : table === 'memory_versions' ? 'memory_id IN (SELECT id FROM memories WHERE user_id=?)' : 'user_id=?';
    const rows = (await db.prepare(`SELECT ${fields.join(',')} FROM ${table} WHERE ${scope} ORDER BY id LIMIT 1001`).bind(userId).all<Row>()).results;
    total += rows.length;
    if (rows.length>1000 || total>1000) throw new ApiError(413,'export_requires_database_backup');
    data[table]=rows;
  }
  const user=await db.prepare('SELECT timezone FROM users WHERE id=?').bind(userId).first<{timezone:string}>();
  if(!user)throw new ApiError(404,'user_not_found');
  const preferences=await db.prepare('SELECT proactive,quiet_start,quiet_end,retention_days,backup_enabled FROM preferences WHERE user_id=?').bind(userId).first<z.infer<typeof profileSchema>['preferences']>();
  const payload = {schemaVersion:2 as const,exportedAt:new Date().toISOString(),profile:{timezone:user.timezone,preferences},data};
  if (new TextEncoder().encode(canonical(payload)).length>1500000) throw new ApiError(413,'export_requires_database_backup');
  return {...payload,checksum:await hash(canonical(payload))};
}
export async function restoreData(db: D1Database, userId: string, input: Envelope) {
  const {checksum,...payload}=input;
  if (await hash(canonical(payload))!==checksum) throw new ApiError(422,'backup_integrity_failed');
  if (Object.keys(input.data).length!==order.length || order.some(t=>!input.data[t])) throw new ApiError(422,'backup_tables_invalid');
  const ids = new Map<string,string>(); let count=0;
  for (const table of order) {
    if (!['audit_events','agent_executions','tool_executions'].includes(table) && (await db.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${table==='messages'?'conversation_id IN (SELECT id FROM conversations WHERE user_id=?)':table==='memory_versions'?'memory_id IN (SELECT id FROM memories WHERE user_id=?)':'user_id=?'}`).bind(userId).first<{n:number}>())!.n) throw new ApiError(409,'restore_requires_empty_account');
    for (const row of input.data[table]) {
      count++;
      if (Object.keys(row).length!==columns[table].length || columns[table].some(k=>!(k in row)) || typeof row.id!=='string' || ids.has(`${table}:${row.id}`)) throw new ApiError(422,'backup_row_invalid');
      ids.set(`${table}:${row.id}`,crypto.randomUUID());
      if (table==='memories') {
        let metadata; try { metadata=JSON.parse(String(row.metadata)); } catch { throw new ApiError(422,'backup_memory_invalid'); }
        if (!memorySchema.safeParse({kind:row.kind,content:row.content,source:row.source,confidence:row.confidence,metadata}).success || !Number.isInteger(row.version) || Number(row.version)<1) throw new ApiError(422,'backup_memory_invalid');
        row.fingerprint=await hash(canonical([String(row.content).normalize('NFC').trim(),metadata]));
      }
      if (table==='messages' && !['user','assistant'].includes(String(row.role))) throw new ApiError(422,'backup_role_invalid');
      if (table==='events' && (!Number.isFinite(Date.parse(String(row.due_at))) || ![0,1].includes(Number(row.notify)) || !Number.isInteger(row.recurrence_days) || Number(row.recurrence_days)<0 || Number(row.recurrence_days)>366)) throw new ApiError(422,'backup_event_invalid');
      if (['events','goals','tasks'].includes(table) && !['active','pending','completed','cancelled'].includes(String(row.status))) throw new ApiError(422,'backup_status_invalid');
    }
  }
  if(count>1000) throw new ApiError(413,'backup_too_large');
  const statements: D1PreparedStatement[]=[];
  statements.push(db.prepare('UPDATE users SET timezone=? WHERE id=?').bind(input.profile.timezone,userId));
  if(input.profile.preferences) {
    const pref=input.profile.preferences;
    // Restore information, but renew consent before enabling retention, uploads or proactive behavior.
    statements.push(db.prepare('INSERT INTO preferences VALUES (?,0,?,?,0,0) ON CONFLICT(user_id) DO UPDATE SET proactive=0,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,retention_days=0,backup_enabled=0').bind(userId,pref.quiet_start,pref.quiet_end));
  }
  for(const table of order) for(const row of input.data[table]) {
    const copy:Row={...row,id:ids.get(`${table}:${row.id}`)!};
    for(const [column,target] of Object.entries(references[table]??{})) if(copy[column]!==null) {
      const mapped=ids.get(`${target}:${copy[column]}`); if(!mapped) throw new ApiError(422,'backup_reference_invalid'); copy[column]=mapped;
    }
    if(!ownerless.has(table)) copy.user_id=userId;
    const keys=Object.keys(copy);
    statements.push(db.prepare(`INSERT INTO ${table}(${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).bind(...keys.map(k=>copy[k])));
  }
  // D1 batch is a transaction: any rejected row rolls back the entire restore.
  if(statements.length) await db.batch(statements);
  return {restored:count};
}
export async function automatedBackups(env: Env, now = new Date()) {
  if(env.BACKUPS_ENABLED!=='true' || !env.BACKUPS) return;
  const users=(await env.DB.prepare('SELECT user_id FROM preferences WHERE backup_enabled=1 LIMIT 20').all<{user_id:string}>()).results;
  for(const {user_id} of users) {
    const key=`${user_id}/${now.toISOString().slice(0,10)}.json`;
    if(await env.DB.prepare('SELECT id FROM backups WHERE object_key=?').bind(key).first()) continue;
    const backup=await exportData(env.DB,user_id);
    await env.BACKUPS.put(key,JSON.stringify(backup),{httpMetadata:{contentType:'application/json'}});
    await env.DB.prepare('INSERT OR IGNORE INTO backups VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),user_id,key,backup.checksum,now.toISOString()).run();
  }
}

import { hash } from '../auth/auth';
import type { MemoryInput } from '../api/schemas';
import { canonical } from './backup';
import { linkMemory } from '../memory/graph';
import { ApiError } from '../types';
export interface MemoryStore {
  save(userId: string, input: MemoryInput): Promise<Record<string, unknown>>;
  search(userId: string, query: string, kind?: string): Promise<unknown[]>;
}
export class D1MemoryStore implements MemoryStore {
  constructor(private db: D1Database) {}
  async save(userId: string, input: MemoryInput): Promise<Record<string, unknown>> {
    const fingerprint = await hash(canonical([input.content.normalize('NFC').trim(), input.metadata]));
    const id = crypto.randomUUID(), now = new Date().toISOString();
    await this.db.prepare(`INSERT INTO memories(id,user_id,kind,content,source,confidence,metadata,fingerprint,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,kind,fingerprint) DO NOTHING`)
      .bind(id,userId,input.kind,input.content,input.source,input.confidence,JSON.stringify(input.metadata),fingerprint,now,now).run();
    const row = await this.db.prepare('SELECT * FROM memories WHERE user_id=? AND kind=? AND fingerprint=?').bind(userId,input.kind,fingerprint).first<Record<string, unknown>>();
    if (!row) throw new Error('memory_write_failed');
    await linkMemory(this.db,userId,String(row.id),input);
    return row;
  }
  async update(userId:string,id:string,expectedVersion:number,input:MemoryInput) {
    const fingerprint=await hash(canonical([input.content.normalize('NFC').trim(),input.metadata]));
    const duplicate=await this.db.prepare('SELECT id FROM memories WHERE user_id=? AND kind=? AND fingerprint=? AND id!=?').bind(userId,input.kind,fingerprint,id).first();
    if(duplicate) throw new ApiError(409,'duplicate_memory');
    const result=await this.db.prepare('UPDATE memories SET kind=?,content=?,source=?,confidence=?,metadata=?,fingerprint=?,version=version+1,updated_at=? WHERE id=? AND user_id=? AND version=? RETURNING *')
      .bind(input.kind,input.content,input.source,input.confidence,JSON.stringify(input.metadata),fingerprint,new Date().toISOString(),id,userId,expectedVersion).first();
    if(!result) throw new ApiError(409,'memory_version_conflict');
    await this.db.prepare('DELETE FROM knowledge_edges WHERE memory_id=? AND user_id=?').bind(id,userId).run();
    await linkMemory(this.db,userId,id,input);
    return result;
  }
  async relevant(userId:string,query:string) {
    const words=[...new Set(query.toLocaleLowerCase('pt-BR').split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>3))].slice(0,8);
    if(!words.length) return [];
    const rows=await Promise.all(words.map(word=>this.search(userId,word)));
    const scores=new Map<string,{row:Record<string,unknown>;score:number}>();
    for(const list of rows) for(const row of list as Record<string,unknown>[]) { const id=String(row.id); const old=scores.get(id); scores.set(id,{row,score:(old?.score??0)+1}); }
    return [...scores.values()].sort((a,b)=>b.score-a.score).slice(0,6).map(v=>v.row);
  }
  async search(userId: string, query: string, kind?: string) {
    const escaped = query.replace(/[!%_]/g, '!$&');
    return (await this.db.prepare("SELECT * FROM memories WHERE user_id=? AND content LIKE ? ESCAPE '!' AND (? IS NULL OR kind=?) ORDER BY updated_at DESC LIMIT 30")
      .bind(userId, `%${escaped}%`,kind ?? null,kind ?? null).all()).results;
  }
}
export async function audit(db: D1Database, userId: string, action: string, target: string) {
  await db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), userId,action,target,new Date().toISOString()).run();
}

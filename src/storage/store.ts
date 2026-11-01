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
  private terms(query:string) {
    return [...new Set(query.normalize('NFC').match(/[\p{L}\p{N}]+/gu)??[])].slice(0,24);
  }
  async relevant(userId:string,query:string) {
    const stop=new Set(['como','para','sobre','voce','você','cronos','lembra','pode','quero']);
    const words=this.terms(query).filter(w=>w.length>3&&!stop.has(w.toLowerCase())).slice(0,8);
    if(!words.length)return [];
    return this.fulltext(userId,words,'OR',6);
  }
  private async fulltext(userId:string,words:string[],operator:'AND'|'OR',limit:number,kind?:string) {
    // Tokens contain only letters/numbers. Quote every token: FTS syntax never comes from the caller.
    const match=words.map(w=>`"${w}"*`).join(` ${operator} `);
    return (await this.db.prepare(`SELECT m.* FROM memories_fts JOIN memories m ON m.rowid=memories_fts.rowid
      WHERE memories_fts MATCH ? AND m.user_id=? AND (? IS NULL OR m.kind=?)
      ORDER BY bm25(memories_fts),m.updated_at DESC,m.id LIMIT ?`)
      .bind(match,userId,kind??null,kind??null,limit).all()).results;
  }
  async search(userId:string,query:string,kind?:string) {
    if(!query.trim())return (await this.db.prepare('SELECT * FROM memories WHERE user_id=? AND (? IS NULL OR kind=?) ORDER BY updated_at DESC,id LIMIT 30').bind(userId,kind??null,kind??null).all()).results;
    const words=this.terms(query);return words.length?this.fulltext(userId,words,'AND',30,kind):[];
  }
}
export async function audit(db: D1Database, userId: string, action: string, target: string) {
  await db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), userId,action,target,new Date().toISOString()).run();
}

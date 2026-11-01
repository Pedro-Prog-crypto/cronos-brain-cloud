import type { MemoryInput } from '../api/schemas';
export async function linkMemory(db:D1Database,userId:string,memoryId:string,input:MemoryInput) {
  const labels = input.kind==='semantic' ? input.metadata.topics : input.kind==='relational' ? [input.metadata.from,input.metadata.to] : [];
  const unique=[...new Set(labels.map(s=>s.normalize('NFC').trim()).filter(Boolean))].slice(0,20);
  if(!unique.length) return;
  await db.batch(unique.map(label=>db.prepare('INSERT OR IGNORE INTO knowledge_nodes VALUES (?,?,?,?)').bind(crypto.randomUUID(),userId,label,input.kind==='relational'?'relação':'tema')));
  const nodes=(await db.prepare(`SELECT id,label FROM knowledge_nodes WHERE user_id=? AND label IN (${unique.map(()=>'?').join(',')})`).bind(userId,...unique).all<{id:string;label:string}>()).results;
  const byLabel=new Map(nodes.map(n=>[n.label,n.id]));
  const edges:D1PreparedStatement[]=[];
  for(let i=1;i<unique.length;i++) {
    const relation=input.kind==='relational'?input.metadata.relation:'mesma memória';
    edges.push(db.prepare('INSERT OR IGNORE INTO knowledge_edges VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),userId,byLabel.get(unique[0])!,byLabel.get(unique[i])!,relation,memoryId));
  }
  if(edges.length) await db.batch(edges);
}

import { readFileSync,readdirSync } from 'node:fs';
export async function migrate(db) {
  const directory=new URL('../migrations/',import.meta.url);
  for(const name of readdirSync(directory).filter(n=>n.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(new URL(name,directory),'utf8').replace(/\n/g,' '));
  }
}

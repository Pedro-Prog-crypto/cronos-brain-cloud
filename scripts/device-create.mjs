import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
const userId = randomUUID(), deviceId = randomUUID(), credential = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(credential).digest('hex');
mkdirSync('.wrangler', {recursive:true});
writeFileSync('.wrangler/device.local.json',JSON.stringify({userId,deviceId,credential},null,2),{mode:0o600,flag:'wx'});
writeFileSync('.wrangler/device.local.sql',`INSERT INTO users(id) VALUES ('${userId}');\nINSERT INTO devices(id,user_id,name,credential_hash,role) VALUES ('${deviceId}','${userId}','Dispositivo local','${hash}','owner');\n`,{mode:0o600,flag:'wx'});
console.log('Arquivos locais criados com permissão 0600. A credencial não será exibida.');
console.log('Aplique: npx wrangler d1 execute DB --local --file .wrangler/device.local.sql');

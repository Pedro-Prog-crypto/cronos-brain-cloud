import {readFileSync,writeFileSync} from 'node:fs';
const assets={};
for(const file of ['index.html','style.css','app.js'])assets[file]=readFileSync(new URL('../admin/'+file,import.meta.url),'utf8');
writeFileSync(new URL('../src/admin/assets.ts',import.meta.url),'// Generated from admin/ by scripts/embed-admin.mjs.\nexport const assets = '+JSON.stringify(assets)+';\n');

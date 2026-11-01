import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,unlinkSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const local=join(root,'.wrangler');
const url='http://127.0.0.1:8787/admin';
// Direct executables and paths must never go through cmd.exe: Windows paths can contain spaces.
const options={cwd:root,stdio:'inherit',shell:false};
const run=(command,args,extra={})=>execFileSync(command,args,{...options,...extra});
const npmCall=args=>process.platform==='win32'
 ? ['cmd.exe',['/d','/s','/c',`npm.cmd ${args.join(' ')}`]]
 : ['npm',args];
const runNpm=(args,extra={})=>run(...npmCall(args),extra);

if(Number(process.versions.node.split('.')[0])<24){
 console.error('Instale o Node.js 24 ou superior em https://nodejs.org/ e tente novamente.');
 process.exit(1);
}
if(process.argv.includes('--check')){
 console.log('Node.js compatível. Abra INICIAR-CRONOS.cmd no Windows ou INICIAR-CRONOS.command no macOS.');
 process.exit(0);
}

try{
 mkdirSync(local,{recursive:true});
 const lockHash=createHash('sha256').update(readFileSync(join(root,'package-lock.json'))).digest('hex');
 const stamp=join(local,'launcher-lock.txt');
 if(!existsSync(join(root,'node_modules','.package-lock.json'))||!existsSync(stamp)||readFileSync(stamp,'utf8')!==lockHash){
  console.log('Instalando dependências; a primeira abertura pode levar alguns minutos…');
  runNpm(['ci']);
  writeFileSync(stamp,lockHash,{mode:0o600});
 }
 console.log('Preparando o banco local…');
 runNpm(['run','db:migrate'],{env:{...process.env,CI:'true'}});
 const credentials=join(local,'device.local.json');
 const sql=join(local,'device.local.sql');
 if(existsSync(credentials)!==existsSync(sql))throw Error('Os arquivos do dispositivo local estão incompletos. Guarde uma cópia de .wrangler antes de corrigir a instalação.');
 if(!existsSync(credentials))run(process.execPath,['scripts/device-create.mjs']);
 const ready=join(local,'device.local.ready');
 if(!existsSync(ready)){
  // Repeated startup after an interrupted setup must not duplicate this device.
  const idempotent=readFileSync(sql,'utf8').replaceAll('INSERT INTO users','INSERT OR IGNORE INTO users').replaceAll('INSERT INTO devices','INSERT OR IGNORE INTO devices');
  const installSql=join(local,'device.install.sql');
  writeFileSync(installSql,idempotent,{mode:0o600});
  try{run(process.execPath,[join(root,'node_modules','wrangler','bin','wrangler.js'),'d1','execute','DB','--local','--file',installSql]);}
  finally{try{unlinkSync(installSql);}catch{}}
  writeFileSync(ready,'ready',{mode:0o600});
 }
 console.log('Iniciando o painel…');
 const server=spawn(...npmCall(['run','dev']),options);
 let exited=false;
 server.on('error',error=>{exited=true;console.error('Falha ao iniciar o servidor:',error.message);});
 server.on('exit',()=>{exited=true;});
 let online=false;
 for(let i=0;i<60;i++){
  if(exited)break;
  try{const response=await fetch('http://127.0.0.1:8787/v1/health',{signal:AbortSignal.timeout(1000)});if(response.ok){online=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 if(!online)throw Error('O painel não respondeu em 127.0.0.1:8787. Veja a mensagem do servidor acima.');
 console.log(`Painel pronto: ${url}`);
 console.log('A identificação e a credencial estão em .wrangler/device.local.json. Guarde esse arquivo em privado.');
 try{
  if(process.platform==='win32')spawn('notepad.exe',[credentials],{cwd:root,stdio:'ignore',detached:true}).on('error',()=>{});
  else if(process.platform==='darwin')spawn('open',['-a','TextEdit',credentials],{cwd:root,stdio:'ignore',detached:true}).on('error',()=>{});
  const browser=process.platform==='win32'?['cmd.exe',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
  spawn(browser[0],browser[1],{cwd:root,stdio:'ignore',detached:true}).on('error',()=>console.log('Abra o endereço acima no navegador deste computador.'));
 }catch{console.log('Abra o endereço acima no navegador deste computador.');}
 await new Promise(resolve=>server.on('exit',resolve));
}catch(error){
 console.error('Não foi possível abrir o CRONOS:',error.message);
 process.exitCode=1;
}

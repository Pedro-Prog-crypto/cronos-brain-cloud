#!/usr/bin/env node
import {readFile,writeFile,chmod} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {fileURLToPath} from 'node:url';

// Local-only wizard: credentials never enter frontend storage, argv, or logs.
const path=fileURLToPath(new URL('../.dev.vars',import.meta.url));
const keys={groq:'GROQ_API_KEY',openrouter:'OPENROUTER_API_KEY',generic:'GENERIC_API_KEY'};
let muted=false;
const output=new Writable({write(chunk,encoding,done){if(!muted)process.stdout.write(chunk,encoding);done();}});
const rl=createInterface({input:process.stdin,output,terminal:!!process.stdin.isTTY});
try {
  const provider=(await rl.question('Provedor (groq/openrouter/generic): ')).trim();
  if(!Object.hasOwn(keys,provider))throw Error('Provedor inválido.');
  const model=(await rl.question('Identificador do modelo: ')).trim();
  if(!model||model.length>200)throw Error('Modelo inválido.');
  let endpoint;
  if(provider==='generic'){
    endpoint=(await rl.question('URL HTTPS de chat/completions: ')).trim();
    const url=new URL(endpoint);
    if(url.protocol!=='https:'||url.username||url.password)throw Error('Endpoint HTTPS inválido.');
  }
  const consent=(await rl.question('Autoriza enviar histórico e memórias para este provedor? (sim/não): ')).trim()==='sim';
  if((await rl.question('Confirmou o modelo/plano gratuito e os limites atuais? (sim/não): ')).trim()!=='sim')throw Error('Verifique o plano antes de habilitar.');
  process.stdout.write('Chave de API (entrada oculta): ');muted=true;
  let secret;
  try {secret=(await rl.question('')).trim();}finally{muted=false;process.stdout.write('\n');}
  if(!secret||/[\r\n]/.test(secret))throw Error('Chave inválida.');
  let content='';try{content=await readFile(path,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  const existing=content.match(/^PROVIDERS_JSON=(.*)$/m);
  let configs=[];
  if(existing){
    let raw=existing[1].trim();if(raw.startsWith("'"))raw=raw.slice(1,-1);else if(raw.startsWith('"'))raw=JSON.parse(raw);
    configs=JSON.parse(raw);if(!Array.isArray(configs))throw Error('Configuração existente inválida.');
  }
  configs=configs.filter(c=>c.id!==provider);
  configs.push({id:provider,model,enabled:true,freeTierVerified:true,verifiedAt:new Date().toISOString(),dailyRequestLimit:50,allowPersonalContext:consent,...(endpoint?{endpoint}:{})});
  for(const [name,value] of [[keys[provider],JSON.stringify(secret)],['PROVIDERS_JSON',JSON.stringify(JSON.stringify(configs))]]){
    const line=new RegExp(`^${name}=.*$`,'m');
    content=line.test(content)?content.replace(line,()=>`${name}=${value}`):content+`\n${name}=${value}\n`;
  }
  await writeFile(path,content,{mode:0o600});await chmod(path,0o600);
  console.log('Configuração local salva. Reinicie o servidor e use Verificar provedor no painel.');
} catch(error){console.error(error.message);process.exitCode=1;}finally{rl.close();}

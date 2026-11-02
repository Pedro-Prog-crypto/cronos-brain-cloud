import {lstat,readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';

export function validConnection(config){
  if(!config||typeof config!=='object')return false;
  try {
    const url=new URL(config.baseUrl);
    return !url.username&&!url.password&&
      (url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))&&
      /^[0-9a-f-]{36}$/i.test(config.deviceId)&&/^[0-9a-f]{64}$/i.test(config.credential);
  }catch{return false;}
}

/** Detect by contract, never by archive, directory, or file version/name. */
export async function discoverConnection(path){
  const found=[];let visited=0;
  async function visit(current,depth){
    if(++visited>2000)throw Error('Busca muito ampla. Informe uma pasta menor ou o arquivo de conexão.');
    const stat=await lstat(current);
    if(stat.isSymbolicLink())return;
    if(stat.isDirectory()){
      if(depth>=6)throw Error('Pasta muito profunda. Informe o arquivo de conexão.');
      for(const entry of await readdir(current,{withFileTypes:true})){
        if(['node_modules','.git','.wrangler'].includes(entry.name))continue;
        await visit(join(current,entry.name),depth+1);
      }
    }else if(stat.isFile()&&stat.size<=1024*1024){
      let config;try{config=JSON.parse(await readFile(current,'utf8'));}catch(error){if(error instanceof SyntaxError)return;throw error;}
      if(validConnection(config))found.push(config);
    }
  }
  await visit(path,0);
  if(found.length!==1)throw Error(found.length?'Mais de uma conexão encontrada. Informe o arquivo desejado.':'Nenhum arquivo de conexão Brain válido encontrado. Exporte a conexão pelo painel.');
  return found[0];
}

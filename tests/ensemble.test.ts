import {test} from 'node:test';
import assert from 'node:assert/strict';
import {combineResponses} from '../src/core/ensemble.ts';

test('combinação independe da ordem e preserva perspectivas divergentes',()=>{
  const responses=[{provider:'groq',model:'a',text:'A hipótese é verdadeira.'},{provider:'openrouter',model:'b',text:'A hipótese é falsa.'}];
  const result=combineResponses(responses);
  assert.deepEqual(result,combineResponses([...responses].reverse()));
  for(const response of responses){assert.ok(result.text.includes(response.text));assert.ok(result.text.includes(response.provider));}
  assert.ok(result.text.includes('podem divergir'));
});

test('respostas idênticas são combinadas sem perder proveniência',()=>{
  const result=combineResponses([{provider:'groq',model:'a',text:'Resposta comum'},{provider:'generic',model:'b',text:'Resposta comum'}]);
  assert.equal(result.text.split('Resposta comum').length-1,1);
  assert.ok(result.text.includes('groq / a'));assert.ok(result.text.includes('generic / b'));
});

test('uma resposta não inventa consenso; nenhuma resposta falha',()=>{
  assert.deepEqual(combineResponses([{provider:'groq',model:'a',text:'Única'}]),{text:'Única',provider:'groq'});
  assert.throws(()=>combineResponses([]),/no_available_model/);
});

test('conexão Desktop descoberta por conteúdo com nomes e versões arbitrários',async()=>{
  const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises');
  const {join}=await import('node:path');const {tmpdir}=await import('node:os');
  const {discoverConnection}=await import('../client/connection-config.mjs');
  const root=await mkdtemp(join(tmpdir(),'cronos-discovery-'));
  const config={baseUrl:'https://brain.example.com',deviceId:'22222222-2222-4222-8222-222222222222',credential:'a'.repeat(64)};
  try{
    const dir=join(root,'Desktop-versao-qualquer');await mkdir(dir);
    await writeFile(join(dir,'config-sem-extensao'),JSON.stringify(config));
    await writeFile(join(dir,'outro.json'),'{"version":"123"}');
    assert.deepEqual(await discoverConnection(root),config);
    await writeFile(join(dir,'duplicado'),JSON.stringify(config));
    await assert.rejects(discoverConnection(root),/Mais de uma/);
    assert.deepEqual(await discoverConnection(join(dir,'config-sem-extensao')),config);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('assistente de chaves preserva outras configurações sem exibir o segredo',async()=>{
  const {mkdtemp,mkdir,copyFile,writeFile,readFile,stat,rm}=await import('node:fs/promises');
  const {join}=await import('node:path');const {tmpdir}=await import('node:os');const {spawn}=await import('node:child_process');
  const root=await mkdtemp(join(tmpdir(),'cronos-config-'));
  try{
    await mkdir(join(root,'scripts'));
    await copyFile(new URL('../scripts/configure-models.mjs',import.meta.url),join(root,'scripts','configure-models.mjs'));
    await writeFile(join(root,'.dev.vars'),'WEB_ENABLED=false\nGENERIC_API_KEY="existing-fixture"\n');
    const child=spawn(process.execPath,[join(root,'scripts','configure-models.mjs')],{stdio:['pipe','pipe','pipe']});
    let output='',index=0;
    const steps=[['Provedor (','groq'],['Identificador do modelo:','fixture'],['Autoriza enviar','sim'],['Confirmou o modelo','sim'],['Chave de API','test-only-private-key']];
    const complete=new Promise<number|null>((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
    child.stdout.on('data',chunk=>{
      output+=chunk.toString();
      if(index<steps.length&&output.includes(steps[index][0])){child.stdin.write(steps[index][1]+'\n');index++;}
    });
    child.stderr.on('data',chunk=>{output+=chunk.toString();});
    const timeout=setTimeout(()=>child.kill(),10000);
    let code;try{code=await complete;}finally{clearTimeout(timeout);}
    assert.equal(code,0,output);assert.ok(!output.includes('test-only-private-key'));
    const content=await readFile(join(root,'.dev.vars'),'utf8');
    assert.ok(content.includes('WEB_ENABLED=false'));assert.ok(content.includes('GENERIC_API_KEY="existing-fixture"'));
    assert.ok(content.includes('GROQ_API_KEY="test-only-private-key"'));
    const encoded=content.match(/^PROVIDERS_JSON=(.*)$/m)![1];
    assert.equal(JSON.parse(JSON.parse(encoded))[0].id,'groq');
    assert.equal((await stat(join(root,'.dev.vars'))).mode&0o777,0o600);
  }finally{await rm(root,{recursive:true,force:true});}
});

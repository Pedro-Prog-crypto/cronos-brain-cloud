import { definitions } from './definitions';
const external = new Set(['vision','news','image-search','image-generation','speech-to-text','text-to-speech','audio','video']);
export function selectAgent(message: string): string {
  if (/erro|bug|stack|falha/i.test(message)) return '22';
  if (/código|program|typescript|python/i.test(message)) return '21';
  if (/arquitetura|microserviço/i.test(message)) return '23';
  if (/segurança|vulnerabilidade/i.test(message)) return '24';
  if (/matemática|física|ciência/i.test(message)) return '10';
  if (/decisão|alternativa|escolh/i.test(message)) return '05';
  if (/plano|planej|aprender|estudar/i.test(message)) return '03';
  return '01';
}
export function selectAgents(message:string,complex=false):string[] {
  const first=selectAgent(message);
  return complex ? [...new Set([first,'02','04'])] : [first];
}
export function instruction(id:string) { return definitions.find(d=>d.id===id)?.instruction ?? definitions[0].instruction; }
export function catalog() {
  return definitions.map(d=>({...d,description:d.instruction,
    implementation:'parcialmente implementado',
    availability:external.has(d.capability)?'conector implementado; aguarda configuração e validação externa':d.capability.startsWith('local-')?'implementação local; consulte relatório de testes':'aguarda validação com modelo real',
    preferredModel:null,alternativeModels:[],
    allowedTools:({'07':['web.search'],'08':['news.search'],'12':['document.analyze','document.pdf'],'13':['vision.analyze'],'14':['images.search'],'15':['image.generate'],'16':['visual.chart'],'17':['speech.transcribe'],'18':['speech.synthesize'],'19':['audio.analyze'],'20':['video.analyze']} as Record<string,string[]>)[d.id]??[],
    input:d.capability==='text'?'pedido e contexto autorizado':'schema da capacidade',output:d.capability==='text'?'análise textual':'resultado estruturado',
    priority:d.id==='39'?100:10,lastLiveTest:null,estimatedCost:null,
  }));
}

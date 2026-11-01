import { definitions } from './definitions';
const unavailable = new Set(['vision','news','image-search','image-generation','speech-to-text','text-to-speech','audio','video','device-command']);
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
    implementation:unavailable.has(d.capability)?'planejado':'parcialmente implementado',
    availability:unavailable.has(d.capability)?'capacidade externa indisponível':d.capability.startsWith('local-')?'implementação local; consulte relatório de testes':'aguarda validação com modelo real',
    preferredModel:null,alternativeModels:[],
    allowedTools:d.id==='12'?['document.analyze']:d.id==='16'?['visual.chart']:d.id==='07'?['web.search']:[],
    input:d.capability==='text'?'pedido e contexto autorizado':'schema da capacidade',output:d.capability==='text'?'análise textual':'resultado estruturado',
    priority:d.id==='39'?100:10,lastLiveTest:null,estimatedCost:null,
  }));
}

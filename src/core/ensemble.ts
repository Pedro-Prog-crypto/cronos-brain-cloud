export interface ModelResponse { provider: string; model: string; text: string }

/** No judge model: retain complete answers and their provenance, including dissent. */
export function combineResponses(responses: ModelResponse[]): {text: string; provider: string} {
  if (!responses.length) throw new Error('no_available_model');
  const sorted = [...responses].sort((a,b)=>a.provider.localeCompare(b.provider)||a.model.localeCompare(b.model));
  if (sorted.length === 1) return {text:sorted[0].text,provider:sorted[0].provider};
  const groups = new Map<string, {text:string; origins:string[]}>();
  for (const response of sorted) {
    const text=response.text.trim();
    const group=groups.get(text) ?? {text,origins:[]};
    group.origins.push(`${response.provider} / ${response.model}`);
    groups.set(text,group);
  }
  const intro=groups.size===1
    ? 'CRONOS — os modelos retornaram a mesma resposta.'
    : 'CRONOS — combinação de perspectivas independentes. As respostas abaixo podem divergir; concordância não comprova um fato.';
  return {
    text:intro+'\n\n'+[...groups.values()].map(g=>`### ${g.origins.join(', ')}\n\n${g.text}`).join('\n\n'),
    provider:sorted.map(r=>r.provider).join('+'),
  };
}

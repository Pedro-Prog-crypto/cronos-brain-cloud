import { z } from 'zod';
import { ApiError, type Env, type Message } from '../types';

const configSchema = z.array(z.object({
  id: z.enum(['groq','openrouter','generic','cloudflare']), model: z.string().min(1),
  enabled: z.boolean().default(false), freeTierVerified: z.boolean().default(false),
  verifiedAt: z.iso.datetime(), dailyRequestLimit: z.number().int().min(1).max(1000),
  endpoint: z.url().optional(), allowPersonalContext: z.boolean().default(false),
}).strict()).max(4).refine(rows => new Set(rows.map(r => r.id)).size === rows.length);
export type ProviderConfig = z.infer<typeof configSchema>[number];
export interface InferenceProvider { complete(messages: Message[], signal: AbortSignal): Promise<string> }
export function configurations(env: Env): ProviderConfig[] {
  let data:unknown;try{data=JSON.parse(env.PROVIDERS_JSON ?? '[]');}catch{throw new ApiError(503,'invalid_provider_configuration');}
  const parsed = configSchema.safeParse(data);
  if (!parsed.success) throw new ApiError(503,'invalid_provider_configuration');
  return parsed.data;
}
function key(env: Env, id: string) {
  return id === 'groq' ? env.GROQ_API_KEY : id === 'openrouter' ? env.OPENROUTER_API_KEY : env.GENERIC_API_KEY;
}
export function available(env: Env, config: ProviderConfig) {
  const age = Date.now() - Date.parse(config.verifiedAt);
  return config.enabled && config.freeTierVerified && age >= 0 && age < 30*86400000 &&
    (config.id === 'cloudflare' ? !!env.AI : !!key(env,config.id));
}
export function providerStatus(env: Env) {
  return configurations(env).map(c => ({id:c.id,model:c.model,configured:available(env,c),liveTested:false,dailyRequestLimit:c.dailyRequestLimit}));
}
export function retrySeconds(value: string | null): number {
  if (!value) return 60;
  const n = Number(value);
  return Math.max(1,Math.min(86400,Number.isFinite(n) ? n : Math.ceil((Date.parse(value)-Date.now())/1000) || 60));
}
export class HttpProvider implements InferenceProvider {
  constructor(private env: Env, private config: ProviderConfig, private fetcher: typeof fetch = (...args) => fetch(...args)) {}
  async complete(messages: Message[], signal: AbortSignal): Promise<string> {
    const c = this.config;
    const endpoint = c.id === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions'
      : c.id === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : c.endpoint;
    if (!endpoint || new URL(endpoint).protocol !== 'https:') throw new ApiError(503,'invalid_provider_endpoint');
    const response = await this.fetcher(endpoint,{method:'POST',redirect:'manual',signal,
      headers:{'Authorization':`Bearer ${key(this.env,c.id)}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:c.model,messages,max_tokens:1024,stream:false})});
    if (response.status === 429) throw new ApiError(429,'provider_rate_limited',retrySeconds(response.headers.get('Retry-After')));
    if (!response.ok) throw new ApiError(503,'provider_unavailable');
    const json = await response.json() as {choices?: {message?: {content?: string}}[]};
    const text = json.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim() || text.length > 100000) throw new ApiError(503,'invalid_provider_response');
    return text;
  }
}
export class ModelGateway {
  constructor(private env: Env, private fetcher: typeof fetch = (...args) => fetch(...args)) {}
  async generate(messages: Message[], personalContext: boolean, providerId?: string): Promise<{text:string;provider:string}> {
    const candidates = configurations(this.env).filter(c => available(this.env,c) && (!personalContext || c.allowPersonalContext) && (!providerId || c.id === providerId)).slice(0,2);
    for (const config of candidates) {
      const day = new Date().toISOString().slice(0,10), now = Date.now();
      // Retry-After remains effective even when the daily quota bucket changes at midnight.
      const cooling = await this.env.DB.prepare('SELECT provider FROM provider_usage WHERE provider=? AND blocked_until>? LIMIT 1').bind(config.id,now).first();
      if(cooling) continue;
      const reservation = await this.env.DB.prepare(`INSERT INTO provider_usage(provider,day,requests,blocked_until) VALUES (?,?,1,0)
        ON CONFLICT(provider,day) DO UPDATE SET requests=requests+1 WHERE requests<? AND blocked_until<=? RETURNING requests`)
        .bind(config.id,day,config.dailyRequestLimit,now).first();
      if (!reservation) continue;
      try {
        const signal = AbortSignal.timeout(12000);
        let text: string;
        if (config.id === 'cloudflare') {
          const result = await Promise.race([
            this.env.AI!.run(config.model,{messages,max_tokens:1024}),
            new Promise<never>((_,reject) => signal.addEventListener('abort',()=>reject(new ApiError(504,'provider_timeout')),{once:true})),
          ]) as {response?: string};
          if (typeof result.response !== 'string' || !result.response.trim()) throw new ApiError(503,'invalid_provider_response');
          text = result.response;
        } else text = await new HttpProvider(this.env,config,this.fetcher).complete(messages,signal);
        return {text,provider:config.id};
      } catch (error) {
        console.warn('provider_failure', error instanceof ApiError ? error.code : error instanceof Error ? error.name : 'unknown');
        if (error instanceof ApiError && error.status === 429) {
          await this.env.DB.prepare('UPDATE provider_usage SET blocked_until=? WHERE provider=? AND day=?').bind(Date.now()+(error.retryAfter ?? 60)*1000,config.id,day).run();
        }
        // Never persist provider payloads or credentials in diagnostic logs.
      }
    }
    throw new ApiError(503,'no_available_model');
  }
}

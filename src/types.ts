export interface Env {
  DB: D1Database;
  PROVIDERS_JSON?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GENERIC_API_KEY?: string;
  BACKUPS?: R2Bucket;
  BACKUPS_ENABLED?: string;
  WEB_ENABLED?: string;
  AI?: { run(model: string, input: unknown): Promise<unknown> };
}
export interface Principal { userId: string; deviceId: string; role: 'owner' | 'reader'; timezone: string }
export interface Message { role: 'system' | 'user' | 'assistant'; content: string }
export class ApiError extends Error {
  constructor(public status: number, public code: string, public retryAfter?: number) { super(code); }
}

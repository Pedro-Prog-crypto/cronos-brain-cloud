export interface Env {
  DB: D1Database;
  PROVIDERS_JSON?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GENERIC_API_KEY?: string;
  BACKUPS?: R2Bucket;
  BACKUPS_ENABLED?: string;
  WEB_ENABLED?: string;
  CAPABILITIES_JSON?: string;
  CAPABILITY_API_KEY?: string;
  RESEARCH_FEEDS_JSON?: string;
  NOTIFICATION_ALLOWED_HOSTS_JSON?: string;
  NOTIFICATION_SIGNING_KEY?: string;
  AI?: { run(model: string, input: unknown): Promise<unknown> };
}
export interface Principal { userId: string; deviceId: string; role: 'owner' | 'reader'; timezone: string }
export interface Message { role: 'system' | 'user' | 'assistant'; content: string }
export class ApiError extends Error {
  constructor(public status: number, public code: string, public retryAfter?: number) { super(code); }
}

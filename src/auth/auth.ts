import { ApiError, type Env, type Principal } from '../types';

export async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
export function token(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}
export async function rateLimit(db: D1Database, key: string, maximum: number, windowSeconds = 60) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = `${key}:${Math.floor(now / windowSeconds)}`;
  const row = await db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count')
    .bind(bucket, now + windowSeconds).first<{count: number}>();
  if (!row || row.count > maximum) throw new ApiError(429, 'rate_limited', windowSeconds);
}
export async function authenticate(request: Request, env: Env): Promise<Principal> {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization') ?? '');
  if (!match) throw new ApiError(401, 'invalid_session');
  const p = await env.DB.prepare(`SELECT d.user_id as userId,d.id as deviceId,d.role,u.timezone
    FROM sessions s JOIN devices d ON s.device_id=d.id JOIN users u ON d.user_id=u.id
    WHERE s.token_hash=? AND s.expires_at>? AND d.revoked_at IS NULL`)
    .bind(await hash(match[1]), Math.floor(Date.now()/1000)).first<Principal>();
  if (!p) throw new ApiError(401, 'invalid_session');
  return p;
}
export async function createSession(env: Env, deviceId: string, credential: string) {
  const device = await env.DB.prepare('SELECT id FROM devices WHERE id=? AND credential_hash=? AND revoked_at IS NULL')
    .bind(deviceId, await hash(credential)).first();
  if (!device) throw new ApiError(401, 'invalid_credentials');
  const accessToken = token();
  await env.DB.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(accessToken), deviceId, Math.floor(Date.now()/1000)+900).run();
  return { accessToken, expiresIn: 900, tokenType: 'Bearer' };
}
export function owner(p: Principal) { if (p.role !== 'owner') throw new ApiError(403, 'insufficient_permission'); }

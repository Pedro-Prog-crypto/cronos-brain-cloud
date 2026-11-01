import { z } from 'zod';
import { ApiError } from '../types';
export function json(value: unknown, status = 200) {
  return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",'Strict-Transport-Security':'max-age=31536000'}});
}
export async function body<T>(r: Request, schema: z.ZodType<T>, maximum = 32768): Promise<T> {
  if (!(r.headers.get('Content-Type') ?? '').startsWith('application/json')) throw new ApiError(415,'json_required');
  const reader = r.body?.getReader();
  if (!reader) throw new ApiError(400,'invalid_json');
  let length = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const {done,value} = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > maximum) { await reader.cancel(); throw new ApiError(413,'body_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  let data: unknown;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ApiError(400,'invalid_json'); }
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError(422,'invalid_input');
  return parsed.data;
}

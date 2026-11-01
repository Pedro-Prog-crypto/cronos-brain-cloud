import { z } from "zod";
import { D1MemoryStore } from "../storage/store";
import type { Env } from "../types";

export const personalitySchema = z
  .object({
    detail: z.number().int().min(0).max(100),
    formality: z.number().int().min(0).max(100),
    humor: z.number().int().min(0).max(100),
    language: z.enum(["Português (Brasil)", "English", "Español"]),
    format: z.enum(["Markdown com exemplos", "Texto simples", "Passo a passo"]),
  })
  .strict();
const defaults = {
  detail: 70,
  formality: 80,
  humor: 30,
  language: "Português (Brasil)",
  format: "Markdown com exemplos",
} as const;
const source = "cronos:personality";
export async function personality(env: Env, userId: string) {
  const row = await env.DB.prepare(
    "SELECT id,version,content FROM memories WHERE user_id=? AND source=? AND kind='semantic' ORDER BY updated_at DESC,id LIMIT 1",
  )
    .bind(userId, source)
    .first<{ id: string; version: number; content: string }>();
  try {
    const parsed = personalitySchema.safeParse(
      JSON.parse(row?.content ?? "null"),
    );
    if (parsed.success) return { preferences: parsed.data, saved: true, row };
  } catch {
    /* Invalid notes cannot add instructions to the system prompt. */
  }
  return { preferences: { ...defaults }, saved: false, row };
}
export async function savePersonality(
  env: Env,
  userId: string,
  input: z.infer<typeof personalitySchema>,
) {
  const current = await personality(env, userId);
  const memory = {
    kind: "semantic" as const,
    source,
    content: JSON.stringify(input),
    confidence: 1,
    metadata: { topics: ["Preferências de resposta"] },
  };
  const store = new D1MemoryStore(env.DB);
  if (current.row)
    await store.update(userId, current.row.id, current.row.version, memory);
  else await store.save(userId, memory);
  await env.DB.prepare("DELETE FROM response_cache WHERE user_id=?")
    .bind(userId)
    .run();
}
export async function personalityInstruction(env: Env, userId: string) {
  const { preferences: p } = await personality(env, userId);
  return ` Estilo solicitado: idioma ${p.language}; formato ${p.format}; nível de detalhe ${p.detail}/100; formalidade ${p.formality}/100; humor discreto ${p.humor}/100. Ajuste apenas a apresentação; preserve precisão, evidências e permissões.`;
}

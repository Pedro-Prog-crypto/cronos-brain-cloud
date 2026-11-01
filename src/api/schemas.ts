import { z } from 'zod';
const text = z.string().trim().min(1).max(8000);
const label = z.string().trim().min(1).max(120);
const date = z.iso.datetime({offset: true});
const base = {content: text, source: z.string().min(1).max(500), confidence: z.number().min(0).max(1).default(1)};
export const memorySchema = z.discriminatedUnion('kind', [
  z.object({...base, kind: z.literal('episodic'), metadata: z.object({occurredAt: date, context: label}).strict()}).strict(),
  z.object({...base, kind: z.literal('semantic'), metadata: z.object({topics: z.array(label).max(20)}).strict()}).strict(),
  z.object({...base, kind: z.literal('temporal'), metadata: z.object({dueAt: date, status: z.enum(['active','completed','cancelled']).default('active')}).strict()}).strict(),
  z.object({...base, kind: z.literal('procedural'), metadata: z.object({steps: z.array(text).min(1).max(30), execution: z.literal('manual')}).strict()}).strict(),
  z.object({...base, kind: z.literal('relational'), metadata: z.object({from: label, to: label, relation: label}).strict()}).strict(),
]);
export type MemoryInput = z.infer<typeof memorySchema>;
export const chatSchema = z.object({message: text, conversationId: z.string().uuid().optional(), remember: z.boolean().default(false),complex:z.boolean().default(false)}).strict();
export const titleSchema = z.object({title: label}).strict();
export const eventSchema = z.object({title: label, dueAt: date, notify: z.boolean().default(false)}).strict();
export const sessionSchema = z.object({deviceId: z.string().uuid(), credential: z.string().regex(/^[a-f0-9]{64}$/)}).strict();

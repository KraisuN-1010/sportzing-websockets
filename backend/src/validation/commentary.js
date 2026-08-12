import { z } from 'zod';

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative().optional(),
  period: z.string().min(1, 'Period is required'),
  eventType: z.string().optional(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

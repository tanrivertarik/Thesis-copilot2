import { z } from 'zod';
import { IdSchema } from './common.js';

export const SourceChunkSchema = z.object({
  id: IdSchema,
  sourceId: IdSchema,
  projectId: IdSchema,
  order: z.number().int().nonnegative(),
  text: z.string().min(1),
  tokenCount: z.number().int().nonnegative(),
  embedding: z.array(z.number()).min(1).optional(),
  metadata: z
    .object({
      heading: z.string().optional(),
      pageRange: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional()
    })
    .optional()
});

export const RetrievalRequestSchema = z.object({
  projectId: IdSchema,
  sectionId: IdSchema,
  query: z.string().min(1),
  limit: z.number().int().positive().max(15).default(8)
});

export const RetrievalResultSchema = z.object({
  query: RetrievalRequestSchema,
  chunks: z.array(
    SourceChunkSchema.extend({
      score: z.number().nonnegative().max(1),
      citation: z.string().optional()
    })
  )
});

export type SourceChunk = z.infer<typeof SourceChunkSchema>;
export type RetrievalRequest = z.infer<typeof RetrievalRequestSchema>;
export type RetrievalResult = z.infer<typeof RetrievalResultSchema>;

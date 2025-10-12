import { z } from 'zod';
import { IdSchema, ThesisSectionSchema } from './common.js';
import { SourceChunkSchema } from './retrieval.js';

export const SectionDraftRequestSchema = z.object({
  projectId: IdSchema,
  sectionId: IdSchema,
  section: ThesisSectionSchema,
  thesisSummary: z
    .object({
      scope: z.string().optional(),
      toneGuidelines: z.string().optional(),
      coreArgument: z.string().optional()
    })
    .optional(),
  citationStyle: z.string().optional(),
  chunks: z.array(
    SourceChunkSchema.pick({
      id: true,
      sourceId: true,
      projectId: true,
      text: true,
      metadata: true
    })
  ),
  maxTokens: z.number().int().positive().max(2048).default(800)
});

export const SectionDraftResponseSchema = z.object({
  draft: z.string(),
  usedChunkIds: z.array(IdSchema),
  tokenUsage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional()
    })
    .optional(),
  latencyMs: z.number().nonnegative()
});

export type SectionDraftRequest = z.infer<typeof SectionDraftRequestSchema>;
export type SectionDraftResponse = z.infer<typeof SectionDraftResponseSchema>;

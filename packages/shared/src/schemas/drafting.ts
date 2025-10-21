import { z } from 'zod';
import { IdSchema, ThesisSectionSchema } from './common.js';
import { SourceChunkSchema } from './retrieval.js';
import { DraftCitationSchema } from './draft.js';

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

export const RewriteDraftRequestSchema = z.object({
  projectId: IdSchema,
  sectionId: IdSchema,
  paragraphId: IdSchema,
  originalHtml: z.string(),
  editedHtml: z.string(),
  citations: z.array(DraftCitationSchema).default([]),
  thesisSummary: z
    .object({
      scope: z.string().optional(),
      toneGuidelines: z.string().optional(),
      coreArgument: z.string().optional()
    })
    .optional(),
  citationStyle: z.string().optional(),
  surroundingParagraphs: z
    .object({
      previous: z.array(z.string()).default([]),
      next: z.array(z.string()).default([])
    })
    .optional(),
  maxTokens: z.number().int().positive().max(1024).default(350)
});

export const RewriteDraftResponseSchema = z.object({
  paragraphId: IdSchema,
  suggestionHtml: z.string(),
  reasoning: z.string().optional(),
  tokenUsage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional()
    })
    .optional(),
  latencyMs: z.number().nonnegative()
});

// AI Command Processing (Tool Calling)
export const EditOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('insert'),
    position: z.enum(['start', 'end', 'cursor']),
    content: z.string(),
    reason: z.string().optional()
  }),
  z.object({
    type: z.literal('replace'),
    from: z.number().nonnegative(),
    to: z.number().nonnegative(),
    content: z.string(),
    originalContent: z.string().optional(),
    reason: z.string().optional()
  }),
  z.object({
    type: z.literal('delete'),
    from: z.number().nonnegative(),
    to: z.number().nonnegative(),
    deletedContent: z.string().optional(),
    reason: z.string().optional()
  }),
  z.object({
    type: z.literal('rewrite'),
    target: z.enum(['paragraph', 'section', 'selection']),
    content: z.string(),
    reason: z.string().optional()
  })
]);

export const AICommandRequestSchema = z.object({
  projectId: IdSchema,
  sectionId: IdSchema,
  command: z.string(),
  currentHtml: z.string(),
  selectionRange: z
    .object({
      from: z.number().nonnegative(),
      to: z.number().nonnegative()
    })
    .optional(),
  thesisSummary: z
    .object({
      scope: z.string().optional(),
      toneGuidelines: z.string().optional(),
      coreArgument: z.string().optional()
    })
    .optional(),
  citations: z.array(DraftCitationSchema).default([]),
  maxTokens: z.number().int().positive().max(100000).default(2048)  // Allow up to 100k tokens for complex long-form generation
});

export const AICommandResponseSchema = z.object({
  operation: EditOperationSchema,
  preview: z.string().optional(), // HTML preview of the change
  reasoning: z.string(),
  tokenUsage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional()
    })
    .optional(),
  latencyMs: z.number().nonnegative()
});

export type EditOperation = z.infer<typeof EditOperationSchema>;
export type AICommandRequest = z.infer<typeof AICommandRequestSchema>;
export type AICommandResponse = z.infer<typeof AICommandResponseSchema>;

export type SectionDraftRequest = z.infer<typeof SectionDraftRequestSchema>;
export type SectionDraftResponse = z.infer<typeof SectionDraftResponseSchema>;
export type RewriteDraftRequest = z.infer<typeof RewriteDraftRequestSchema>;
export type RewriteDraftResponse = z.infer<typeof RewriteDraftResponseSchema>;

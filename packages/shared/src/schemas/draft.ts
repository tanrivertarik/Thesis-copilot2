import { z } from 'zod';
import { IdSchema, TimestampSchema } from './common.js';

export const DraftCitationSchema = z.object({
  placeholder: z
    .string()
    .regex(/\[CITE:[^\]\s]+\]/, 'Citation placeholder must use [CITE:sourceId] format'),
  sourceId: IdSchema,
  sourceTitle: z.string(),
  snippet: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const DraftVersionSchema = z.object({
  id: IdSchema,
  html: z.string(),
  createdAt: TimestampSchema,
  createdBy: IdSchema.optional(),
  summary: z.string().optional()
});

export const DraftSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  sectionId: IdSchema,
  html: z.string(),
  citations: z.array(DraftCitationSchema).default([]),
  annotations: z
    .array(
      z.object({
        id: IdSchema,
        type: z.enum(['COMMENT', 'NOTE']).default('COMMENT'),
        payload: z.record(z.unknown()).optional(),
        createdAt: TimestampSchema,
        createdBy: IdSchema.optional()
      })
    )
    .default([]),
  version: z.number().int().nonnegative().default(1),
  versions: z.array(DraftVersionSchema).default([]),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  lastSavedBy: IdSchema.optional()
});

export const DraftSaveInputSchema = DraftSchema.pick({
  html: true,
  citations: true,
  annotations: true
}).extend({
  lastSavedBy: IdSchema.optional()
});

export type DraftCitation = z.infer<typeof DraftCitationSchema>;
export type DraftVersion = z.infer<typeof DraftVersionSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type DraftSaveInput = z.infer<typeof DraftSaveInputSchema>;

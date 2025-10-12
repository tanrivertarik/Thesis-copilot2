import { z } from 'zod';
import { IdSchema, TimestampSchema } from './common.js';

export const SourceKindSchema = z.enum(['PDF', 'TEXT', 'URL', 'MANUAL']);
export const SourceStatusSchema = z.enum(['UPLOADED', 'PROCESSING', 'READY', 'FAILED']);

export const SourceMetadataSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  publicationYear: z.number().int().min(0).max(new Date().getFullYear()).optional(),
  citation: z.string().optional(),
  pageCount: z.number().int().positive().optional()
});

export const SourceSummarySchema = z.object({
  abstract: z.string().optional(),
  bulletPoints: z.array(z.string()).max(10).optional()
});

export const SourceSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  ownerId: IdSchema,
  kind: SourceKindSchema,
  status: SourceStatusSchema,
  metadata: SourceMetadataSchema,
  summary: SourceSummarySchema.optional(),
  embeddingModel: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
});

export const SourceCreateSchema = z.object({
  projectId: IdSchema,
  kind: SourceKindSchema,
  metadata: SourceMetadataSchema.extend({
    title: z.string().min(1)
  }),
  upload: z
    .object({
      contentType: z.enum(['TEXT', 'PDF']).default('TEXT'),
      data: z.string().min(1)
    })
    .optional()
});

export const SourceUploadSchema = z.object({
  contentType: z.enum(['TEXT', 'PDF']).default('TEXT'),
  data: z.string().min(1)
});

export const SourceIngestionResultSchema = z.object({
  sourceId: IdSchema,
  status: SourceStatusSchema,
  summary: SourceSummarySchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string()
    })
    .optional(),
  embeddingModel: z.string().optional(),
  chunkCount: z.number().int().nonnegative().optional(),
  processingTimeMs: z.number().nonnegative().optional()
});

export type Source = z.infer<typeof SourceSchema>;
export type SourceCreateInput = z.infer<typeof SourceCreateSchema>;
export type SourceUploadInput = z.infer<typeof SourceUploadSchema>;
export type SourceIngestionResult = z.infer<typeof SourceIngestionResultSchema>;

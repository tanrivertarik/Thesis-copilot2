import { z } from 'zod';
import {
  CitationStyleSchema,
  IdSchema,
  ThesisConstitutionSchema,
  ThesisMetadataSchema,
  TimestampSchema
} from './common.js';

export const ProjectVisibilitySchema = z.enum(['PRIVATE', 'TEAM']);

export const ProjectSchema = z.object({
  id: IdSchema,
  ownerId: IdSchema,
  title: z.string().min(1),
  topic: z.string().min(1),
  researchQuestions: z.array(z.string().min(1)),
  thesisStatement: z.string().optional(),
  citationStyle: CitationStyleSchema,
  targetWordCount: z.number().int().min(1000).max(100000).optional(), // Target thesis length in words
  constitution: ThesisConstitutionSchema.optional(),
  thesisMetadata: ThesisMetadataSchema.optional(), // Complete thesis metadata for professional formatting
  visibility: ProjectVisibilitySchema.default('PRIVATE'),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
});

export const ProjectCreateSchema = ProjectSchema.pick({
  title: true,
  topic: true,
  researchQuestions: true,
  thesisStatement: true,
  citationStyle: true,
  targetWordCount: true,
  visibility: true,
  constitution: true,
  thesisMetadata: true
}).extend({
  constitution: ThesisConstitutionSchema.optional(),
  thesisMetadata: ThesisMetadataSchema.optional()
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;

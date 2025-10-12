import { z } from 'zod';

export const IdSchema = z.string().min(1, 'id is required');

export const TimestampSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.number().int().nonnegative().transform((value) => new Date(value).toISOString()));

export const CitationStyleSchema = z.enum(['APA', 'MLA', 'CHICAGO', 'IEEE', 'HARVARD']);

export const ThesisSectionSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  objective: z.string().min(1),
  expectedLength: z
    .number()
    .int()
    .nonnegative()
    .optional()
});

export const ThesisConstitutionSchema = z.object({
  scope: z.string().min(1),
  toneGuidelines: z.string().min(1),
  coreArgument: z.string().min(1),
  outline: z.object({
    sections: z.array(ThesisSectionSchema)
  })
});

export type CitationStyle = z.infer<typeof CitationStyleSchema>;
export type ThesisConstitution = z.infer<typeof ThesisConstitutionSchema>;
export type ThesisSection = z.infer<typeof ThesisSectionSchema>;

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

export const ThesisMetadataSchema = z.object({
  // Title page information
  title: z.string().min(1),
  author: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    middleName: z.string().optional(),
    studentId: z.string().optional()
  }),

  // Degree information
  degree: z.object({
    type: z.enum(['BACHELOR', 'MASTER', 'PHD']),
    fieldOfStudy: z.string().min(1),
    fullTitle: z.string().optional() // e.g., "Master of Science" instead of abbreviated
  }),

  // Institution information
  institution: z.object({
    name: z.string().min(1),
    department: z.string().min(1),
    faculty: z.string().optional(),
    location: z.string().optional() // e.g., "Ann Arbor, Michigan"
  }),

  // Committee/Advisors
  committee: z.array(z.object({
    name: z.string().min(1),
    title: z.string(), // e.g., "Professor", "Associate Professor"
    role: z.enum(['ADVISOR', 'CHAIR', 'MEMBER', 'EXTERNAL_EXAMINER'])
  })).optional(),

  // Dates
  submissionDate: z.string(), // e.g., "May 2025"
  defenseDate: z.string().optional(),

  // Front matter content
  abstract: z.string().max(500).optional(), // 200-350 words typically
  acknowledgements: z.string().optional(),
  dedication: z.string().optional(),

  // Flags for optional sections
  includeCopyright: z.boolean().default(false),
  includeDedication: z.boolean().default(false),
  includeAcknowledgements: z.boolean().default(false),
  includeListOfTables: z.boolean().default(false),
  includeListOfFigures: z.boolean().default(false),
  includeListOfAbbreviations: z.boolean().default(false),

  // Abbreviations/Symbols (if needed)
  abbreviations: z.array(z.object({
    abbreviation: z.string().min(1),
    fullForm: z.string().min(1)
  })).optional()
});

export type CitationStyle = z.infer<typeof CitationStyleSchema>;
export type ThesisConstitution = z.infer<typeof ThesisConstitutionSchema>;
export type ThesisSection = z.infer<typeof ThesisSectionSchema>;
export type ThesisMetadata = z.infer<typeof ThesisMetadataSchema>;

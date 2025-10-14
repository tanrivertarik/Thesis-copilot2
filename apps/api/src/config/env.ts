import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
  loadEnv();
}

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    FIREBASE_ADMIN_PROJECT_ID: z.string().optional(),
    FIREBASE_ADMIN_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_EMBEDDING_MODEL: z.string().optional(),
    PINECONE_API_KEY: z.string().optional(),
    PINECONE_HOST: z.string().optional(),
    PINECONE_EMBEDDING_MODEL: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }

    ([
      'FIREBASE_ADMIN_PROJECT_ID',
      'FIREBASE_ADMIN_CLIENT_EMAIL',
      'FIREBASE_ADMIN_PRIVATE_KEY',
      'OPENROUTER_API_KEY',
      'OPENAI_API_KEY',
      'PINECONE_API_KEY',
      'PINECONE_HOST',
      'PINECONE_EMBEDDING_MODEL'
    ] as const).forEach((key) => {
      if (!data[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Required in production',
          path: [key]
        });
      }
    });
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid API environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const {
  PORT,
  NODE_ENV,
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
  OPENROUTER_API_KEY,
  OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL,
  PINECONE_API_KEY,
  PINECONE_HOST,
  PINECONE_EMBEDDING_MODEL
} = parsed.data;

const firebaseAdmin =
  FIREBASE_ADMIN_PROJECT_ID &&
  FIREBASE_ADMIN_CLIENT_EMAIL &&
  FIREBASE_ADMIN_PRIVATE_KEY
    ? {
        projectId: FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
      }
    : undefined;

export const env = {
  port: PORT,
  nodeEnv: NODE_ENV,
  firebaseAdmin,
  openRouterApiKey: OPENROUTER_API_KEY,
  openAiApiKey: OPENAI_API_KEY,
  openAiEmbeddingModel: OPENAI_EMBEDDING_MODEL,
  pineconeApiKey: PINECONE_API_KEY,
  pineconeHost: PINECONE_HOST,
  pineconeEmbeddingModel: PINECONE_EMBEDDING_MODEL
} as const;

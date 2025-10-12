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
    OPENROUTER_API_KEY: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }

    ([
      'FIREBASE_ADMIN_PROJECT_ID',
      'FIREBASE_ADMIN_CLIENT_EMAIL',
      'FIREBASE_ADMIN_PRIVATE_KEY',
      'OPENROUTER_API_KEY'
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
  OPENROUTER_API_KEY
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
  openRouterApiKey: OPENROUTER_API_KEY
} as const;

import { z } from 'zod';

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1, 'VITE_FIREBASE_API_KEY is required'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'VITE_FIREBASE_AUTH_DOMAIN is required'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'VITE_FIREBASE_PROJECT_ID is required'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'VITE_FIREBASE_STORAGE_BUCKET is required'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, 'VITE_FIREBASE_MESSAGING_SENDER_ID is required'),
  VITE_FIREBASE_APP_ID: z.string().min(1, 'VITE_FIREBASE_APP_ID is required'),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:3001')
});

const validated = envSchema.safeParse({
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
});

if (!validated.success) {
  const errors = validated.error.flatten().fieldErrors;
  const message = Object.entries(errors)
    .map(([key, value]) => `${key}: ${value?.join(', ')}`)
    .join('\n');

  throw new Error(`Invalid Vite environment configuration:\n${message}`);
}

export const env = {
  firebase: {
    apiKey: validated.data.VITE_FIREBASE_API_KEY,
    authDomain: validated.data.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: validated.data.VITE_FIREBASE_PROJECT_ID,
    storageBucket: validated.data.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: validated.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: validated.data.VITE_FIREBASE_APP_ID,
    measurementId: validated.data.VITE_FIREBASE_MEASUREMENT_ID
  },
  apiBaseUrl: validated.data.VITE_API_BASE_URL
} as const;

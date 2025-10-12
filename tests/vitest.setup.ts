import { config } from 'dotenv';
import { beforeAll } from 'vitest';

config();

// Force OpenRouter fallback during tests
process.env.OPENROUTER_API_KEY = '';

beforeAll(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST must be set when running integration tests.');
  }
});

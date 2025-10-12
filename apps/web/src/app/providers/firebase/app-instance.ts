import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { env } from '../../../lib/env';

function createFirebaseApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }
  return initializeApp(env.firebase);
}

export const firebaseApp = createFirebaseApp();

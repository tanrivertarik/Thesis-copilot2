import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import { env } from '../config/env.js';

let firestore: admin.firestore.Firestore | null = null;

function initializeApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (!existing) {
      throw new Error('Firebase Admin failed to return an initialized app');
    }
    return existing;
  }

  // If using emulator, initialize without credentials
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const app = admin.initializeApp({
      projectId: 'thesis-copilot-test'
    });
    return app;
  }

  if (!env.firebaseAdmin) {
    throw new Error(
      'Firebase Admin credentials are not configured. Populate FIREBASE_ADMIN_* variables.'
    );
  }

  const credentials: ServiceAccount = {
    projectId: env.firebaseAdmin.projectId,
    clientEmail: env.firebaseAdmin.clientEmail,
    privateKey: env.firebaseAdmin.privateKey
  };

  const app = admin.initializeApp({
    credential: admin.credential.cert(credentials)
  });

  if (!app) {
    throw new Error('Firebase Admin initialization returned null app instance');
  }

  return app;
}

export function getFirestore() {
  if (firestore) {
    return firestore;
  }

  const app = initializeApp();
  firestore = app.firestore();

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    firestore.settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false
    });
  }

  return firestore;
}

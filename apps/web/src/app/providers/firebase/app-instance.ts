import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { env } from '../../../lib/env';

let isEmulatorConnected = false;

function createFirebaseApp(): FirebaseApp {
  console.log('🔥 Initializing Firebase app...');
  
  const existing = getApps();
  if (existing.length > 0) {
    console.log('🔥 Using existing Firebase app');
    return existing[0];
  }
  
  console.log('🔥 Creating new Firebase app with config:', {
    projectId: env.firebase.projectId,
    authDomain: env.firebase.authDomain
  });
  
  const app = initializeApp(env.firebase);
  
  // Connect to emulators in development (only once)
  console.log('🔧 Emulator check:', import.meta.env.VITE_USE_FIREBASE_EMULATOR);
  console.log('🔧 Already connected:', isEmulatorConnected);
  
  if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && !isEmulatorConnected) {
    console.log('🧪 Connecting to Firebase emulators...');
    try {
      const auth = getAuth(app);
      const db = getFirestore(app);
      
      console.log('🔐 Connecting Auth emulator to localhost:9099...');
      connectAuthEmulator(auth, 'http://localhost:9099');
      
      console.log('📊 Connecting Firestore emulator to localhost:8080...');
      connectFirestoreEmulator(db, 'localhost', 8080);
      
      isEmulatorConnected = true;
      console.log('✅ Connected to Firebase emulators successfully');
    } catch (error) {
      console.warn('⚠️ Firebase emulators connection failed:', error);
    }
  }
  
  return app;
}

export const firebaseApp = createFirebaseApp();

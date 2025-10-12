import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { env } from '../../../lib/env';

const FirebaseAppContext = createContext<FirebaseApp | null>(null);

function createFirebaseApp() {
  const existing = getApps();
  if (existing.length) {
    return existing[0];
  }

  return initializeApp(env.firebase);
}

export function FirebaseProvider({ children }: PropsWithChildren) {
  const app = useMemo(createFirebaseApp, []);
  return <FirebaseAppContext.Provider value={app}>{children}</FirebaseAppContext.Provider>;
}

export function useFirebaseApp() {
  const context = useContext(FirebaseAppContext);

  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }

  return context;
}

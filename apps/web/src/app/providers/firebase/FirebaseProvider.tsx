import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { firebaseApp } from './app-instance';

const FirebaseAppContext = createContext<FirebaseApp | null>(firebaseApp);

export function FirebaseProvider({ children }: PropsWithChildren) {
  const app = useMemo(() => firebaseApp, []);
  return <FirebaseAppContext.Provider value={app}>{children}</FirebaseAppContext.Provider>;
}

export function useFirebaseApp() {
  const context = useContext(FirebaseAppContext);

  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }

  return context;
}

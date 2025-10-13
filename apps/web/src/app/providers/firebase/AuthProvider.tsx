import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  type User
} from 'firebase/auth';
import { useFirebaseApp } from './FirebaseProvider';

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const app = useFirebaseApp();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const providerId = Math.random().toString(36).substring(7);
    console.log('👂 Setting up auth state listener...', providerId);
    
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      console.log(`🔄 [${providerId}] Auth state changed:`, {
        timestamp: new Date().toISOString(),
        user: nextUser ? {
          uid: nextUser.uid,
          email: nextUser.email,
          displayName: nextUser.displayName
        } : null,
        wasLoading: loading,
        authStateValid: !!nextUser
      });
      
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      console.log(`🔌 [${providerId}] Unsubscribing auth listener`);
      unsubscribe();
    };
  }, [app]);

  const value = useMemo<AuthContextValue>(() => {
    const auth = getAuth(app);

    return {
      user,
      loading,
      signInWithGoogle: async () => {
        console.log('🔐 Starting sign-in process...');
        console.log('🔧 Emulator mode:', import.meta.env.VITE_USE_FIREBASE_EMULATOR);
        
        // In emulator mode, use a demo user for development  
        if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
          console.log('🧪 Using emulator authentication');
          const { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
          
          const demoEmail = 'demo@thesis-copilot.test';
          const demoPassword = 'demo123';
          
          try {
            console.log('🔑 Attempting to sign in existing demo user...');
            // Try to sign in with existing demo user
            const result = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
            console.log('✅ Demo user signed in successfully:', result.user.email);
          } catch (error: any) {
            console.log('⚠️ Sign-in failed:', error.code, error.message);
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
              console.log('👤 Creating new demo user...');
              try {
                // Create demo user if it doesn't exist
                const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
                console.log('✅ Demo user created:', userCredential.user.email);
                
                await updateProfile(userCredential.user, {
                  displayName: 'Demo User',
                  photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=ffffff'
                });
                console.log('✅ Demo user profile updated');
              } catch (createError: any) {
                console.error('❌ Failed to create demo user:', createError);
                throw createError;
              }
            } else {
              console.error('❌ Authentication error:', error);
              throw error;
            }
          }
        } else {
          console.log('🌐 Using production Google OAuth');
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        }
      },
      signOutUser: async () => {
        await signOut(auth);
      }
    };
  }, [app, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

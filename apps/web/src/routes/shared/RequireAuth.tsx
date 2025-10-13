import { Navigate, useLocation } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function RequireAuth({ children }: PropsWithChildren): ReactNode {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('🛡️ RequireAuth check:', {
    timestamp: new Date().toISOString(),
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    userUid: user?.uid,
    currentPath: location.pathname
  });

  if (loading) {
    console.log('⏳ Auth still loading, showing spinner...');
    return (
      <Center minH="100vh">
        <Spinner color="blue.300" size="lg" />
      </Center>
    );
  }

  if (!user) {
    console.log('🚫 No user found, redirecting to login...', {
      timestamp: new Date().toISOString(),
      userState: user,
      loadingState: loading
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ User authenticated, rendering protected content...', {
    timestamp: new Date().toISOString(),
    userEmail: user.email
  });
  return children;
}

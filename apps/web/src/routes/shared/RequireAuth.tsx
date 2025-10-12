import { Navigate, useLocation } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function RequireAuth({ children }: PropsWithChildren): ReactNode {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner color="blue.300" size="lg" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

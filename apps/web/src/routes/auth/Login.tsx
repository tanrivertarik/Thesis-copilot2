import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Center, Heading, Stack, Text } from '@chakra-ui/react';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('🔀 Login component effect:', {
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      currentPath: location.pathname
    });
    
    if (user && !loading) {
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/workspace';
      console.log('🎯 Navigating authenticated user to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  return (
    <Center minH="100vh" bgGradient="radial(surface, #020617)">
      <Box
        maxW="lg"
        w="full"
        p={{ base: 8, md: 12 }}
        borderRadius="2xl"
        bg="rgba(15, 23, 42, 0.85)"
        border="1px solid rgba(63,131,248,0.25)"
        boxShadow="2xl"
      >
        <Stack spacing={6} textAlign="center">
          <Heading size="lg" color="blue.100">
            Sign in to Thesis Copilot
          </Heading>
          <Text color="blue.50">
            {import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' 
              ? 'Development mode: Sign in as demo user to access your projects, sources, and drafting workspace.'
              : 'Connect with Google to access your projects, sources, and drafting workspace.'
            }
          </Text>
          <Button
            onClick={signInWithGoogle}
            colorScheme="blue"
            size="lg"
            isLoading={loading}
          >
            {import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' 
              ? 'Sign in as Demo User' 
              : 'Continue with Google'
            }
          </Button>
        </Stack>
      </Box>
    </Center>
  );
}

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Center, Heading, Stack, Text } from '@chakra-ui/react';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/workspace';
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, location.state]);

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
            Connect with Google to access your projects, sources, and drafting workspace.
          </Text>
          <Button
            onClick={signInWithGoogle}
            colorScheme="blue"
            size="lg"
            isLoading={loading}
          >
            Continue with Google
          </Button>
        </Stack>
      </Box>
    </Center>
  );
}

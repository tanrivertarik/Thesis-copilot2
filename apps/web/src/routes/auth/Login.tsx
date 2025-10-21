import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Center, Heading, Stack, Text, VStack, Flex, Icon } from '@chakra-ui/react';
import { Shield, Award, Users } from 'lucide-react';
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
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      console.log('🎯 Navigating authenticated user to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  return (
    <Center minH="100vh" bg="academic.background" position="relative">
      {/* Background decoration */}
      <Box
        position="absolute"
        top="10%"
        right="10%"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="academic.accent"
        opacity={0.03}
        filter="blur(80px)"
      />
      <Box
        position="absolute"
        bottom="10%"
        left="10%"
        width="300px"
        height="300px"
        borderRadius="full"
        bg="academic.accent"
        opacity={0.03}
        filter="blur(60px)"
      />

      <VStack spacing={8} maxW="lg" w="full" px={6} position="relative" zIndex={1}>
        {/* Main Sign In Card */}
        <Box
          w="full"
          p={{ base: 8, md: 12 }}
          borderRadius="2xl"
          bg="academic.paper"
          border="1px solid"
          borderColor="academic.border"
          boxShadow="soft"
        >
          <Stack spacing={6} textAlign="center">
            <VStack spacing={2}>
              <Heading 
                size="xl" 
                color="academic.primaryText"
                fontFamily="heading"
                letterSpacing="-0.02em"
              >
                Sign in to Thesis Copilot
              </Heading>
              <Text color="academic.secondaryText" fontSize="md">
                {import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' 
                  ? 'Development mode: Sign in as demo user to access your projects, sources, and drafting workspace.'
                  : 'Connect with Google to access your projects, sources, and drafting workspace.'
                }
              </Text>
            </VStack>
            
            <Button
              onClick={signInWithGoogle}
              colorScheme="brand"
              size="lg"
              isLoading={loading}
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(96, 122, 148, 0.25)'
              }}
            >
              {import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' 
                ? 'Sign in as Demo User' 
                : 'Continue with Google'
              }
            </Button>
          </Stack>
        </Box>

        {/* Trust Indicators */}
        <Flex
          gap={6}
          color="academic.secondaryText"
          fontSize="sm"
          flexWrap="wrap"
          justify="center"
          textAlign="center"
        >
          <Flex align="center" gap={2}>
            <Icon as={Shield} boxSize={4} />
            <Text>Source-Locked AI</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Icon as={Award} boxSize={4} />
            <Text>Academic Integrity</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Icon as={Users} boxSize={4} />
            <Text>Trusted by Scholars</Text>
          </Flex>
        </Flex>
      </VStack>
    </Center>
  );
}

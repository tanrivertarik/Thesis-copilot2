import { Outlet, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Flex, Heading, HStack, Button, Text, Spinner } from '@chakra-ui/react';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function AppLayout() {
  const { user, loading, signOutUser } = useAuth();

  return (
    <Box
      minH="100vh"
      bgGradient="radial(surface, #020617)"
      display="flex"
      alignItems="stretch"
    >
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 12 }}>
        <Flex
          align="center"
          justify="space-between"
          mb={{ base: 8, md: 12 }}
          border="1px solid rgba(63,131,248,0.25)"
          borderRadius="xl"
          px={{ base: 4, md: 6 }}
          py={{ base: 3, md: 4 }}
          bg="rgba(15,23,42,0.75)"
        >
          <Heading size="md" color="blue.100">
            Thesis Copilot
          </Heading>
          {loading ? (
            <Spinner color="blue.300" size="sm" />
          ) : user ? (
            <HStack spacing={4} color="blue.100">
              <Text fontSize="sm">{user.email ?? user.uid}</Text>
              <Button variant="outline" size="sm" onClick={signOutUser} colorScheme="blue">
                Sign out
              </Button>
            </HStack>
          ) : (
            <Button as={RouterLink} to="/login" colorScheme="blue" size="sm">
              Sign in
            </Button>
          )}
        </Flex>
        <Outlet />
      </Container>
    </Box>
  );
}

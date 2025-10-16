import { Outlet, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Button,
  Text,
  Spinner,
  Badge
} from '@chakra-ui/react';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function AppLayout() {
  const { user, loading, signOutUser } = useAuth();

  return (
    <Box
      minH="100vh"
      bg="academic.background"
      display="flex"
      alignItems="stretch"
    >
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 12 }}>
        <Flex
          align="center"
          justify="space-between"
          mb={{ base: 8, md: 12 }}
          px={{ base: 4, md: 6 }}
          py={{ base: 3, md: 4 }}
          bg="transparent"
        >
          <Heading 
            size="md" 
            color="academic.primaryText"
            fontFamily="heading"
            fontWeight="bold"
          >
            Thesis Copilot
          </Heading>
          {loading ? (
            <Spinner color="academic.accent" size="sm" />
          ) : user ? (
            <HStack spacing={4}>
              <Text fontSize="sm" color="academic.secondaryText" fontFamily="body">
                {user.email ?? user.uid}
              </Text>
              <Button 
                variant="link" 
                size="sm" 
                onClick={signOutUser}
                color="academic.secondaryText"
                _hover={{ color: 'academic.accent' }}
                fontFamily="body"
              >
                Sign out
              </Button>
            </HStack>
          ) : (
            <HStack spacing={3}>
              <Button as={RouterLink} to="/login" colorScheme="brand" size="sm">
                Sign in
              </Button>
            </HStack>
          )}
        </Flex>
        <Outlet />
      </Container>
    </Box>
  );
}

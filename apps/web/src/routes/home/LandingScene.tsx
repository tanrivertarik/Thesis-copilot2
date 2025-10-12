import { Button, HStack, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function LandingScene() {
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <PageShell
      title="Thesis Copilot"
      description="Guided workspace for planning, drafting, and polishing submission-ready theses."
      actions={
        <HStack spacing={3} flexWrap="wrap">
          {isAuthenticated ? (
            <Button as={RouterLink} to="/onboarding" colorScheme="blue" size="lg">
              Begin onboarding
            </Button>
          ) : (
            <Button as={RouterLink} to="/login" colorScheme="blue" size="lg" isLoading={loading}>
              Sign in to begin
            </Button>
          )}
          <Button
            as={RouterLink}
            to={isAuthenticated ? '/workspace' : '/login'}
            variant="outline"
            colorScheme="blue"
            size="lg"
          >
            {isAuthenticated ? 'Enter workspace' : 'View sign-in options'}
          </Button>
        </HStack>
      }
    >
      <Stack spacing={4} color="blue.50">
        <Text>
          Phase 0 UI scaffold is complete. Sign in to unlock onboarding, source ingestion, and AI
          drafting features.
        </Text>
        <Text>
          Use the shortcuts above to explore, and keep an eye on the top header for your current
          account status.
        </Text>
      </Stack>
    </PageShell>
  );
}

import { Button, HStack, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';

export function LandingScene() {
  return (
    <PageShell
      title="Thesis Copilot"
      description="Guided workspace for planning, drafting, and polishing submission-ready theses."
      actions={
        <HStack spacing={3} flexWrap="wrap">
          <Button as={RouterLink} to="/onboarding" colorScheme="blue" size="lg">
            Begin onboarding
          </Button>
          <Button as={RouterLink} to="/workspace" variant="outline" colorScheme="blue" size="lg">
            Enter workspace
          </Button>
        </HStack>
      }
    >
      <Stack spacing={4} color="blue.50">
        <Text>
          Phase 0 UI scaffold is complete. Next iterations will connect real data, Firebase Auth,
          and AI-powered drafting workflows.
        </Text>
        <Text>
          Use the shortcuts above to navigate the planned experiences and validate overall routing.
        </Text>
      </Stack>
    </PageShell>
  );
}

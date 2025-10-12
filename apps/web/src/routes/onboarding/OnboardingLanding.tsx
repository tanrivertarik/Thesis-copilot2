import { Button, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';

export function OnboardingLanding() {
  return (
    <PageShell
      title="Kick off your thesis with confidence"
      description="Answer a guided questionnaire to build your Thesis Constitution: goals, scope, tone, and a draft outline that keeps you grounded in your research."
      actions={
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} align="flex-start">
          <Button as={RouterLink} to="/onboarding/start" colorScheme="blue" size="lg">
            Start onboarding
          </Button>
          <Button as={RouterLink} to="/" variant="ghost" colorScheme="blue">
            Back to overview
          </Button>
        </Stack>
      }
    >
      <Stack spacing={4} color="blue.50">
        <Text>
          You&apos;ll provide project metadata, research questions, and citation preferences. We&apos;ll
          use that to generate a Thesis Constitution you can edit and iterate on.
        </Text>
        <Text>Estimated time: 5–7 minutes.</Text>
      </Stack>
    </PageShell>
  );
}

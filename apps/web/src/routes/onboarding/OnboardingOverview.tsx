import { Badge, Button, Stack, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';

export function OnboardingOverview() {
  const navigate = useNavigate();
  const { project, ingestionResult } = useOnboarding();

  useOnboardingStepNavigation({
    onNext: () => {
      navigate('/onboarding/start');
      return false;
    }
  });

  return (
    <PageShell
      title="Onboarding"
      description="Capture your thesis metadata to generate a Thesis Constitution and project workspace."
      actions={
        <Stack direction={{ base: 'column', md: 'row' }} spacing={3} align="flex-start">
          <Button colorScheme="blue" size="lg" onClick={() => navigate('/onboarding/start')}>
            Start questionnaire
          </Button>
          <Button
            variant="outline"
            colorScheme="blue"
            size="lg"
            onClick={() => navigate('/workspace')}
          >
            Skip to workspace
          </Button>
        </Stack>
      }
    >
      <VStack spacing={4} align="stretch" color="blue.50">
        <Text>
          You&apos;ll step through project basics, research questions, and initial sources. Once
          complete, Thesis Copilot will synthesise a Constitution tailored to your goals.
        </Text>
        <Text fontSize="sm" color="blue.200">
          Progress overview:
        </Text>
        <Stack spacing={2} fontSize="sm" color="blue.100">
          <Stack direction="row" align="center" spacing={3}>
            <Badge colorScheme={project ? 'green' : 'yellow'}>{project ? 'Done' : 'Pending'}</Badge>
            <Text>Project basics</Text>
          </Stack>
          <Stack direction="row" align="center" spacing={3}>
            <Badge colorScheme={ingestionResult ? 'green' : 'yellow'}>
              {ingestionResult ? 'Ready' : 'Add evidence'}
            </Badge>
            <Text>Initial sources & ingestion</Text>
          </Stack>
        </Stack>
        <Text fontSize="sm" color="blue.200">
          Coming soon: autosave, collaborative review, and integration with your faculty advisor.
        </Text>
      </VStack>
    </PageShell>
  );
}

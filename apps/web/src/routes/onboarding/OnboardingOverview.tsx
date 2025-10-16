import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import { CheckCircleIcon, TimeIcon } from '@chakra-ui/icons';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';

type OnboardingStep = {
  number: number;
  title: string;
  description: string;
  duration: string;
  status: 'pending' | 'in-progress' | 'complete';
};

export function OnboardingOverview() {
  const navigate = useNavigate();
  const { project, ingestionResult } = useOnboarding();

  const handleNext = useCallback(() => {
    navigate('/onboarding/start');
    return false;
  }, [navigate]);

  const navigationHandlers = useMemo(() => ({ onNext: handleNext }), [handleNext]);

  useOnboardingStepNavigation(navigationHandlers);

  const steps: OnboardingStep[] = [
    {
      number: 1,
      title: 'Project Basics',
      description: 'Define your thesis topic, research questions, and citation style',
      duration: '3-5 min',
      status: project ? 'complete' : 'pending'
    },
    {
      number: 2,
      title: 'Research Inputs',
      description: 'Upload initial sources or add research notes to ground your constitution',
      duration: '5-10 min',
      status: ingestionResult ? 'complete' : 'pending'
    },
    {
      number: 3,
      title: 'Review & Generate',
      description: 'Confirm your inputs and let Thesis Copilot generate your Constitution',
      duration: '1-2 min',
      status: 'pending'
    }
  ];

  const getStatusColor = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'complete':
        return 'brand';
      case 'in-progress':
        return 'brand';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'complete':
        return CheckCircleIcon;
      case 'in-progress':
        return TimeIcon;
      default:
        return TimeIcon;
    }
  };

  return (
    <PageShell
      title="Begin Your Journey"
      description="In just 3 quick steps, we'll create your Thesis Constitution and unlock your workspace."
    >
      <VStack spacing={12} align="stretch">
        {/* Intro Section */}
        <Box
          bg="linear-gradient(135deg, rgba(91, 130, 245, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)"
          borderRadius="xl"
          p={8}
          border="1px solid rgba(91, 130, 245, 0.1)"
        >
          <VStack spacing={4} align="start">
            <VStack spacing={2} align="start">
              <Heading size="md" color="gray.900">What is a Thesis Constitution?</Heading>
              <Text color="gray.600" fontSize="sm">
                Your Constitution is your project&apos;s blueprint. It includes your research scope, core
                argument, academic tone guidelines, and a flexible outline. This roadmap guides every step
                of your writing process.
              </Text>
            </VStack>

            <VStack spacing={2} align="start" pt={2}>
              <Text fontWeight="bold" color="brand.600" fontSize="sm">
                Your Constitution will contain:
              </Text>
              <Stack spacing={1} pl={4} fontSize="sm" color="gray.700">
                <Text>✓ Research scope and boundaries</Text>
                <Text>✓ Your core argument / hypothesis</Text>
                <Text>✓ Academic tone and style guidelines</Text>
                <Text>✓ Chapter-by-chapter outline</Text>
              </Stack>
            </VStack>
          </VStack>
        </Box>

        {/* Steps Timeline */}
        <VStack spacing={4} align="stretch">
          <VStack spacing={1}>
            <Heading size="md" color="gray.900">Complete These 3 Steps</Heading>
            <Text color="gray.600" fontSize="sm">
              The whole process takes about 10-15 minutes
            </Text>
          </VStack>

          <Stack spacing={4}>
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const statusColor = getStatusColor(step.status);
              const StatusIcon = getStatusIcon(step.status);

              return (
                <VStack key={step.number} align="stretch" spacing={0}>
                  <Flex
                    bg="white"
                    border="2px solid"
                    borderColor={step.status === 'complete' ? 'brand.400' : 'surface.border'}
                    borderRadius="lg"
                    p={6}
                    transition="all 0.2s"
                    cursor="pointer"
                    _hover={{
                      borderColor: 'brand.400',
                      bg: 'surface.cardHover'
                    }}
                    onClick={() => {
                      if (step.status !== 'complete' && idx === 0) {
                        navigate('/onboarding/start');
                      } else if (step.status !== 'complete' && idx === 1) {
                        navigate('/onboarding/sources');
                      }
                    }}
                  >
                    <Flex
                      align="center"
                      justify="center"
                      w={14}
                      h={14}
                      minW={14}
                      borderRadius="lg"
                      bgGradient={`linear(to-br, ${statusColor}.500, ${statusColor}.600)`}
                      mr={6}
                    >
                      <Icon as={StatusIcon} color="white" w={6} h={6} />
                    </Flex>

                    <VStack align="start" spacing={1} flex={1}>
                      <Flex align="center" gap={2}>
                        <Heading size="sm" color="gray.900">Step {step.number}: {step.title}</Heading>
                        <Badge
                          colorScheme={getStatusColor(step.status)}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {step.status === 'complete' ? 'Done' : step.duration}
                        </Badge>
                      </Flex>
                      <Text color="gray.600" fontSize="sm">
                        {step.description}
                      </Text>
                    </VStack>

                    {step.status !== 'complete' && (
                      <Icon
                        as={CheckCircleIcon}
                        color="brand.400"
                        w={5}
                        h={5}
                        ml={4}
                        opacity={0}
                      />
                    )}
                  </Flex>

                  {!isLast && (
                    <Box
                      w="2px"
                      h={4}
                      bg="surface.border"
                      mx="auto"
                      borderRadius="full"
                    />
                  )}
                </VStack>
              );
            })}
          </Stack>
        </VStack>

        {/* CTA Buttons */}
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={4}>
          <Button
            colorScheme="brand"
            size="lg"
            onClick={() => navigate('/onboarding/start')}
            boxShadow="0 10px 20px rgba(91, 130, 245, 0.3)"
          >
            Start questionnaire
          </Button>
          <Button
            variant="outline"
            colorScheme="brand"
            size="lg"
            onClick={() => navigate('/workspace')}
          >
            Skip and explore workspace
          </Button>
        </Stack>

        {/* Footer Note */}
        <Text fontSize="sm" color="gray.600" pt={4}>
          💡 Tip: You can update your project details and Constitution anytime from your workspace.
        </Text>
      </VStack>
    </PageShell>
  );
}

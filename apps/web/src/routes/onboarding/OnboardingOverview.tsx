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
          bg="rgba(96, 122, 148, 0.05)"
          borderRadius="lg"
          p={8}
          border="1px solid"
          borderColor="academic.borderLight"
        >
          <VStack spacing={4} align="start">
            <VStack spacing={2} align="start">
              <Heading size="md" fontFamily="heading" color="academic.primaryText">What is a Thesis Constitution?</Heading>
              <Text color="academic.secondaryText" fontSize="sm">
                Your Constitution is your project&apos;s blueprint. It includes your research scope, core
                argument, academic tone guidelines, and a flexible outline. This roadmap guides every step
                of your writing process.
              </Text>
            </VStack>

            <VStack spacing={2} align="start" pt={2}>
              <Text fontWeight="semibold" color="academic.primaryText" fontSize="sm">
                Your Constitution will contain:
              </Text>
              <Stack spacing={1} pl={4} fontSize="sm" color="academic.secondaryText">
                <Flex align="center" gap={2}>
                  <Icon as={CheckCircleIcon} color="academic.accent" boxSize="14px" />
                  <Text>Research scope and boundaries</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={CheckCircleIcon} color="academic.accent" boxSize="14px" />
                  <Text>Your core argument / hypothesis</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={CheckCircleIcon} color="academic.accent" boxSize="14px" />
                  <Text>Academic tone and style guidelines</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={CheckCircleIcon} color="academic.accent" boxSize="14px" />
                  <Text>Chapter-by-chapter outline</Text>
                </Flex>
              </Stack>
            </VStack>
          </VStack>
        </Box>

        {/* Steps Timeline */}
        <VStack spacing={4} align="stretch">
          <VStack spacing={1}>
            <Heading size="md" fontFamily="heading" color="academic.primaryText">Complete These 3 Steps</Heading>
            <Text color="academic.secondaryText" fontSize="sm">
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
                    bg="academic.paper"
                    border="1px solid"
                    borderColor={step.status === 'complete' ? 'academic.accent' : 'academic.border'}
                    borderRadius="lg"
                    p={6}
                    transition="all 0.2s"
                    cursor="pointer"
                    _hover={{
                      borderColor: 'academic.accent',
                      boxShadow: 'soft'
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
                      bg={step.status === 'complete' ? 'academic.accent' : 'academic.borderLight'}
                      mr={6}
                    >
                      <Icon as={StatusIcon} color={step.status === 'complete' ? 'white' : 'academic.secondaryText'} w={6} h={6} />
                    </Flex>

                    <VStack align="start" spacing={1} flex={1}>
                      <Flex align="center" gap={2}>
                        <Heading size="sm" fontFamily="heading" color="academic.primaryText">Step {step.number}: {step.title}</Heading>
                        <Badge
                          colorScheme={getStatusColor(step.status)}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {step.status === 'complete' ? 'Done' : step.duration}
                        </Badge>
                      </Flex>
                      <Text color="academic.secondaryText" fontSize="sm">
                        {step.description}
                      </Text>
                    </VStack>

                    {step.status !== 'complete' && (
                      <Icon
                        as={CheckCircleIcon}
                        color="academic.accent"
                        w={5}
                        h={5}
                        ml={4}
                        opacity={0}
                      />
                    )}
                  </Flex>

                  {!isLast && (
                    <Box
                      w="1px"
                      h={4}
                      bg="academic.borderLight"
                      mx="auto"
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
          >
            Start questionnaire
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/workspace')}
          >
            Skip and explore workspace
          </Button>
        </Stack>

        {/* Footer Note */}
        <Text fontSize="sm" color="academic.secondaryText" pt={4} fontStyle="italic">
          Tip: You can update your project details and Constitution anytime from your workspace.
        </Text>
      </VStack>
    </PageShell>
  );
}

/**
 * Professional Onboarding Layout
 *
 * Compact, minimal onboarding flow with professional aesthetic.
 * Inspired by Linear/Notion/GitHub setup flows.
 */

import { Box, Flex, Container, HStack, Text, Progress } from '@chakra-ui/react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { ONBOARDING_STEPS, getOnboardingStepIndex } from './steps';
import { Check } from 'lucide-react';

export function ProfessionalOnboardingLayout() {
  return (
    <OnboardingProvider>
      <ProfessionalOnboardingScaffold />
    </OnboardingProvider>
  );
}

function ProfessionalOnboardingScaffold() {
  const { navigationHandlers } = useOnboarding();
  const location = useLocation();
  const navigate = useNavigate();

  const currentStepIndex = getOnboardingStepIndex(location.pathname);
  const totalSteps = ONBOARDING_STEPS.length;
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const isFormElement =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.getAttribute('contenteditable') === 'true';
        if (isFormElement) {
          return;
        }
      }

      event.preventDefault();

      const goToIndex = getOnboardingStepIndex(location.pathname);
      const previousStep = ONBOARDING_STEPS[goToIndex - 1];
      const nextStep = ONBOARDING_STEPS[goToIndex + 1];

      const runHandler = async (handler?: () => Promise<boolean | void> | boolean | void) => {
        if (!handler) {
          return true;
        }
        const result = await handler();
        return result !== false;
      };

      if (event.key === 'ArrowLeft' && previousStep) {
        void (async () => {
          const shouldNavigate = await runHandler(navigationHandlers.onPrevious);
          if (shouldNavigate && previousStep) {
            navigate(previousStep.path);
          }
        })();
      }

      if (event.key === 'ArrowRight' && nextStep) {
        void (async () => {
          const shouldNavigate = await runHandler(navigationHandlers.onNext);
          if (shouldNavigate && nextStep) {
            navigate(nextStep.path);
          }
        })();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [location.pathname, navigate, navigationHandlers]);

  return (
    <Box minH="100vh" bg="#FAFAFA">
      {/* Compact Top Bar */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="#E2E8F0"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="900px" py={4}>
          <Flex justify="space-between" align="center" mb={3}>
            {/* Logo */}
            <HStack spacing={2}>
              <Box w="20px" h="20px" bg="#0F172A" borderRadius="sm" />
              <Text fontSize="sm" fontWeight="600" color="#0F172A">
                Thesis Copilot
              </Text>
            </HStack>

            {/* Step Counter */}
            <Text fontSize="xs" color="#64748B" fontWeight="500">
              Step {currentStepIndex + 1} of {totalSteps}
            </Text>
          </Flex>

          {/* Minimal Progress Bar */}
          <Progress
            value={progressPercentage}
            size="xs"
            bg="#F1F5F9"
            borderRadius="full"
            sx={{
              '& > div': {
                backgroundColor: '#0F172A',
                transition: 'width 0.3s ease',
              },
            }}
          />
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="900px" py={8}>
        <Outlet />
      </Container>

      {/* Optional: Step Names for context */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px solid"
        borderColor="#E2E8F0"
        py={3}
        display={{ base: 'none', md: 'block' }}
      >
        <Container maxW="900px">
          <HStack spacing={4} fontSize="xs" color="#94A3B8" justify="center">
            {ONBOARDING_STEPS.map((step, idx) => (
              <HStack key={idx} spacing={1.5}>
                <Flex
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  bg={
                    idx < currentStepIndex
                      ? '#0F172A'
                      : idx === currentStepIndex
                      ? '#64748B'
                      : '#E2E8F0'
                  }
                  align="center"
                  justify="center"
                  transition="background 0.2s"
                >
                  {idx < currentStepIndex && <Check size={10} color="white" />}
                  {idx === currentStepIndex && (
                    <Box w="6px" h="6px" bg="white" borderRadius="full" />
                  )}
                </Flex>
                <Text
                  fontWeight={idx === currentStepIndex ? '600' : '400'}
                  color={idx === currentStepIndex ? '#0F172A' : '#94A3B8'}
                >
                  {step.label}
                </Text>
              </HStack>
            ))}
          </HStack>
        </Container>
      </Box>
    </Box>
  );
}

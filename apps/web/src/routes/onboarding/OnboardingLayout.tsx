import { Box, Stack } from '@chakra-ui/react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { OnboardingProgress } from './OnboardingProgress';
import { ONBOARDING_STEPS, getOnboardingStepIndex } from './steps';

export function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingScaffold />
    </OnboardingProvider>
  );
}

function OnboardingScaffold() {
  const { navigationHandlers } = useOnboarding();
  const location = useLocation();
  const navigate = useNavigate();

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
    <Stack spacing={0} minH="100vh" bg="academic.background">
      <OnboardingProgress />
      <Box flex="1" px={{ base: 4, md: 8 }} pb={12}>
        <Outlet />
      </Box>
    </Stack>
  );
}

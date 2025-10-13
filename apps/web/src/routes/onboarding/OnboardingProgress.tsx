import { Box, Flex, HStack, Progress, Stack, Text } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { ONBOARDING_STEPS, getOnboardingStepIndex } from './steps';

export function OnboardingProgress() {
  const location = useLocation();
  const activeIndex = getOnboardingStepIndex(location.pathname);
  const total = ONBOARDING_STEPS.length;
  const progressValue = total > 1 ? (activeIndex / (total - 1)) * 100 : 100;

  return (
    <Stack spacing={3} px={{ base: 4, md: 8 }} pt={6} pb={4} color="blue.50">
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <Text fontSize="sm" color="blue.200" textTransform="uppercase" letterSpacing="0.12em">
          Onboarding progress
        </Text>
        <Text fontSize="sm" color="blue.100">
          Step {activeIndex + 1} of {total}
        </Text>
      </Flex>
      <Stack spacing={3}>
        <HStack justify="space-between" align="flex-start" spacing={{ base: 4, md: 8 }}>
          {ONBOARDING_STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;
            const circleBg = isActive
              ? 'rgba(63,131,248,0.9)'
              : isCompleted
                ? 'rgba(34,197,94,0.8)'
                : 'rgba(148,163,230,0.2)';
            const circleBorder = isActive
              ? '1px solid rgba(191,219,254,0.9)'
              : '1px solid rgba(148,163,230,0.4)';

            return (
              <Stack key={step.path} spacing={2} align="center" flex="1">
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="sm"
                  fontWeight="semibold"
                  bg={circleBg}
                  border={circleBorder}
                  color={isActive || isCompleted ? 'blue.900' : 'blue.50'}
                >
                  {index + 1}
                </Box>
                <Text
                  fontSize="xs"
                  textAlign="center"
                  fontWeight={isActive ? 'semibold' : 'normal'}
                  color={isActive ? 'blue.100' : 'blue.200'}
                  maxW="120px"
                >
                  {step.label}
                </Text>
              </Stack>
            );
          })}
        </HStack>
        <Progress
          value={progressValue}
          size="sm"
          borderRadius="full"
          bg="rgba(30,41,59,0.9)"
          colorScheme="blue"
          sx={{
            '& > div': {
              background: 'linear-gradient(90deg, rgba(37,99,235,0.9), rgba(14,165,233,0.9))'
            }
          }}
        />
      </Stack>
    </Stack>
  );
}

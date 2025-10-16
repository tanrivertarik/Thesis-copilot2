import { Box, Flex, HStack, Stack, Text, Icon } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useLocation } from 'react-router-dom';
import { ONBOARDING_STEPS, getOnboardingStepIndex } from './steps';

export function OnboardingProgress() {
  const location = useLocation();
  const activeIndex = getOnboardingStepIndex(location.pathname);
  const total = ONBOARDING_STEPS.length;

  return (
    <Stack spacing={6} px={{ base: 4, md: 8 }} pt={8} pb={6} bg="academic.background">
      {/* Step Counter */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <Text fontSize="sm" color="academic.secondaryText" textTransform="uppercase" letterSpacing="0.08em">
          Onboarding
        </Text>
        <Text fontSize="sm" color="academic.secondaryText" fontWeight="medium">
          Step {activeIndex + 1} of {total}
        </Text>
      </Flex>

      {/* Progress Steps */}
      <Box position="relative">
        <HStack justify="space-between" align="flex-start" spacing={{ base: 4, md: 8 }} position="relative">
          {/* Connecting Line */}
          <Box
            position="absolute"
            top="16px"
            left="16px"
            right="16px"
            height="1px"
            bg="academic.borderLight"
            zIndex={0}
          >
            {/* Active portion of line */}
            <Box
              position="absolute"
              left={0}
              top={0}
              height="100%"
              width={`${(activeIndex / (total - 1)) * 100}%`}
              bg="academic.accent"
              transition="width 0.3s ease"
            />
          </Box>

          {ONBOARDING_STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;
            const isFuture = index > activeIndex;

            return (
              <Stack key={step.path} spacing={3} align="center" flex="1" position="relative" zIndex={1}>
                {/* Circle */}
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="sm"
                  fontWeight="semibold"
                  bg={isCompleted ? 'academic.accent' : isActive ? 'academic.paper' : 'transparent'}
                  border={isActive ? '1px solid' : isFuture ? '1px solid' : 'none'}
                  borderColor={isActive ? 'academic.accent' : 'academic.border'}
                  color={isCompleted ? 'white' : isActive ? 'academic.accent' : 'academic.secondaryText'}
                  transition="all 0.2s ease"
                >
                  {isCompleted ? <Icon as={CheckIcon} w="14px" h="14px" /> : index + 1}
                </Box>

                {/* Label */}
                <Text
                  fontSize="xs"
                  textAlign="center"
                  fontWeight={isActive ? 'semibold' : 'normal'}
                  color={isActive ? 'academic.primaryText' : 'academic.secondaryText'}
                  maxW="120px"
                  fontFamily="body"
                >
                  {step.label}
                </Text>
              </Stack>
            );
          })}
        </HStack>
      </Box>
    </Stack>
  );
}

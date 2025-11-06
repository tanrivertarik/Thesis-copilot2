/**
 * Professional Step Shell
 *
 * Compact, minimal wrapper for onboarding step content.
 * Provides consistent layout, navigation buttons, and styling.
 */

import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  HStack,
} from '@chakra-ui/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { ReactNode } from 'react';

interface ProfessionalStepShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  error?: string | null;
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  isLoading?: boolean;
  isNextDisabled?: boolean;
  hidePrevious?: boolean;
  hideNext?: boolean;
}

export function ProfessionalStepShell({
  title,
  description,
  children,
  error,
  onPrevious,
  onNext,
  previousLabel = 'Back',
  nextLabel = 'Continue',
  isLoading = false,
  isNextDisabled = false,
  hidePrevious = false,
  hideNext = false,
}: ProfessionalStepShellProps) {
  return (
    <Box>
      {/* Header */}
      <VStack align="start" spacing={2} mb={6}>
        <Heading
          fontSize="2xl"
          fontWeight="600"
          color="#0F172A"
          letterSpacing="-0.02em"
        >
          {title}
        </Heading>
        {description && (
          <Text fontSize="sm" color="#64748B" lineHeight="tall">
            {description}
          </Text>
        )}
      </VStack>

      {/* Error Alert */}
      {error && (
        <Alert
          status="error"
          borderRadius="md"
          bg="rgba(239, 68, 68, 0.06)"
          border="1px solid"
          borderColor="rgba(239, 68, 68, 0.2)"
          mb={6}
          py={3}
        >
          <AlertIcon color="red.500" boxSize="16px" />
          <AlertDescription fontSize="sm" color="#991B1B">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Content Card */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="#E2E8F0"
        borderRadius="lg"
        p={6}
        mb={6}
      >
        {children}
      </Box>

      {/* Navigation Buttons */}
      <Flex justify="space-between" align="center">
        {!hidePrevious ? (
          <Button
            leftIcon={<ArrowLeft size={16} />}
            onClick={onPrevious}
            size="sm"
            variant="ghost"
            color="#64748B"
            _hover={{ bg: '#F1F5F9', color: '#0F172A' }}
            isDisabled={isLoading}
          >
            {previousLabel}
          </Button>
        ) : (
          <Box />
        )}

        {!hideNext && (
          <Button
            rightIcon={<ArrowRight size={16} />}
            onClick={onNext}
            size="sm"
            bg="#0F172A"
            color="white"
            _hover={{ bg: '#1E293B' }}
            isLoading={isLoading}
            isDisabled={isNextDisabled}
            px={4}
          >
            {nextLabel}
          </Button>
        )}
      </Flex>

      {/* Keyboard Hint */}
      <Box mt={4} textAlign="center">
        <Text fontSize="xs" color="#94A3B8">
          Tip: Use <kbd style={{ fontWeight: 600 }}>Alt + ←</kbd> and{' '}
          <kbd style={{ fontWeight: 600 }}>Alt + →</kbd> to navigate
        </Text>
      </Box>
    </Box>
  );
}

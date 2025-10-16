import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';

export function ResearchInputsStep() {
  const navigate = useNavigate();
  const {
    ingestFromText,
    ingesting,
    ingestError,
    ingestionResult,
    project,
    researchDraft,
    updateResearchDraft
  } = useOnboarding();
  const [localError, setLocalError] = useState<string | null>(null);

  const attemptIngestion = useCallback(async () => {
    if (!project) {
      setLocalError('Save your project details before adding sources.');
      return false;
    }
    if (!researchDraft.text.trim()) {
      setLocalError('Add some text or notes before continuing.');
      return false;
    }
    setLocalError(null);
    try {
      await ingestFromText({ title: researchDraft.title, text: researchDraft.text });
      return true;
    } catch (error) {
      setLocalError((error as Error).message);
      return false;
    }
  }, [ingestFromText, project, researchDraft]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await attemptIngestion();
    if (ok) {
      navigate('/onboarding/summary');
    }
  };

  const handlePrevious = useCallback(() => {
    navigate('/onboarding/start');
    return false;
  }, [navigate]);

  const handleNext = useCallback(async () => {
    if (researchDraft.text.trim()) {
      const ok = await attemptIngestion();
      if (ok) {
        navigate('/onboarding/summary');
      }
    } else {
      navigate('/onboarding/summary');
    }
    return false;
  }, [attemptIngestion, navigate, researchDraft.text]);

  const navigationHandlers = useMemo(
    () => ({
      onPrevious: handlePrevious,
      onNext: handleNext
    }),
    [handleNext, handlePrevious]
  );

  useOnboardingStepNavigation(navigationHandlers);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageShell
        title="Step 2: Research Inputs"
        description="Feed your Copilot with initial research to ground your Thesis Constitution."
      >
        <VStack spacing={10} align="stretch">
          {/* Info Alerts */}
          {!project ? (
            <Alert
              status="info"
              borderRadius="lg"
              bg="rgba(59,130,246,0.12)"
              border="1px solid rgba(59, 130, 246, 0.3)"
              color="blue.100"
            >
              <AlertIcon />
              <AlertDescription>
                Save your project details first, then add supporting sources or notes.
              </AlertDescription>
            </Alert>
          ) : null}

          {localError || ingestError ? (
            <Alert
              status="error"
              borderRadius="lg"
              bg="rgba(220,38,38,0.12)"
              border="1px solid rgba(239, 68, 68, 0.3)"
              color="red.200"
            >
              <AlertIcon />
              <AlertDescription>{localError ?? ingestError}</AlertDescription>
            </Alert>
          ) : null}

          {ingestionResult ? (
            <Alert
              status="success"
              borderRadius="lg"
              bg="rgba(34,197,94,0.12)"
              border="1px solid rgba(34, 197, 94, 0.3)"
              color="green.200"
            >
              <AlertIcon />
              <AlertDescription>
                ✓ Source ingested! {ingestionResult.summary?.abstract ? 'Abstract captured. ' : ''}
                {ingestionResult.chunkCount ? `${ingestionResult.chunkCount} chunks created.` : ''}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Helper Box */}
          <Box
            bg="linear-gradient(135deg, rgba(91, 130, 245, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
            borderRadius="lg"
            p={4}
            border="1px solid rgba(95, 130, 245, 0.2)"
          >
            <VStack align="start" spacing={3}>
              <Text fontWeight="semibold" color="brand.200" fontSize="sm">
                📌 Why add initial sources?
              </Text>
              <VStack align="start" spacing={2} fontSize="sm" color="blue.200">
                <Text>✓ Grounds your Constitution in actual research</Text>
                <Text>✓ Helps Copilot generate more relevant outlines</Text>
                <Text>✓ You can add more sources anytime in your workspace</Text>
              </VStack>
            </VStack>
          </Box>

          {/* Form Fields */}
          <VStack spacing={6} align="stretch">
            {/* Source Title */}
            <FormControl>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <FormLabel color="blue.50" fontWeight="semibold" fontSize="md">
                    📄 Source Title
                  </FormLabel>
                  <Text color="blue.300" fontSize="sm">
                    Give this research snippet a brief, memorable title
                  </Text>
                </Stack>
                <Input
                  placeholder="E.g., Smith et al. (2023) - Social Media Effects"
                  bg="surface.card"
                  borderColor="surface.border"
                  color="blue.50"
                  _placeholder={{ color: 'blue.600' }}
                  size="lg"
                  value={researchDraft.title}
                  onChange={(event) => updateResearchDraft({ title: event.target.value })}
                  isDisabled={!project}
                />
              </Stack>
            </FormControl>

            {/* Source Text / Notes */}
            <FormControl>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <FormLabel color="blue.50" fontWeight="semibold" fontSize="md">
                    ✍️ Source Text or Notes
                  </FormLabel>
                  <Text color="blue.300" fontSize="sm">
                    Paste a key paragraph, research abstract, or your notes. Even one good source helps!
                  </Text>
                </Stack>
                <Box
                  borderRadius="lg"
                  border="2px dashed"
                  borderColor={researchDraft.text.trim() ? 'brand.400' : 'surface.border'}
                  bg="surface.card"
                  p={4}
                  transition="all 0.2s"
                  _hover={{
                    borderColor: 'brand.400'
                  }}
                >
                  <Textarea
                    rows={8}
                    placeholder="Paste a research abstract, key findings, or your own notes..."
                    bg="transparent"
                    border="none"
                    color="blue.50"
                    _placeholder={{ color: 'blue.600' }}
                    _focus={{ outline: 'none' }}
                    resize="none"
                    value={researchDraft.text}
                    onChange={(event) => updateResearchDraft({ text: event.target.value })}
                    isDisabled={!project}
                  />
                </Box>
                <Text fontSize="sm" color="brand.300">
                  💡 Tip: Quality over quantity. One strong source is better than generic text.
                </Text>
              </Stack>
            </FormControl>
          </VStack>

          {/* Action Info */}
          <Box
            bg="rgba(91, 130, 245, 0.05)"
            borderRadius="lg"
            p={4}
            border="1px solid surface.borderLight"
          >
            <SimpleGrid columns={2} spacing={3} fontSize="sm">
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold" color="brand.300">
                  What happens next
                </Text>
              </VStack>
              <VStack align="start" spacing={1} fontSize="xs" color="blue.200">
                <Text>→ We extract and analyze your source</Text>
                <Text>→ Create searchable chunks</Text>
                <Text>→ Generate a summary</Text>
              </VStack>
            </SimpleGrid>
          </Box>

          {/* Form Actions */}
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={4}>
            {researchDraft.text.trim() && (
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={ingesting}
                isDisabled={!project || ingesting}
                size="lg"
                boxShadow="0 10px 20px rgba(91, 130, 245, 0.3)"
              >
                Add source & continue
              </Button>
            )}
            <Button
              variant="outline"
              colorScheme="brand"
              onClick={() => navigate('/onboarding/summary')}
              isDisabled={ingesting}
              size="lg"
            >
              {researchDraft.text.trim() ? 'Skip & continue' : 'Continue without sources'}
            </Button>
            <Button
              variant="ghost"
              colorScheme="brand"
              onClick={() => navigate('/onboarding/start')}
              isDisabled={ingesting}
            >
              Back
            </Button>
          </Stack>
        </VStack>
      </PageShell>
    </form>
  );
}

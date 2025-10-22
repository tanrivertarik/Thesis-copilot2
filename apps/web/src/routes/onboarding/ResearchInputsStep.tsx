import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  SimpleGrid,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Textarea,
  VStack
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';
import { FileUploadBox } from '../workspace/sources/FileUploadBox';
import type { SourceIngestionResult } from '@thesis-copilot/shared';

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
  const [fileUploadResult, setFileUploadResult] = useState<SourceIngestionResult | null>(null);

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
              bg="rgba(96, 122, 148, 0.08)"
              border="1px solid rgba(96, 122, 148, 0.2)"
            >
              <AlertIcon color="academic.accent" />
              <AlertDescription color="academic.primaryText">
                Save your project details first, then add supporting sources or notes.
              </AlertDescription>
            </Alert>
          ) : null}

          {localError || ingestError ? (
            <Alert
              status="error"
              borderRadius="lg"
              bg="rgba(239, 68, 68, 0.08)"
              border="1px solid rgba(239, 68, 68, 0.2)"
            >
              <AlertIcon color="red.500" />
              <AlertDescription color="academic.primaryText">{localError ?? ingestError}</AlertDescription>
            </Alert>
          ) : null}

          {ingestionResult ? (
            <Alert
              status="success"
              borderRadius="lg"
              bg="rgba(16, 185, 129, 0.08)"
              border="1px solid rgba(16, 185, 129, 0.2)"
            >
              <AlertIcon color="green.500" />
              <AlertDescription color="academic.primaryText">
                ✓ Source ingested! {ingestionResult.summary?.abstract ? 'Abstract captured. ' : ''}
                {ingestionResult.chunkCount ? `${ingestionResult.chunkCount} chunks created.` : ''}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Helper List - No Background Container */}
          <VStack align="start" spacing={3}>
            <VStack align="start" spacing={2} fontSize="sm" color="academic.secondaryText">
              <Flex align="center" gap={2}>
                <Icon as={CheckIcon} color="academic.accent" boxSize="14px" />
                <Text>Grounds your Constitution in actual research</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Icon as={CheckIcon} color="academic.accent" boxSize="14px" />
                <Text>Helps Copilot generate more relevant outlines</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Icon as={CheckIcon} color="academic.accent" boxSize="14px" />
                <Text>You can add more sources anytime in your workspace</Text>
              </Flex>
            </VStack>
          </VStack>

          {/* Form Fields - Tabbed Interface */}
          <Box
            borderWidth={1}
            borderColor="academic.border"
            borderRadius="lg"
            p={6}
            bg="academic.cardBg"
          >
            <Tabs colorScheme="brand" variant="enclosed">
              <TabList>
                <Tab>Upload PDF</Tab>
                <Tab>Paste Text</Tab>
              </TabList>

              <TabPanels>
                {/* PDF Upload Tab */}
                <TabPanel px={0} py={6}>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="sm" mb={2} color="academic.primaryText">
                        Upload Research PDF
                      </Heading>
                      <Text fontSize="sm" color="academic.secondaryText">
                        Upload a PDF file of your research paper, thesis chapter, or academic source.
                        We'll automatically extract text, generate summaries, and create searchable embeddings.
                      </Text>
                    </Box>

                    {project && (
                      <FileUploadBox
                        projectId={project.id}
                        onUploadComplete={(result) => {
                          setFileUploadResult(result);
                          setLocalError(null);
                        }}
                        disabled={!project}
                      />
                    )}

                    {fileUploadResult && (
                      <Alert status="success" borderRadius="lg">
                        <AlertIcon />
                        <AlertDescription>
                          PDF uploaded successfully! {fileUploadResult.chunkCount} chunks created.
                        </AlertDescription>
                      </Alert>
                    )}
                  </VStack>
                </TabPanel>

                {/* Text Paste Tab */}
                <TabPanel px={0} py={6}>
                  <VStack spacing={6} align="stretch">
                    {/* Source Title */}
                    <FormControl>
                      <Stack spacing={2}>
                        <FormLabel color="academic.primaryText" fontWeight="medium" fontSize="md">
                          Source Title
                        </FormLabel>
                        <Input
                          placeholder="E.g., Smith et al. (2023) - Social Media Effects"
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
                        <FormLabel color="academic.primaryText" fontWeight="medium" fontSize="md">
                          Source Text or Notes
                        </FormLabel>
                        <Text color="academic.secondaryText" fontSize="sm" mb={2}>
                          Paste a key paragraph, research abstract, or your notes. Even one good source helps!
                        </Text>
                        <Textarea
                          rows={8}
                          placeholder="Paste a research abstract, key findings, or your own notes..."
                          resize="vertical"
                          value={researchDraft.text}
                          onChange={(event) => updateResearchDraft({ text: event.target.value })}
                          isDisabled={!project}
                        />
                        <Text fontSize="sm" color="academic.secondaryText" fontStyle="italic">
                          Tip: Quality over quantity. One strong source is better than generic text.
                        </Text>
                      </Stack>
                    </FormControl>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
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
              >
                Add text source & continue
              </Button>
            )}
            <Button
              colorScheme="brand"
              variant={fileUploadResult || ingestionResult ? 'solid' : 'outline'}
              onClick={() => navigate('/onboarding/summary')}
              isDisabled={ingesting}
              size="lg"
            >
              {fileUploadResult || ingestionResult || researchDraft.text.trim()
                ? 'Continue to summary'
                : 'Continue without sources'}
            </Button>
            <Button
              variant="ghost"
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

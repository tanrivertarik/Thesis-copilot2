import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
  VStack,
  HStack
} from '@chakra-ui/react';
import { CheckIcon, InfoIcon } from '@chakra-ui/icons';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';
import { generateProjectConstitution, fetchConstitutionSuggestions } from '../../lib/api';
import type { AcademicLevel } from '../../lib/api';

export function SummaryStep() {
  const navigate = useNavigate();
  const toast = useToast();
  const { project, ingestionResult, resetIngestion, reloadProject } = useOnboarding();
  const [generating, setGenerating] = useState(false);

  const handlePrevious = useCallback(() => {
    navigate('/onboarding/sources');
    return false;
  }, [navigate]);

  const handleNext = useCallback(() => {
    void (async () => {
      if (!project) {
        navigate('/workspace');
        return;
      }

      const isAcademicLevel = (value: string): value is AcademicLevel =>
        value === 'UNDERGRADUATE' || value === 'MASTERS' || value === 'PHD';

      setGenerating(true);
      try {
        let academicLevel: AcademicLevel = 'MASTERS';
        let discipline = 'General Research';
        let includeExistingSources = Boolean(ingestionResult);

        try {
          const suggestions = await fetchConstitutionSuggestions(project.id);
          if (isAcademicLevel(suggestions.suggestedAcademicLevel)) {
            academicLevel = suggestions.suggestedAcademicLevel;
          }
          if (suggestions.suggestedDiscipline.trim().length > 0) {
            discipline = suggestions.suggestedDiscipline;
          }
          includeExistingSources = suggestions.sourcesAvailable > 0;
        } catch (suggestionError) {
          console.warn('[onboarding] Failed to fetch constitution suggestions', suggestionError);
        }

        await generateProjectConstitution(project.id, {
          academicLevel,
          discipline,
          includeExistingSources
        });
        await reloadProject();

        toast({
          status: 'success',
          title: 'Thesis constitution generated',
          description: 'Your workspace is ready to manage sections.'
        });
        navigate('/workspace');
      } catch (error) {
        toast({
          status: 'error',
          title: 'Unable to generate constitution',
          description: (error as Error).message
        });
      } finally {
        setGenerating(false);
      }
    })();
    return false;
  }, [project, navigate, toast, reloadProject, ingestionResult]);

  const navigationHandlers = useMemo(
    () => ({
      onPrevious: handlePrevious,
      onNext: handleNext
    }),
    [handleNext, handlePrevious]
  );

  return (
    <PageShell title="Step 3: Review & Generate" description="Confirm your inputs before generating your Constitution.">
      <VStack spacing={10} align="stretch">
        <Box bg="academic.paper" border="1px solid" borderColor="academic.borderLight" borderRadius="lg" p={6}>
          <VStack align="start" spacing={4}>
            <HStack spacing={2}>
              <Icon as={CheckIcon} color="academic.accent" w={5} h={5} />
              <Heading size="md" fontFamily="heading" color="academic.primaryText">Your Project</Heading>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2 }} w="full" spacing={4}>
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold" color="academic.secondaryText" fontSize="sm">Thesis Title</Text>
                <Text color="academic.primaryText" fontSize="md">{project?.title || '—'}</Text>
              </VStack>
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold" color="academic.secondaryText" fontSize="sm">Citation Style</Text>
                <Text color="academic.primaryText" fontSize="md">{project?.citationStyle || '—'}</Text>
              </VStack>
            </SimpleGrid>
            <VStack align="start" w="full" spacing={1}>
              <Text fontWeight="semibold" color="academic.secondaryText" fontSize="sm">Topic Description</Text>
              <Text color="academic.primaryText" fontSize="sm">{project?.topic || 'No description provided'}</Text>
            </VStack>
            {project?.researchQuestions?.length ? (
              <VStack align="start" w="full" spacing={2}>
                <Text fontWeight="semibold" color="academic.secondaryText" fontSize="sm">Research Questions</Text>
                <VStack align="start" spacing={1} w="full" pl={3} borderLeft="2px" borderColor="academic.accent">
                  {project.researchQuestions.map((question, idx) => (
                    <Text key={idx} color="academic.primaryText" fontSize="sm">{idx + 1}. {question}</Text>
                  ))}
                </VStack>
              </VStack>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => navigate('/onboarding/start')} isDisabled={generating} alignSelf="flex-start">Edit project details</Button>
          </VStack>
        </Box>

        <Box bg="academic.paper" border="1px solid" borderColor={ingestionResult ? 'academic.accent' : 'academic.borderLight'} borderRadius="lg" p={6}>
          <VStack align="start" spacing={4}>
            <HStack spacing={2}>
              <Icon as={ingestionResult ? CheckIcon : InfoIcon} color={ingestionResult ? 'academic.accent' : 'academic.secondaryText'} w={5} h={5} />
              <Heading size="md" fontFamily="heading" color="academic.primaryText">Research Sources</Heading>
            </HStack>
            {ingestionResult ? (
              <VStack align="start" w="full" spacing={3}>
                <Alert status="success" borderRadius="lg" bg="rgba(16, 185, 129, 0.08)" border="1px solid rgba(16, 185, 129, 0.2)">
                  <AlertIcon color="green.500" />
                  <Stack spacing={0}>
                    <AlertDescription fontWeight="semibold" color="academic.primaryText">✓ Source ingested successfully</AlertDescription>
                    <Text fontSize="sm" color="academic.secondaryText">{ingestionResult.chunkCount} chunks created{ingestionResult.summary?.abstract ? ' • Abstract captured' : ''}</Text>
                  </Stack>
                </Alert>
                {ingestionResult.summary?.abstract && (
                  <Box bg="rgba(96, 122, 148, 0.05)" borderRadius="md" p={3} borderLeft="3px solid" borderLeftColor="academic.accent">
                    <Text fontSize="sm" color="academic.primaryText"><strong>Abstract:</strong> {ingestionResult.summary.abstract.substring(0, 200)}{ingestionResult.summary.abstract.length > 200 ? '…' : ''}</Text>
                  </Box>
                )}
                <Button variant="outline" size="sm" onClick={() => { resetIngestion(); navigate('/onboarding/sources'); }} isDisabled={generating}>Add another source</Button>
              </VStack>
            ) : (
              <VStack align="start" w="full" spacing={3}>
                <Alert status="info" borderRadius="lg" bg="rgba(96, 122, 148, 0.08)" border="1px solid rgba(96, 122, 148, 0.2)">
                  <AlertIcon color="academic.accent" />
                  <Stack spacing={0}>
                    <AlertDescription fontWeight="semibold" color="academic.primaryText">No sources added yet</AlertDescription>
                    <Text fontSize="sm" color="academic.secondaryText">You can proceed without sources, but adding one improves your Constitution.</Text>
                  </Stack>
                </Alert>
                <Button variant="outline" size="sm" onClick={() => navigate('/onboarding/sources')} isDisabled={generating}>Add a source now</Button>
              </VStack>
            )}
          </VStack>
        </Box>

        <Box bg="rgba(96, 122, 148, 0.05)" borderRadius="lg" p={6} border="1px solid" borderColor="academic.borderLight">
          <VStack align="start" spacing={4}>
            <Heading size="md" color="academic.primaryText" fontFamily="heading">What happens when you continue?</Heading>
            <VStack align="start" spacing={2} fontSize="sm" color="academic.secondaryText">
              <HStack><Icon as={CheckIcon} color="academic.accent" boxSize="14px" /><Text>Thesis Copilot analyzes your project details and sources</Text></HStack>
              <HStack><Icon as={CheckIcon} color="academic.accent" boxSize="14px" /><Text>Generates a custom Thesis Constitution</Text></HStack>
              <HStack><Icon as={CheckIcon} color="academic.accent" boxSize="14px" /><Text>Creates a chapter-by-chapter outline</Text></HStack>
              <HStack><Icon as={CheckIcon} color="academic.accent" boxSize="14px" /><Text>Unlocks your workspace for drafting</Text></HStack>
            </VStack>
          </VStack>
        </Box>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={4}>
          <Button colorScheme="brand" onClick={() => { void handleNext(); }} isLoading={generating} isDisabled={generating} size="lg">
            {generating ? <>
              <Spinner size="sm" mr={2} />
              Generating...
            </> : 'Create Constitution & Continue'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/onboarding/sources')} isDisabled={generating} size="lg">Back to sources</Button>
        </Stack>
      </VStack>
    </PageShell>
  );
}

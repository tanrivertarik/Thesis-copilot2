import { Button, Divider, Stack, Text, useToast } from '@chakra-ui/react';
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

  useOnboardingStepNavigation(navigationHandlers);

  return (
    <PageShell
      title="Review & generate"
      description="Confirm your inputs before we create your Thesis Constitution."
      actions={
        <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
          <Button
            colorScheme="blue"
            onClick={() => {
              void handleNext();
            }}
            isLoading={generating}
            loadingText="Generating..."
            isDisabled={generating}
          >
            Continue to workspace
          </Button>
          <Button
            variant="outline"
            colorScheme="blue"
            onClick={() => navigate('/onboarding/start')}
            isDisabled={generating}
          >
            Edit project details
          </Button>
          <Button
            variant="ghost"
            colorScheme="blue"
            onClick={() => navigate('/onboarding/sources')}
            isDisabled={generating}
          >
            Add more sources
          </Button>
        </Stack>
      }
    >
      <Stack spacing={6} color="blue.50">
        <Stack spacing={2}>
          <Text fontSize="sm" color="blue.200" textTransform="uppercase" letterSpacing="0.1em">
            Project summary
          </Text>
          <Text fontSize="lg" fontWeight="semibold" color="blue.100">
            {project?.title ?? 'No project saved yet'}
          </Text>
          <Text>{project?.topic ?? 'Enter your thesis topic to tailor downstream prompts.'}</Text>
          {project?.researchQuestions?.length ? (
            <Stack spacing={1} mt={2} fontSize="sm" color="blue.200">
              {project.researchQuestions.map((question, index) => (
                <Text key={index}>• {question}</Text>
              ))}
            </Stack>
          ) : (
            <Text fontSize="sm" color="blue.200">
              Add research questions to sharpen retrieval and drafting guidance.
            </Text>
          )}
        </Stack>

        <Divider borderColor="rgba(148, 163, 230, 0.4)" />

        <Stack spacing={2}>
          <Text fontSize="sm" color="blue.200" textTransform="uppercase" letterSpacing="0.1em">
            Source ingestion
          </Text>
          {ingestionResult ? (
            <Stack spacing={2} fontSize="sm">
              <Text color="blue.100">
                Status: {ingestionResult.status}
              </Text>
              {ingestionResult.summary?.abstract ? (
                <Text color="blue.50">{ingestionResult.summary.abstract}</Text>
              ) : null}
              {ingestionResult.chunkCount ? (
                <Text color="blue.200">
                  {ingestionResult.chunkCount} evidence chunks ready for retrieval.
                </Text>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                colorScheme="blue"
                alignSelf="flex-start"
                onClick={() => {
                  resetIngestion();
                  navigate('/onboarding/sources');
                }}
              >
                Ingest another source
              </Button>
            </Stack>
          ) : (
            <Text fontSize="sm" color="blue.200">
              Add at least one source so the Section Writer has grounded evidence to reference.
            </Text>
          )}
        </Stack>

        <Divider borderColor="rgba(148, 163, 230, 0.4)" />

        <Text fontSize="sm" color="blue.200">
          When you continue, we’ll generate your Thesis Constitution using the details and sources
          you’ve provided.
        </Text>
      </Stack>
    </PageShell>
  );
}

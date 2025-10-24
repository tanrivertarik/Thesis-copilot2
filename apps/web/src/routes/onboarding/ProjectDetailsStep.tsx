import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  VStack
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';

const citationOptions = ['APA', 'MLA', 'CHICAGO', 'IEEE', 'HARVARD'] as const;

type FieldInfo = {
  label: string;
  description: string;
  icon: string;
};

export function ProjectDetailsStep() {
  const navigate = useNavigate();
  const {
    project,
    projectError,
    projectLoading,
    savingProject,
    saveProject,
    projectDraft,
    updateProjectDraft
  } = useOnboarding();
  const [localError, setLocalError] = useState<string | null>(null);

  const isDisabled = projectLoading || savingProject;

  const ensureValid = useCallback(() => {
    if (!projectDraft.title.trim() || !projectDraft.topic.trim()) {
      setLocalError('Project title and topic are required.');
      return false;
    }
    setLocalError(null);
    return true;
  }, [projectDraft]);

  const persistProject = useCallback(async () => {
    if (!ensureValid()) {
      return false;
    }
    try {
      await saveProject(projectDraft);
      return true;
    } catch (error) {
      setLocalError((error as Error).message);
      return false;
    }
  }, [ensureValid, projectDraft, saveProject]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await persistProject();
    if (ok) {
      navigate('/onboarding/research');
    }
  };

  const handlePrevious = useCallback(() => {
    navigate('/onboarding');
    return false;
  }, [navigate]);

  const handleNext = useCallback(async () => {
    const ok = await persistProject();
    if (ok) {
      navigate('/onboarding/research');
    }
    return false;
  }, [navigate, persistProject]);

  const navigationHandlers = useMemo(
    () => ({
      onPrevious: handlePrevious,
      onNext: handleNext
    }),
    [handleNext, handlePrevious]
  );

  useOnboardingStepNavigation(navigationHandlers);

  const helperText = useMemo(() => {
    if (project) {
      return 'Update your project details anytime. Changes are saved to Firestore.';
    }
    return 'Fill these basics once—your Thesis Constitution and workspace will reuse them.';
  }, [project]);

  const alertMessage = localError ?? projectError;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageShell
        title="Step 1: Project Basics"
        description="Establish the foundation for your Thesis Constitution in just a few minutes."
      >
        <VStack spacing={10} align="stretch">
          {alertMessage ? (
            <Alert
              status="error"
              borderRadius="lg"
              bg="rgba(239, 68, 68, 0.08)"
              border="1px solid rgba(239, 68, 68, 0.2)"
            >
              <AlertIcon color="red.500" />
              <AlertDescription color="academic.primaryText">{alertMessage}</AlertDescription>
            </Alert>
          ) : null}

          {/* Helper Text */}
          <Text color="academic.secondaryText" fontSize="sm">
            Your Constitution will use this information to generate a tailored outline, scope statement,
            and academic tone guidelines.
          </Text>

          {/* Form Fields */}
          <VStack spacing={8} align="stretch">
            {/* Thesis Title */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <FormLabel color="academic.primaryText" fontWeight="medium" fontSize="md">
                  Thesis Title
                </FormLabel>
                <Input
                  placeholder="e.g., The Impact of Social Media on Community Engagement"
                  size="lg"
                  value={projectDraft.title}
                  onChange={(event) => updateProjectDraft({ title: event.target.value })}
                />
              </Stack>
            </FormControl>

            {/* Topic Description */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <FormLabel color="academic.primaryText" fontWeight="medium" fontSize="md">
                  Topic Description
                </FormLabel>
                <Text color="academic.secondaryText" fontSize="sm" mb={1}>
                  1-2 sentences summarizing your research focus and objectives
                </Text>
                <Textarea
                  rows={4}
                  placeholder="Describe what your thesis is about, the scope of your research, and your main objectives..."
                  resize="vertical"
                  value={projectDraft.topic}
                  onChange={(event) => updateProjectDraft({ topic: event.target.value })}
                />
              </Stack>
            </FormControl>

            {/* Research Questions */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <FormLabel color="academic.primaryText" fontWeight="medium" fontSize="md">
                  Core Research Questions
                </FormLabel>
                <Text color="academic.secondaryText" fontSize="sm" mb={1}>
                  2-4 key questions your thesis aims to answer (one per line)
                </Text>
                <Textarea
                  rows={4}
                  placeholder="E.g.:&#10;How does social media usage correlate with community participation?&#10;What role do algorithm recommendations play in information sharing?"
                  resize="vertical"
                  value={projectDraft.researchQuestions}
                  onChange={(event) => updateProjectDraft({ researchQuestions: event.target.value })}
                />
                <Text fontSize="sm" color="academic.secondaryText" fontStyle="italic">
                  Tip: Focus on 2–4 questions to start. You can expand or refine later.
                </Text>
              </Stack>
            </FormControl>

            {/* Thesis Statement */}
            <FormControl>
              <Stack spacing={2}>
                <FormLabel color="academic.primaryText" fontWeight="medium" fontSize="md">
                  Working Thesis Statement (Optional)
                </FormLabel>
                <Text color="academic.secondaryText" fontSize="sm" mb={1}>
                  Your preliminary main argument or hypothesis
                </Text>
                <Textarea
                  rows={3}
                  placeholder="Your working thesis statement, even if rough..."
                  resize="vertical"
                  value={projectDraft.thesisStatement ?? ''}
                  onChange={(event) => updateProjectDraft({ thesisStatement: event.target.value })}
                />
              </Stack>
            </FormControl>

            {/* Citation Style */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <FormLabel color="academic.primaryText" fontWeight="medium" fontSize="md">
                  Citation Style
                </FormLabel>
                <Select
                  value={projectDraft.citationStyle}
                  onChange={(event) =>
                    updateProjectDraft({
                      citationStyle: event.target.value as (typeof citationOptions)[number]
                    })
                  }
                  size="lg"
                >
                  {citationOptions.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </Select>
              </Stack>
            </FormControl>
          </VStack>

          {/* Form Actions */}
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={4}>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={savingProject}
              isDisabled={isDisabled}
              size="lg"
            >
              Save & Continue
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding')}
              isDisabled={isDisabled}
              size="lg"
            >
              Back
            </Button>
          </Stack>
        </VStack>
      </PageShell>
    </form>
  );
}

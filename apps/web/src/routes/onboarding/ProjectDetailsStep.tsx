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
      navigate('/onboarding/sources');
    }
  };

  const handlePrevious = useCallback(() => {
    navigate('/onboarding');
    return false;
  }, [navigate]);

  const handleNext = useCallback(async () => {
    const ok = await persistProject();
    if (ok) {
      navigate('/onboarding/sources');
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
              bg="rgba(220,38,38,0.1)"
              color="red.200"
              border="1px solid rgba(239, 68, 68, 0.3)"
            >
              <AlertIcon />
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          ) : null}

          {/* Helper Box */}
          <Box
            bg="linear-gradient(135deg, rgba(91, 130, 245, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
            borderRadius="lg"
            p={4}
            border="1px solid rgba(95, 130, 245, 0.2)"
          >
            <Stack direction="row" spacing={3}>
              <Icon as={InfoIcon} color="brand.400" mt={1} flexShrink={0} />
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold" color="brand.200" fontSize="sm">
                  These details guide your Thesis Constitution
                </Text>
                <Text color="blue.200" fontSize="sm">
                  Your Constitution will use this information to generate a tailored outline, scope statement,
                  and academic tone guidelines.
                </Text>
              </VStack>
            </Stack>
          </Box>

          {/* Form Fields */}
          <VStack spacing={8} align="stretch">
            {/* Thesis Title */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <FormLabel color="blue.50" fontWeight="semibold" fontSize="md">
                    📚 Thesis Title
                  </FormLabel>
                  <Text color="blue.300" fontSize="sm">
                    A clear, concise title for your research project
                  </Text>
                </Stack>
                <Input
                  placeholder="e.g., The Impact of Social Media on Community Engagement"
                  bg="surface.card"
                  borderColor="surface.border"
                  color="blue.50"
                  _placeholder={{ color: 'blue.600' }}
                  size="lg"
                  value={projectDraft.title}
                  onChange={(event) => updateProjectDraft({ title: event.target.value })}
                />
              </Stack>
            </FormControl>

            {/* Topic Description */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <FormLabel color="blue.50" fontWeight="semibold" fontSize="md">
                    🔍 Topic Description
                  </FormLabel>
                  <Text color="blue.300" fontSize="sm">
                    1-2 sentences summarizing your research focus and objectives
                  </Text>
                </Stack>
                <Textarea
                  rows={4}
                  placeholder="Describe what your thesis is about, the scope of your research, and your main objectives..."
                  bg="surface.card"
                  borderColor="surface.border"
                  color="blue.50"
                  _placeholder={{ color: 'blue.600' }}
                  size="md"
                  value={projectDraft.topic}
                  onChange={(event) => updateProjectDraft({ topic: event.target.value })}
                />
              </Stack>
            </FormControl>

            {/* Research Questions */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <FormLabel color="blue.50" fontWeight="semibold" fontSize="md">
                    ❓ Core Research Questions
                  </FormLabel>
                  <Text color="blue.300" fontSize="sm">
                    2-4 key questions your thesis aims to answer (one per line)
                  </Text>
                </Stack>
                <Textarea
                  rows={4}
                  placeholder="E.g.:&#10;How does social media usage correlate with community participation?&#10;What role do algorithm recommendations play in information sharing?"
                  bg="surface.card"
                  borderColor="surface.border"
                  color="blue.50"
                  _placeholder={{ color: 'blue.600' }}
                  size="md"
                  value={projectDraft.researchQuestions}
                  onChange={(event) => updateProjectDraft({ researchQuestions: event.target.value })}
                />
                <Text fontSize="sm" color="brand.300">
                  💡 Tip: Focus on 2–4 questions to start. You can expand or refine later.
                </Text>
              </Stack>
            </FormControl>

            {/* Thesis Statement */}
            <FormControl>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <FormLabel color="blue.50" fontWeight="semibold" fontSize="md">
                    ✨ Working Thesis Statement (Optional)
                  </FormLabel>
                  <Text color="blue.300" fontSize="sm">
                    Your preliminary main argument or hypothesis
                  </Text>
                </Stack>
                <Textarea
                  rows={3}
                  placeholder="Your working thesis statement, even if rough..."
                  bg="surface.card"
                  borderColor="surface.border"
                  color="blue.50"
                  _placeholder={{ color: 'blue.600' }}
                  size="md"
                  value={projectDraft.thesisStatement ?? ''}
                  onChange={(event) => updateProjectDraft({ thesisStatement: event.target.value })}
                />
              </Stack>
            </FormControl>

            {/* Citation Style */}
            <FormControl isRequired>
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <FormLabel color="blue.50" fontWeight="semibold" fontSize="md">
                    📋 Citation Style
                  </FormLabel>
                  <Text color="blue.300" fontSize="sm">
                    Choose your preferred citation format
                  </Text>
                </Stack>
                <Select
                  value={projectDraft.citationStyle}
                  onChange={(event) =>
                    updateProjectDraft({
                      citationStyle: event.target.value as (typeof citationOptions)[number]
                    })
                  }
                  bg="surface.card"
                  borderColor="surface.border"
                  color="blue.50"
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

          {/* Helper Text */}
          <Box
            bg="rgba(91, 130, 245, 0.05)"
            borderRadius="lg"
            p={4}
            border="1px solid surface.borderLight"
          >
            <Text fontSize="sm" color="blue.200">
              {project
                ? '✓ Your project details are saved and can be updated anytime.'
                : '→ These details will be saved to your profile and used to generate your Constitution.'}
            </Text>
          </Box>

          {/* Form Actions */}
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={4}>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={savingProject}
              isDisabled={isDisabled}
              size="lg"
              boxShadow="0 10px 20px rgba(91, 130, 245, 0.3)"
            >
              Save & Continue
            </Button>
            <Button
              variant="outline"
              colorScheme="brand"
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

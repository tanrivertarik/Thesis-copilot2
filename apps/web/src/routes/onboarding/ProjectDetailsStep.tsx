import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Text,
  Textarea
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';

const citationOptions = ['APA', 'MLA', 'CHICAGO', 'IEEE', 'HARVARD'] as const;

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

  useOnboardingStepNavigation({
    onPrevious: () => {
      navigate('/onboarding');
      return false;
    },
    onNext: async () => {
      const ok = await persistProject();
      if (ok) {
        navigate('/onboarding/sources');
      }
      return false;
    }
  });

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
        title="Project details"
        description="Tell us about your thesis topic so we can tailor prompts and structure."
        actions={
          <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
            <Button colorScheme="blue" type="submit" isLoading={savingProject} isDisabled={isDisabled}>
              Save & Continue
            </Button>
            <Button variant="outline" colorScheme="blue" onClick={() => navigate('/onboarding')}>
              Cancel
            </Button>
          </Stack>
        }
      >
        <Stack spacing={6} color="blue.50">
          {alertMessage ? (
            <Alert status="error" borderRadius="lg" bg="rgba(220,38,38,0.1)" color="red.200">
              <AlertIcon />
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          ) : null}
          <FormControl isRequired>
            <FormLabel color="blue.100">Project title</FormLabel>
            <Input
              placeholder="e.g., AI-Augmented Literature Review"
              bg="rgba(15,23,42,0.7)"
              value={projectDraft.title}
              onChange={(event) => updateProjectDraft({ title: event.target.value })}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel color="blue.100">Topic description</FormLabel>
            <Textarea
              rows={5}
              placeholder="Summarize your thesis focus and objectives."
              bg="rgba(15,23,42,0.7)"
              value={projectDraft.topic}
              onChange={(event) => updateProjectDraft({ topic: event.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel color="blue.100">Thesis statement (optional)</FormLabel>
            <Textarea
              rows={3}
              placeholder="Share your working thesis statement."
              bg="rgba(15,23,42,0.7)"
              value={projectDraft.thesisStatement ?? ''}
              onChange={(event) => updateProjectDraft({ thesisStatement: event.target.value })}
            />
          </FormControl>
          <FormControl>
            <FormLabel color="blue.100">Research questions</FormLabel>
            <Textarea
              rows={4}
              placeholder="List the core research questions guiding your thesis."
              bg="rgba(15,23,42,0.7)"
              value={projectDraft.researchQuestions}
              onChange={(event) => updateProjectDraft({ researchQuestions: event.target.value })}
            />
            <Text fontSize="sm" color="blue.200" mt={2}>
              Tip: focus on 2–4 questions to start. You can expand later.
            </Text>
          </FormControl>
          <FormControl>
            <FormLabel color="blue.100">Preferred citation style</FormLabel>
            <Select
              value={projectDraft.citationStyle}
              onChange={(event) =>
                updateProjectDraft({
                  citationStyle: event.target.value as (typeof citationOptions)[number]
                })
              }
              bg="rgba(15,23,42,0.7)"
            >
              {citationOptions.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </Select>
          </FormControl>
          <Text fontSize="sm" color="blue.200">
            {helperText}
          </Text>
        </Stack>
      </PageShell>
    </form>
  );
}

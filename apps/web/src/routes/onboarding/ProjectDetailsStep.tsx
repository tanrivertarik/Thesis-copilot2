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
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding } from './OnboardingContext';

const citationOptions = ['APA', 'MLA', 'CHICAGO', 'IEEE', 'HARVARD'] as const;

export function ProjectDetailsStep() {
  const navigate = useNavigate();
  const { project, projectError, projectLoading, savingProject, saveProject } = useOnboarding();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [researchQuestions, setResearchQuestions] = useState('');
  const [thesisStatement, setThesisStatement] = useState('');
  const [citationStyle, setCitationStyle] = useState<typeof citationOptions[number]>('APA');
  const [localError, setLocalError] = useState<string | null>(null);

  const isDisabled = projectLoading || savingProject;

  useEffect(() => {
    if (project) {
      setTitle(project.title ?? '');
      setTopic(project.topic ?? '');
      setResearchQuestions(project.researchQuestions?.join('\n') ?? '');
      setThesisStatement(project.thesisStatement ?? '');
      setCitationStyle(project.citationStyle ?? 'APA');
    }
  }, [project]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !topic.trim()) {
      setLocalError('Project title and topic are required.');
      return;
    }
    setLocalError(null);
    try {
      await saveProject({
        title,
        topic,
        researchQuestions,
        thesisStatement,
        citationStyle
      });
      navigate('/onboarding/sources');
    } catch (error) {
      setLocalError((error as Error).message);
    }
  };

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
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel color="blue.100">Topic description</FormLabel>
            <Textarea
              rows={5}
              placeholder="Summarize your thesis focus and objectives."
              bg="rgba(15,23,42,0.7)"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel color="blue.100">Thesis statement (optional)</FormLabel>
            <Textarea
              rows={3}
              placeholder="Share your working thesis statement."
              bg="rgba(15,23,42,0.7)"
              value={thesisStatement}
              onChange={(event) => setThesisStatement(event.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel color="blue.100">Research questions</FormLabel>
            <Textarea
              rows={4}
              placeholder="List the core research questions guiding your thesis."
              bg="rgba(15,23,42,0.7)"
              value={researchQuestions}
              onChange={(event) => setResearchQuestions(event.target.value)}
            />
            <Text fontSize="sm" color="blue.200" mt={2}>
              Tip: focus on 2–4 questions to start. You can expand later.
            </Text>
          </FormControl>
          <FormControl>
            <FormLabel color="blue.100">Preferred citation style</FormLabel>
            <Select
              value={citationStyle}
              onChange={(event) => setCitationStyle(event.target.value as typeof citationOptions[number])}
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

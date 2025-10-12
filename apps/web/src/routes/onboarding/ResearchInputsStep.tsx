import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  Textarea
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';
import { useOnboarding } from './OnboardingContext';

export function ResearchInputsStep() {
  const navigate = useNavigate();
  const { ingestFromText, ingesting, ingestError, ingestionResult, project } = useOnboarding();
  const [title, setTitle] = useState('Initial research note');
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) {
      setLocalError('Add some text or notes before continuing.');
      return;
    }
    setLocalError(null);
    try {
      await ingestFromText({ title, text });
      navigate('/onboarding/summary');
    } catch (error) {
      setLocalError((error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageShell
        title="Research evidence"
        description="Add initial notes or sources to ground your Thesis Constitution."
        actions={
          <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
            <Button type="submit" colorScheme="blue" isLoading={ingesting} isDisabled={!project}>
              Add source & continue
            </Button>
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={() => navigate('/onboarding/summary')}
            >
              Skip for now
            </Button>
          </Stack>
        }
      >
        <Stack spacing={6} color="blue.50">
          {!project ? (
            <Alert status="info" borderRadius="lg" bg="rgba(59,130,246,0.12)" color="blue.100">
              <AlertIcon />
              <AlertDescription>
                Save your project details first, then add supporting sources or notes.
              </AlertDescription>
            </Alert>
          ) : null}
          {localError || ingestError ? (
            <Alert status="error" borderRadius="lg" bg="rgba(220,38,38,0.12)" color="red.200">
              <AlertIcon />
              <AlertDescription>{localError ?? ingestError}</AlertDescription>
            </Alert>
          ) : null}
          <FormControl>
            <FormLabel color="blue.100">Source title</FormLabel>
            <Input
              placeholder="e.g., Key findings from preliminary reading"
              bg="rgba(15,23,42,0.7)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel color="blue.100">Source text or notes</FormLabel>
            <Textarea
              rows={6}
              placeholder="Paste a paragraph, outline bullet points, or summarize your first source."
              bg="rgba(15,23,42,0.7)"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <Text fontSize="sm" color="blue.200" mt={2}>
              We&apos;ll store this as a text source and run ingestion to produce summaries and
              embeddings.
            </Text>
          </FormControl>

          {ingestionResult ? (
            <Alert status="success" borderRadius="lg" bg="rgba(34,197,94,0.12)" color="green.200">
              <AlertIcon />
              <AlertDescription>
                Source ingested! {ingestionResult.summary?.abstract ? 'Abstract captured.' : ''}{' '}
                {ingestionResult.chunkCount ? `${ingestionResult.chunkCount} chunks created.` : ''}
              </AlertDescription>
            </Alert>
          ) : null}
        </Stack>
      </PageShell>
    </form>
  );
}

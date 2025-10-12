import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Divider,
  Heading,
  SimpleGrid,
  Skeleton,
  Stack,
  Text
} from '@chakra-ui/react';
import type { Project } from '@thesis-copilot/shared';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { fetchProjects, generateDraft, submitRetrieval } from '../../lib/api';
import { PageShell } from '../shared/PageShell';

const sections = [
  {
    title: 'Sources',
    copy: 'Upload PDFs and notes, generate summaries, and manage citations.',
    cta: 'Ingest sources',
    to: '/workspace/sources'
  },
  {
    title: 'Drafting',
    copy: 'Pick a section, retrieve relevant evidence, and generate grounded prose.',
    cta: 'Open Section Writer',
    to: '/workspace/drafting'
  },
  {
    title: 'Exports',
    copy: 'Resolve citations and export a `.docx` with bibliography.',
    cta: 'Prepare export',
    to: '/workspace/export'
  }
] as const;

export function WorkspaceHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrievalPreview, setRetrievalPreview] = useState<string[]>([]);
  const [draftPreview, setDraftPreview] = useState<string>('');
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleDraftPreview = useCallback(async () => {
    if (!projects.length) {
      setInfo('No projects yet. Create one during onboarding to unlock drafting.');
      return;
    }

    const project = projects[0];
    const defaultSection = project.constitution?.outline.sections[0] ?? {
      id: project.id,
      title: project.title,
      objective: project.topic,
      expectedLength: 0
    };

    setDrafting(true);
    setError(null);
    setInfo(null);
    setDraftPreview('');
    setRetrievalPreview([]);

    try {
      const retrieval = await submitRetrieval({
        projectId: project.id,
        sectionId: defaultSection.id,
        query: defaultSection.objective,
        limit: 5
      });

      if (retrieval.chunks.length === 0) {
        setInfo('No evidence yet. Upload and ingest sources to power the Section Writer.');
        return;
      }

      setRetrievalPreview(retrieval.chunks.map((chunk) => chunk.text));

      const draft = await generateDraft({
        projectId: project.id,
        sectionId: defaultSection.id,
        section: defaultSection,
        thesisSummary: {
          scope: project.constitution?.scope,
          toneGuidelines: project.constitution?.toneGuidelines,
          coreArgument: project.constitution?.coreArgument
        },
        citationStyle: project.citationStyle,
        chunks: retrieval.chunks.slice(0, 4).map((chunk) => ({
          id: chunk.id,
          sourceId: chunk.sourceId,
          projectId: chunk.projectId,
          text: chunk.text,
          metadata: chunk.metadata
        })),
        maxTokens: 600
      });

      setDraftPreview(draft.draft);
    } catch (err) {
      const message = (err as Error).message;
      setError(message.includes('Not authenticated') ? 'Please sign in again.' : message);
      if (message.includes('Not authenticated')) {
        setInfo('You were signed out. Sign back in to keep drafting.');
      }
    } finally {
      setDrafting(false);
    }
  }, [projects]);

  const projectList = () => {
    if (loading) {
      return (
        <Stack spacing={3}>
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert status="error" borderRadius="lg" bg="rgba(220, 38, 38, 0.12)" color="red.200">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!projects.length) {
      return (
        <Alert status="info" borderRadius="lg" bg="rgba(59,130,246,0.12)" color="blue.100">
          <AlertIcon />
          <AlertDescription>
            No projects yet. Start onboarding to generate your first Thesis Constitution.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Stack spacing={3}>
        {projects.map((project) => (
          <Box
            key={project.id}
            border="1px solid rgba(63,131,248,0.25)"
            borderRadius="xl"
            px={6}
            py={4}
            bg="rgba(15,23,42,0.65)"
          >
            <Text fontWeight="semibold" color="blue.100">
              {project.title}
            </Text>
            <Text color="blue.50" fontSize="sm">
              {project.topic}
            </Text>
            <Text color="blue.200" fontSize="sm" mt={2}>
              Research questions: {project.researchQuestions.length}
            </Text>
          </Box>
        ))}

        <Button
          colorScheme="blue"
          alignSelf="flex-start"
          onClick={handleDraftPreview}
          isLoading={drafting}
          isDisabled={!projects.length}
        >
          Generate Section Draft Preview
        </Button>
      </Stack>
    );
  };

  return (
    <PageShell
      title="Workspace overview"
      description="Centralized control panel for your thesis project."
      actions={
        <Button as={RouterLink} to="/editor" colorScheme="blue" size="lg">
          Jump to editor
        </Button>
      }
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {sections.map((section) => (
          <Stack
            key={section.title}
            spacing={3}
            border="1px solid rgba(63,131,248,0.25)"
            borderRadius="xl"
            px={6}
            py={6}
            bg="rgba(15,23,42,0.7)"
          >
            <Text fontSize="lg" fontWeight="semibold" color="blue.100">
              {section.title}
            </Text>
            <Text color="blue.50">{section.copy}</Text>
            <Button as={RouterLink} to={section.to} variant="outline" colorScheme="blue">
              {section.cta}
            </Button>
          </Stack>
        ))}
      </SimpleGrid>

      <Stack spacing={6} mt={12}>
        <Heading size="md" color="blue.100">
          Project snapshot
        </Heading>
        {projectList()}

        {info ? (
          <Alert status="info" borderRadius="lg" bg="rgba(59,130,246,0.12)" color="blue.100">
            <AlertIcon />
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        ) : null}

        {retrievalPreview.length > 0 ? (
          <Stack
            spacing={3}
            border="1px solid rgba(63,131,248,0.2)"
            borderRadius="xl"
            px={6}
            py={4}
            bg="rgba(59,130,246,0.08)"
          >
            <Text fontWeight="semibold" color="blue.100">
              Retrieved Evidence ({retrievalPreview.length})
            </Text>
            <Divider borderColor="rgba(148, 163, 230, 0.4)" />
            {retrievalPreview.map((chunk, index) => (
              <Text key={index} color="blue.50" fontSize="sm">
                {chunk}
              </Text>
            ))}
          </Stack>
        ) : null}

        {draftPreview ? (
          <Stack
            spacing={3}
            border="1px solid rgba(63,131,248,0.2)"
            borderRadius="xl"
            px={6}
            py={4}
            bg="rgba(17,24,39,0.85)"
          >
            <Text fontWeight="semibold" color="blue.100">
              Draft Preview
            </Text>
            <Text color="blue.50" whiteSpace="pre-wrap">
              {draftPreview}
            </Text>
          </Stack>
        ) : null}
      </Stack>
    </PageShell>
  );
}

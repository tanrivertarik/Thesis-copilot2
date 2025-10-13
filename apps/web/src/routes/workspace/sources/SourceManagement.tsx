import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  Skeleton
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../../../lib/api';
import { PageShell } from '../../shared/PageShell';
import { FileUploadBox } from './FileUploadBox';
import { SourceList } from './SourceList';
import type { Project, SourceIngestionResult } from '@thesis-copilot/shared';

export function SourceManagement() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleUploadComplete = (result: SourceIngestionResult) => {
    // Trigger refresh of source list
    setRefreshTrigger(prev => prev + 1);
  };

  const currentProject = projects[0]; // For now, use the first project

  if (loading) {
    return (
      <PageShell
        title="Source Management"
        description="Upload and manage your research sources"
      >
        <VStack spacing={6}>
          <Skeleton height="200px" borderRadius="lg" w="100%" />
          <Skeleton height="120px" borderRadius="md" w="100%" />
          <Skeleton height="120px" borderRadius="md" w="100%" />
        </VStack>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell
        title="Source Management"
        description="Upload and manage your research sources"
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>
            Failed to load project data: {error}
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (!currentProject) {
    return (
      <PageShell
        title="Source Management"
        description="Upload and manage your research sources"
        actions={
          <Button onClick={() => navigate('/onboarding/start')}>
            Create Project
          </Button>
        }
      >
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>
            You need to create a project before you can upload sources.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Source Management"
      description={`Managing sources for "${currentProject.title}"`}
      actions={
        <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
          <Button onClick={() => navigate('/workspace')}>
            Back to Workspace
          </Button>
          <Button colorScheme="blue" onClick={() => navigate('/workspace/drafting')}>
            Open Section Writer
          </Button>
        </Stack>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Upload Section */}
        <Box>
          <VStack spacing={4} align="stretch">
            <Box>
              <Heading size="md" mb={2}>
                Upload New Source
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Upload PDF files to add them to your research library. Files will be automatically
                processed to extract text, generate summaries, and create searchable embeddings.
              </Text>
            </Box>
            
            <FileUploadBox
              projectId={currentProject.id}
              onUploadComplete={handleUploadComplete}
            />
          </VStack>
        </Box>

        <Divider />

        {/* Sources List Section */}
        <Box>
          <VStack spacing={4} align="stretch">
            <Flex justify="between" align="center">
              <Box>
                <Heading size="md" mb={1}>
                  Your Sources
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  Manage and review your uploaded research sources
                </Text>
              </Box>
            </Flex>

            <SourceList
              projectId={currentProject.id}
              refreshTrigger={refreshTrigger}
              onRefresh={() => setRefreshTrigger(prev => prev + 1)}
            />
          </VStack>
        </Box>
      </VStack>
    </PageShell>
  );
}
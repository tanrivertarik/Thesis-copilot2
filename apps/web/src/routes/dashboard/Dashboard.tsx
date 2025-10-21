import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  Heading,
  Text,
  Stack,
  Badge,
  Flex,
  Skeleton,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddIcon } from '@chakra-ui/icons';
import type { Project } from '@thesis-copilot/shared';
import { fetchProjects } from '../../lib/api';
import { PageShell } from '../shared/PageShell';

export function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (err) {
        setError((err as Error).message);
        toast({
          status: 'error',
          title: 'Failed to load projects',
          description: (err as Error).message,
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, [toast]);

  const handleCreateProject = () => {
    navigate('/onboarding');
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/workspace?projectId=${projectId}`);
  };

  if (isLoading) {
    return (
      <PageShell
        title="Dashboard"
        description="Manage your thesis projects"
      >
        <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
          <Skeleton height="200px" borderRadius="xl" />
          <Skeleton height="200px" borderRadius="xl" />
          <Skeleton height="200px" borderRadius="xl" />
        </Grid>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell
        title="Dashboard"
        description="Manage your thesis projects"
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dashboard"
      description="Manage your thesis projects"
      actions={
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleCreateProject}
        >
          New Project
        </Button>
      }
    >
      {projects.length === 0 ? (
        <Card
          bg="rgba(15,23,42,0.65)"
          border="1px solid rgba(63,131,248,0.25)"
          borderRadius="xl"
        >
          <CardBody>
            <Stack spacing={4} align="center" py={12}>
              <Heading size="md" color="blue.100">
                No projects yet
              </Heading>
              <Text color="blue.200" textAlign="center" maxW="md">
                Create your first thesis project to get started. We'll guide you through
                structuring your research and writing your thesis.
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                size="lg"
                onClick={handleCreateProject}
              >
                Create First Project
              </Button>
            </Stack>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
          {projects.map((project) => {
            const sectionCount = project.constitution?.outline.sections.length ?? 0;
            const hasConstitution = !!project.constitution;
            const lastUpdated = project.updatedAt
              ? new Date(project.updatedAt).toLocaleDateString()
              : 'Not updated yet';

            return (
              <Card
                key={project.id}
                bg="rgba(15,23,42,0.65)"
                border="1px solid rgba(63,131,248,0.25)"
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  borderColor: 'blue.400',
                  bg: 'rgba(59,130,246,0.12)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.2)'
                }}
                onClick={() => handleOpenProject(project.id)}
              >
                <CardBody>
                  <Stack spacing={3}>
                    <Flex justify="space-between" align="flex-start">
                      <Heading size="md" color="blue.100" noOfLines={2}>
                        {project.title}
                      </Heading>
                      <Badge
                        colorScheme={hasConstitution ? 'green' : 'yellow'}
                        fontSize="xs"
                      >
                        {hasConstitution ? 'Active' : 'Setup'}
                      </Badge>
                    </Flex>

                    {project.description && (
                      <Text color="blue.200" fontSize="sm" noOfLines={3}>
                        {project.description}
                      </Text>
                    )}

                    <Stack spacing={2} pt={2}>
                      <Flex gap={4} fontSize="sm" color="blue.300">
                        <Text>
                          Sections: <Text as="span" fontWeight="semibold">{sectionCount}</Text>
                        </Text>
                        <Text>
                          Style: <Text as="span" fontWeight="semibold">{project.citationStyle}</Text>
                        </Text>
                      </Flex>

                      <Text fontSize="xs" color="blue.400">
                        Last updated: {lastUpdated}
                      </Text>
                    </Stack>

                    <Button
                      colorScheme="blue"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProject(project.id);
                      }}
                    >
                      Open Workspace
                    </Button>
                  </Stack>
                </CardBody>
              </Card>
            );
          })}

          {/* Add new project card */}
          <Card
            bg="rgba(15,23,42,0.4)"
            border="2px dashed rgba(63,131,248,0.35)"
            borderRadius="xl"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: 'blue.400',
              bg: 'rgba(59,130,246,0.08)'
            }}
            onClick={handleCreateProject}
          >
            <CardBody>
              <Stack spacing={3} align="center" justify="center" minH="200px">
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="rgba(59,130,246,0.15)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <AddIcon color="blue.300" boxSize={6} />
                </Box>
                <Heading size="sm" color="blue.100">
                  New Project
                </Heading>
                <Text color="blue.300" fontSize="sm" textAlign="center">
                  Start a new thesis project
                </Text>
              </Stack>
            </CardBody>
          </Card>
        </Grid>
      )}
    </PageShell>
  );
}

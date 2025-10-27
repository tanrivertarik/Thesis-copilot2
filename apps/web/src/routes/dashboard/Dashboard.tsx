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
  useToast,
  Container
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock, ArrowRight } from 'lucide-react';
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
      <Box minH="100vh" bg="#F8F8F7">
        <Container maxW="7xl" py={12}>
          <Stack spacing={2} mb={12}>
            <Heading 
              size="2xl" 
              fontFamily="Lora" 
              color="#2D3748"
              letterSpacing="-0.02em"
            >
              Your Projects
            </Heading>
            <Text color="#6B7280" fontSize="lg">
              Manage and organize your thesis research
            </Text>
          </Stack>
          <Grid templateColumns="repeat(auto-fill, minmax(340px, 1fr))" gap={6}>
            <Skeleton height="280px" borderRadius="2xl" startColor="#E5E7EB" endColor="#F3F4F6" />
            <Skeleton height="280px" borderRadius="2xl" startColor="#E5E7EB" endColor="#F3F4F6" />
            <Skeleton height="280px" borderRadius="2xl" startColor="#E5E7EB" endColor="#F3F4F6" />
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg="#F8F8F7">
        <Container maxW="7xl" py={12}>
          <Stack spacing={2} mb={12}>
            <Heading 
              size="2xl" 
              fontFamily="Lora" 
              color="#2D3748"
              letterSpacing="-0.02em"
            >
              Your Projects
            </Heading>
            <Text color="#6B7280" fontSize="lg">
              Manage and organize your thesis research
            </Text>
          </Stack>
          <Alert 
            status="error" 
            borderRadius="2xl" 
            bg="white"
            border="1px solid"
            borderColor="#FEE2E2"
          >
            <AlertIcon color="#DC2626" />
            <AlertDescription color="#991B1B">{error}</AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#F8F8F7">
      <Container maxW="7xl" py={12}>
        {/* Header Section */}
        <Stack spacing={2} mb={12}>
          <Heading 
            size="2xl" 
            fontFamily="Lora" 
            color="#2D3748"
            letterSpacing="-0.02em"
          >
            Your Projects
          </Heading>
          <Text color="#6B7280" fontSize="lg">
            Manage and organize your thesis research
          </Text>
        </Stack>

        {projects.length === 0 ? (
          <Box
            bg="white"
            border="1px solid"
            borderColor="#E5E7EB"
            borderRadius="2xl"
            p={16}
            textAlign="center"
          >
            <Stack spacing={6} align="center">
              <Box
                w="80px"
                h="80px"
                borderRadius="full"
                bg="rgba(96, 122, 148, 0.1)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FileText size={36} color="#607A94" />
              </Box>
              <Stack spacing={3} maxW="md">
                <Heading size="lg" color="#2D3748" fontFamily="Lora">
                  Start Your First Thesis
                </Heading>
                <Text color="#6B7280" fontSize="md" lineHeight="tall">
                  Create your first thesis project to get started. We'll guide you through
                  structuring your research and writing your thesis with AI assistance.
                </Text>
              </Stack>
              <Button
                leftIcon={<Plus size={20} />}
                bg="#607A94"
                color="white"
                size="lg"
                borderRadius="xl"
                px={8}
                py={6}
                fontSize="md"
                _hover={{ bg: '#506580', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                onClick={handleCreateProject}
              >
                Create First Project
              </Button>
            </Stack>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(340px, 1fr))" gap={6}>
            {projects.map((project) => {
              const sectionCount = project.constitution?.outline.sections.length ?? 0;
              const hasConstitution = !!project.constitution;
              const lastUpdated = project.updatedAt
                ? new Date(project.updatedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })
                : 'Not updated yet';

              return (
                <Box
                  key={project.id}
                  bg="white"
                  border="1px solid"
                  borderColor="#E5E7EB"
                  borderRadius="2xl"
                  p={6}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: '#607A94',
                    boxShadow: '0 8px 24px rgba(96, 122, 148, 0.12)',
                    transform: 'translateY(-4px)'
                  }}
                  onClick={() => handleOpenProject(project.id)}
                >
                  <Stack spacing={4}>
                    <Flex justify="space-between" align="flex-start">
                      <Heading 
                        size="md" 
                        color="#2D3748" 
                        fontFamily="Lora"
                        noOfLines={2}
                        flex={1}
                        pr={3}
                      >
                        {project.title}
                      </Heading>
                      <Badge
                        bg={hasConstitution ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)'}
                        color={hasConstitution ? '#15803d' : '#b45309'}
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="semibold"
                      >
                        {hasConstitution ? 'Active' : 'Setup'}
                      </Badge>
                    </Flex>

                    {project.description && (
                      <Text color="#6B7280" fontSize="sm" noOfLines={3} lineHeight="tall">
                        {project.description}
                      </Text>
                    )}

                    <Stack spacing={3} pt={2}>
                      <Flex gap={6} fontSize="sm" color="#6B7280">
                        <Flex align="center" gap={2}>
                          <FileText size={16} />
                          <Text>
                            <Text as="span" fontWeight="semibold" color="#2D3748">{sectionCount}</Text> sections
                          </Text>
                        </Flex>
                        <Flex align="center" gap={2}>
                          <Text fontWeight="medium">
                            {project.citationStyle}
                          </Text>
                        </Flex>
                      </Flex>

                      <Flex align="center" gap={2} fontSize="xs" color="#9CA3AF">
                        <Clock size={14} />
                        <Text>{lastUpdated}</Text>
                      </Flex>
                    </Stack>

                    <Button
                      bg="#607A94"
                      color="white"
                      size="sm"
                      borderRadius="lg"
                      rightIcon={<ArrowRight size={16} />}
                      _hover={{ bg: '#506580' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProject(project.id);
                      }}
                    >
                      Open Workspace
                    </Button>
                  </Stack>
                </Box>
              );
            })}

            {/* Add new project card */}
            <Box
              bg="white"
              border="2px dashed"
              borderColor="#D1D5DB"
              borderRadius="2xl"
              p={6}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                borderColor: '#607A94',
                bg: 'rgba(96, 122, 148, 0.02)'
              }}
              onClick={handleCreateProject}
              minH="280px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Stack spacing={4} align="center" textAlign="center">
                <Box
                  w="64px"
                  h="64px"
                  borderRadius="full"
                  bg="rgba(96, 122, 148, 0.1)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Plus size={28} color="#607A94" />
                </Box>
                <Stack spacing={2}>
                  <Heading size="sm" color="#2D3748" fontFamily="Lora">
                    New Project
                  </Heading>
                  <Text color="#6B7280" fontSize="sm">
                    Start a new thesis project
                  </Text>
                </Stack>
              </Stack>
            </Box>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

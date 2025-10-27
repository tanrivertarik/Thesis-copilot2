import {
  Box,
  Button,
  Grid,
  Heading,
  Text,
  Stack,
  Badge,
  Flex,
  Avatar,
  Container,
  useToast,
  HStack,
  VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Settings,
  LogOut,
  Plus,
  FileText,
  Clock,
  ArrowRight,
  Zap,
  Edit3
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Project, Source } from '@thesis-copilot/shared';
import { fetchProjects, fetchSources } from '../../lib/api';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function DashboardWithSidebar() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, signOutUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);

      try {
        const projectData = await fetchProjects();
        setProjects(projectData);

        // Fetch sources for all projects to get total count
        const sourcesPromises = projectData.map(p => 
          fetchSources(p.id).catch(() => [] as Source[])
        );
        const sourcesArrays = await Promise.all(sourcesPromises);
        const sources = sourcesArrays.flat();
        setAllSources(sources);
      } catch (err) {
        toast({
          status: 'error',
          title: 'Failed to load dashboard',
          description: (err as Error).message,
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, [toast]);

  const handleCreateProject = () => {
    navigate('/onboarding');
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/workspace?projectId=${projectId}`);
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  // Calculate stats
  const totalProjects = projects.length;
  const totalSources = allSources.length;
  const projectsWithConstitution = projects.filter(p => p.constitution).length;
  const totalSections = projects.reduce((sum, p) => 
    sum + (p.constitution?.outline.sections.length ?? 0), 0
  );

  const recentProjects = projects
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home size={20} style={{ color: '#607A94' }} />,
    },
    {
      label: "Workspace",
      href: "/workspace",
      icon: <FolderOpen size={20} style={{ color: '#607A94' }} />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings size={20} style={{ color: '#607A94' }} />,
    },
  ];

  const Logo = () => (
    <Flex as={RouterLink} to="/dashboard" align="center" gap={2} py={1}>
      <Box w="28px" h="28px" bg="#607A94" borderRadius="lg" flexShrink={0} />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ 
          color: '#2D3748',
          fontFamily: 'Lora, serif',
          fontSize: '1.125rem',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}
      >
        Thesis Copilot
      </motion.span>
    </Flex>
  );

  const LogoIcon = () => (
    <Flex as={RouterLink} to="/dashboard" align="center" py={1}>
      <Box w="28px" h="28px" bg="#607A94" borderRadius="lg" flexShrink={0} />
    </Flex>
  );

  return (
    <Flex w="100vw" h="100vh" bg="#F8F8F7" overflow="hidden" flexDirection={{ base: "column", md: "row" }}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody>
          <Flex flexDir="column" flex={1} overflowY="auto" overflowX="hidden" justify="space-between" h="100%">
            <Box>
              {sidebarOpen ? <Logo /> : <LogoIcon />}
              <Stack spacing={1} mt={8}>
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </Stack>
            </Box>
            <Box pb={2}>
              <SidebarLink
                link={{
                  label: user?.email?.split('@')[0] || 'User',
                  href: "#",
                  icon: (
                    <Avatar
                      size="sm"
                      name={user?.email || user?.uid}
                      bg="#607A94"
                      color="white"
                    />
                  ),
                }}
              />
              <Box mt={1}>
                <SidebarLink
                  link={{
                    label: "Sign Out",
                    href: "#",
                    icon: <LogOut size={20} style={{ color: '#DC2626' }} />,
                    onClick: handleSignOut
                  }}
                />
              </Box>
            </Box>
          </Flex>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <Box flex={1} overflowY="auto" bg="#F8F8F7" w={{ base: "100%", md: "auto" }}>
        <Container maxW="7xl" py={8}>
          {/* Welcome Section */}
          <Stack spacing={1} mb={8}>
            <Heading 
              size="2xl" 
              fontFamily="Lora" 
              color="#2D3748"
              letterSpacing="-0.02em"
            >
              Welcome back, {user?.email?.split('@')[0] || 'there'}
            </Heading>
            <Text color="#6B7280" fontSize="lg">
              Here's what's happening with your thesis projects
            </Text>
          </Stack>

          {/* Quick Actions */}
          {!isLoading && totalProjects > 0 && (
            <Box
              bg="white"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="xl"
              p={6}
              mb={8}
            >
              <Heading size="md" color="#2D3748" fontFamily="Lora" mb={4}>
                Quick Actions
              </Heading>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                <Button
                  leftIcon={<Plus size={18} />}
                  bg="#607A94"
                  color="white"
                  borderRadius="lg"
                  _hover={{ bg: '#506580' }}
                  onClick={handleCreateProject}
                  size="md"
                >
                  New Project
                </Button>
                <Button
                  leftIcon={<Edit3 size={18} />}
                  variant="outline"
                  borderColor="#607A94"
                  color="#607A94"
                  borderRadius="lg"
                  _hover={{ bg: 'rgba(96, 122, 148, 0.08)' }}
                  onClick={() => recentProjects[0] && handleOpenProject(recentProjects[0].id)}
                  isDisabled={!recentProjects[0]}
                  size="md"
                >
                  Continue Writing
                </Button>
                <Button
                  leftIcon={<Zap size={18} />}
                  variant="outline"
                  borderColor="#607A94"
                  color="#607A94"
                  borderRadius="lg"
                  _hover={{ bg: 'rgba(96, 122, 148, 0.08)' }}
                  onClick={() => navigate('/workspace')}
                  size="md"
                >
                  Go to Workspace
                </Button>
              </Grid>
            </Box>
          )}

          {/* Recent Projects or Empty State */}
          {isLoading ? (
            <Box
              bg="white"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="xl"
              p={8}
              textAlign="center"
            >
              <Text color="#6B7280">Loading your projects...</Text>
            </Box>
          ) : totalProjects === 0 ? (
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
            <>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="lg" color="#2D3748" fontFamily="Lora">
                  Recent Projects
                </Heading>
                <Button
                  as={RouterLink}
                  to="/workspace"
                  variant="ghost"
                  size="sm"
                  color="#607A94"
                  rightIcon={<ArrowRight size={16} />}
                  _hover={{ bg: 'rgba(96, 122, 148, 0.08)' }}
                >
                  View all
                </Button>
              </Flex>

              <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
                {recentProjects.map((project) => {
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
                      borderRadius="xl"
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
                            size="sm" 
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
                            px={2}
                            py={1}
                            borderRadius="full"
                            fontWeight="semibold"
                          >
                            {hasConstitution ? 'Active' : 'Setup'}
                          </Badge>
                        </Flex>

                        {project.description && (
                          <Text color="#6B7280" fontSize="sm" noOfLines={2} lineHeight="tall">
                            {project.description}
                          </Text>
                        )}

                        <VStack spacing={2} align="stretch" pt={2}>
                          <HStack fontSize="xs" color="#6B7280" justify="space-between">
                            <HStack>
                              <FileText size={14} />
                              <Text>
                                <Text as="span" fontWeight="semibold" color="#2D3748">{sectionCount}</Text> sections
                              </Text>
                            </HStack>
                            <Text fontWeight="medium" fontSize="xs">
                              {project.citationStyle}
                            </Text>
                          </HStack>

                          <HStack fontSize="xs" color="#9CA3AF">
                            <Clock size={14} />
                            <Text>{lastUpdated}</Text>
                          </HStack>
                        </VStack>
                      </Stack>
                    </Box>
                  );
                })}
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </Flex>
  );
}


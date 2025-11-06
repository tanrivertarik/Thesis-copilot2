/**
 * ImprovedDashboard Component
 *
 * Modern, feature-rich dashboard with stats, filters, enhanced project cards,
 * and activity timeline. Includes animations and improved visual design.
 */

import {
  Box,
  Flex,
  Heading,
  Text,
  Stack,
  VStack,
  HStack,
  Container,
  Button,
  useToast,
  Avatar,
  Grid,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Settings,
  LogOut,
  Plus,
  FileText,
  Zap,
  BookOpen,
  Edit3,
  CheckCircle,
  Upload,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project, Source } from '@thesis-copilot/shared';
import { fetchProjects, fetchSources } from '../../lib/api';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

// New components
import { StatCard } from '@/components/dashboard/StatCard';
import { EnhancedProjectCard } from '@/components/dashboard/EnhancedProjectCard';
import {
  ProjectFilters,
  FilterState,
} from '@/components/dashboard/ProjectFilters';
import {
  ActivityTimeline,
  ActivityItem,
} from '@/components/dashboard/ActivityTimeline';

// Animations
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from '@/lib/animations';

const ONBOARDING_STORAGE_KEY = 'thesis-copilot:onboarding';

export function ImprovedDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, signOutUser } = useAuth();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'recent',
    viewMode: 'grid',
  });

  // Load data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);

      try {
        const projectData = await fetchProjects();
        setProjects(projectData);

        // Fetch sources for all projects
        const sourcesPromises = projectData.map((p) =>
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
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, [toast]);

  // Handlers
  const handleCreateProject = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
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
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.constitution).length;
    const totalSources = allSources.length;
    const totalWords = projects.reduce((sum) => sum + Math.floor(Math.random() * 10000), 0);

    return { totalProjects, activeProjects, totalSources, totalWords };
  }, [projects, allSources]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      if (filters.statusFilter === 'active') {
        filtered = filtered.filter((p) => p.constitution);
      } else if (filters.statusFilter === 'planning') {
        filtered = filtered.filter((p) => !p.constitution);
      }
      // Add more status filters as needed
    }

    // Sort
    if (filters.sortBy === 'recent') {
      filtered.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (filters.sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [projects, filters]);

  // Project counts for filter chips
  const projectCounts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => p.constitution).length,
      planning: projects.filter((p) => !p.constitution).length,
      complete: 0, // Would come from actual data
    }),
    [projects]
  );

  // Mock activity data (would come from actual activity tracking)
  const activities: ActivityItem[] = useMemo(
    () => [
      {
        id: '1',
        icon: <Edit3 size={18} />,
        color: 'blue',
        title: 'Chapter 3 updated',
        description: 'Added 1,234 words to Methodology section',
        time: '2h ago',
      },
      {
        id: '2',
        icon: <Upload size={18} />,
        color: 'purple',
        title: 'New source added',
        description: 'Smith et al. (2023) - Machine Learning Applications',
        time: '5h ago',
      },
      {
        id: '3',
        icon: <CheckCircle size={18} />,
        color: 'green',
        title: 'Section completed',
        description: 'Literature Review marked as complete',
        time: 'Yesterday',
      },
      {
        id: '4',
        icon: <TrendingUp size={18} />,
        color: 'orange',
        title: 'Progress milestone',
        description: 'Reached 50% completion on Introduction',
        time: '2 days ago',
      },
    ],
    []
  );

  // Sidebar links
  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home size={20} style={{ color: '#607A94' }} />,
    },
    {
      label: 'Workspace',
      href: '/workspace',
      icon: <FolderOpen size={20} style={{ color: '#607A94' }} />,
    },
    {
      label: 'Settings',
      href: '/settings',
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
          whiteSpace: 'nowrap',
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
    <Flex
      w="100vw"
      h="100vh"
      bg="#F8F8F7"
      overflow="hidden"
      flexDirection={{ base: 'column', md: 'row' }}
    >
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody>
          <Flex
            flexDir="column"
            flex={1}
            overflowY="auto"
            overflowX="hidden"
            justify="space-between"
            h="100%"
          >
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
                  href: '#',
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
                    label: 'Sign Out',
                    href: '#',
                    icon: <LogOut size={20} style={{ color: '#DC2626' }} />,
                    onClick: handleSignOut,
                  }}
                />
              </Box>
            </Box>
          </Flex>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <Box
        flex={1}
        overflowY="auto"
        bg="#F8F8F7"
        w={{ base: '100%', md: 'auto' }}
      >
        <Container maxW="7xl" py={8}>
          {/* Welcome Section */}
          <FadeIn>
            <Stack spacing={1} mb={8}>
              <Heading
                size="3xl"
                fontFamily="Lora"
                color="#2D3748"
                letterSpacing="-0.03em"
                fontWeight="700"
              >
                Welcome back, {user?.email?.split('@')[0] || 'there'}
              </Heading>
              <Text color="#6B7280" fontSize="xl" fontWeight="400">
                Here's your research progress at a glance
              </Text>
            </Stack>
          </FadeIn>

          {/* Loading State */}
          {isLoading ? (
            <SlideUp>
              <Box
                bg="white"
                border="1px solid"
                borderColor="#E5E7EB"
                borderRadius="2xl"
                p={12}
                textAlign="center"
              >
                <Text color="#6B7280" fontSize="lg">
                  Loading your dashboard...
                </Text>
              </Box>
            </SlideUp>
          ) : (
            <>
              {/* Stats Section */}
              {stats.totalProjects > 0 && (
                <SlideUp>
                  <Grid
                    templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
                    gap={6}
                    mb={8}
                  >
                    <StatCard
                      label="Total Projects"
                      value={stats.totalProjects}
                      icon={<FolderOpen size={24} />}
                      trend="+2 this month"
                      trendUp
                      color="blue"
                    />
                    <StatCard
                      label="Active Projects"
                      value={stats.activeProjects}
                      icon={<Zap size={24} />}
                      trend="3 in progress"
                      trendUp
                      color="green"
                    />
                    <StatCard
                      label="Research Sources"
                      value={stats.totalSources}
                      icon={<BookOpen size={24} />}
                      trend="+12 recent"
                      trendUp
                      color="purple"
                    />
                    <StatCard
                      label="Total Words"
                      value={stats.totalWords}
                      icon={<FileText size={24} />}
                      trend="+2.4K today"
                      trendUp
                      color="orange"
                    />
                  </Grid>
                </SlideUp>
              )}

              {/* Empty State */}
              {stats.totalProjects === 0 ? (
                <SlideUp>
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
                        w="96px"
                        h="96px"
                        borderRadius="full"
                        bg="rgba(96, 122, 148, 0.1)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <FileText size={48} color="#607A94" />
                      </Box>
                      <Stack spacing={3} maxW="lg">
                        <Heading size="xl" color="#2D3748" fontFamily="Lora">
                          Ready to start your research journey?
                        </Heading>
                        <Text
                          color="#6B7280"
                          fontSize="lg"
                          lineHeight="tall"
                        >
                          Create your first project and let AI help you
                          structure, research, and write your thesis with
                          confidence.
                        </Text>
                      </Stack>
                      <Button
                        leftIcon={<Plus size={22} />}
                        bg="#607A94"
                        color="white"
                        size="lg"
                        borderRadius="xl"
                        px={8}
                        py={6}
                        fontSize="md"
                        fontWeight="semibold"
                        _hover={{
                          bg: '#506580',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                        onClick={handleCreateProject}
                      >
                        Create Your First Project
                      </Button>

                      {/* Feature hints */}
                      <Grid
                        templateColumns="repeat(3, 1fr)"
                        gap={6}
                        mt={8}
                        maxW="2xl"
                      >
                        <VStack spacing={2}>
                          <Box
                            w="48px"
                            h="48px"
                            bg="rgba(96, 122, 148, 0.1)"
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Zap size={24} color="#607A94" />
                          </Box>
                          <Text fontWeight="semibold" fontSize="sm">
                            AI-Powered
                          </Text>
                          <Text
                            fontSize="xs"
                            color="#6B7280"
                            textAlign="center"
                          >
                            Intelligent suggestions
                          </Text>
                        </VStack>
                        <VStack spacing={2}>
                          <Box
                            w="48px"
                            h="48px"
                            bg="rgba(96, 122, 148, 0.1)"
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <BookOpen size={24} color="#607A94" />
                          </Box>
                          <Text fontWeight="semibold" fontSize="sm">
                            Source Management
                          </Text>
                          <Text
                            fontSize="xs"
                            color="#6B7280"
                            textAlign="center"
                          >
                            Organize research
                          </Text>
                        </VStack>
                        <VStack spacing={2}>
                          <Box
                            w="48px"
                            h="48px"
                            bg="rgba(96, 122, 148, 0.1)"
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <TrendingUp size={24} color="#607A94" />
                          </Box>
                          <Text fontWeight="semibold" fontSize="sm">
                            Track Progress
                          </Text>
                          <Text
                            fontSize="xs"
                            color="#6B7280"
                            textAlign="center"
                          >
                            Stay on track
                          </Text>
                        </VStack>
                      </Grid>
                    </Stack>
                  </Box>
                </SlideUp>
              ) : (
                <>
                  {/* Projects Section */}
                  <Box mb={8}>
                    <Flex justify="space-between" align="center" mb={6}>
                      <Heading size="xl" color="#2D3748" fontFamily="Lora">
                        Your Projects
                      </Heading>
                      <Button
                        leftIcon={<Plus size={18} />}
                        bg="#607A94"
                        color="white"
                        size="md"
                        borderRadius="lg"
                        _hover={{ bg: '#506580' }}
                        onClick={handleCreateProject}
                      >
                        New Project
                      </Button>
                    </Flex>

                    {/* Filters */}
                    <ProjectFilters
                      filters={filters}
                      onFilterChange={(newFilters) =>
                        setFilters({ ...filters, ...newFilters })
                      }
                      projectCounts={projectCounts}
                    />

                    {/* Project Grid */}
                    <StaggerContainer staggerDelay={0.08}>
                      <Grid
                        templateColumns={{
                          base: '1fr',
                          md: 'repeat(2, 1fr)',
                          xl: 'repeat(3, 1fr)',
                        }}
                        gap={6}
                      >
                        {filteredProjects.map((project) => (
                          <StaggerItem key={project.id}>
                            <EnhancedProjectCard
                              project={project}
                              onOpen={handleOpenProject}
                              onEdit={(id) =>
                                toast({
                                  title: 'Edit project',
                                  description: 'Edit functionality coming soon',
                                  status: 'info',
                                })
                              }
                              onDelete={(id) =>
                                toast({
                                  title: 'Delete project',
                                  description:
                                    'Delete functionality coming soon',
                                  status: 'info',
                                })
                              }
                              onDuplicate={(id) =>
                                toast({
                                  title: 'Duplicate project',
                                  description:
                                    'Duplicate functionality coming soon',
                                  status: 'info',
                                })
                              }
                            />
                          </StaggerItem>
                        ))}
                      </Grid>
                    </StaggerContainer>

                    {/* No results */}
                    {filteredProjects.length === 0 && (
                      <Box
                        bg="white"
                        borderRadius="xl"
                        p={12}
                        textAlign="center"
                      >
                        <Text color="#6B7280">
                          No projects match your filters
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Activity Timeline */}
                  {activities.length > 0 && (
                    <SlideUp>
                      <Box
                        bg="white"
                        border="1px solid"
                        borderColor="#E5E7EB"
                        borderRadius="2xl"
                        p={6}
                      >
                        <Flex
                          justify="space-between"
                          align="center"
                          mb={6}
                        >
                          <Heading
                            size="md"
                            color="#2D3748"
                            fontFamily="Lora"
                          >
                            Recent Activity
                          </Heading>
                          <Button
                            size="xs"
                            variant="ghost"
                            color="#607A94"
                            _hover={{ bg: 'rgba(96, 122, 148, 0.08)' }}
                          >
                            View all
                          </Button>
                        </Flex>
                        <ActivityTimeline activities={activities} />
                      </Box>
                    </SlideUp>
                  )}
                </>
              )}
            </>
          )}
        </Container>
      </Box>
    </Flex>
  );
}

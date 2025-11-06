/**
 * Professional Dashboard - Completely Redesigned
 *
 * Compact, minimal, information-dense design inspired by Linear/Notion.
 * Focuses on professionalism and academic seriousness.
 */

import {
  Box,
  Flex,
  Text,
  Stack,
  HStack,
  VStack,
  Container,
  Button,
  useToast,
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
} from '@chakra-ui/react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Settings,
  LogOut,
  Plus,
  Search,
  MoreHorizontal,
  ChevronDown,
  Calendar,
  FileText,
  BarChart3,
} from 'lucide-react';
import type { Project, Source } from '@thesis-copilot/shared';
import { fetchProjects, fetchSources } from '../../lib/api';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '../../app/providers/firebase/AuthProvider';
import { motion } from 'framer-motion';

const ONBOARDING_STORAGE_KEY = 'thesis-copilot:onboarding';

export function ProfessionalDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, signOutUser } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'progress'>('recent');

  // Load data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);

      try {
        const projectData = await fetchProjects();
        setProjects(projectData);

        const sourcesPromises = projectData.map((p) =>
          fetchSources(p.id).catch(() => [] as Source[])
        );
        const sourcesArrays = await Promise.all(sourcesPromises);
        const sources = sourcesArrays.flat();
        setAllSources(sources);
      } catch (err) {
        toast({
          status: 'error',
          title: 'Failed to load projects',
          description: (err as Error).message,
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, [toast]);

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
    const totalSections = projects.reduce(
      (sum, p) => sum + (p.constitution?.outline.sections.length ?? 0),
      0
    );
    const totalSources = allSources.length;

    return { totalProjects, activeProjects, totalSections, totalSources };
  }, [projects, allSources]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [projects, searchQuery, sortBy]);

  // Sidebar links
  const links = [
    {
      label: 'Projects',
      href: '/dashboard',
      icon: <Home size={18} style={{ color: '#64748B' }} />,
    },
    {
      label: 'Workspace',
      href: '/workspace',
      icon: <FolderOpen size={18} style={{ color: '#64748B' }} />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings size={18} style={{ color: '#64748B' }} />,
    },
  ];

  const Logo = () => (
    <Flex as={RouterLink} to="/dashboard" align="center" gap={2} py={1}>
      <Box w="24px" h="24px" bg="#0F172A" borderRadius="md" flexShrink={0} />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          color: '#0F172A',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.875rem',
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
      <Box w="24px" h="24px" bg="#0F172A" borderRadius="md" flexShrink={0} />
    </Flex>
  );

  // Format date compactly
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate progress
  const getProgress = (project: Project) => {
    if (!project.constitution) return 5;
    const sectionCount = project.constitution.outline.sections.length;
    return Math.min((sectionCount / 10) * 100, 100);
  };

  return (
    <Flex
      w="100vw"
      h="100vh"
      bg="#FAFAFA"
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
              <Stack spacing={0.5} mt={6}>
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
                      size="xs"
                      name={user?.email || user?.uid}
                      bg="#64748B"
                      color="white"
                    />
                  ),
                }}
              />
              <Box mt={0.5}>
                <SidebarLink
                  link={{
                    label: 'Sign out',
                    href: '#',
                    icon: <LogOut size={18} style={{ color: '#EF4444' }} />,
                    onClick: handleSignOut,
                  }}
                />
              </Box>
            </Box>
          </Flex>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <Box flex={1} overflowY="auto" bg="#FAFAFA" w={{ base: '100%', md: 'auto' }}>
        <Container maxW="1400px" py={6} px={6}>
          {/* Compact Header */}
          <Flex justify="space-between" align="center" mb={6}>
            <HStack spacing={6}>
              <Text
                fontSize="lg"
                fontWeight="600"
                color="#0F172A"
                fontFamily="Inter"
              >
                Projects
              </Text>

              {/* Inline stats */}
              <HStack spacing={4} fontSize="sm" color="#64748B">
                <HStack spacing={1}>
                  <Text fontWeight="500">{stats.totalProjects}</Text>
                  <Text>total</Text>
                </HStack>
                <Box w="1px" h="12px" bg="#E2E8F0" />
                <HStack spacing={1}>
                  <Text fontWeight="500">{stats.activeProjects}</Text>
                  <Text>active</Text>
                </HStack>
                <Box w="1px" h="12px" bg="#E2E8F0" />
                <HStack spacing={1}>
                  <Text fontWeight="500">{stats.totalSections}</Text>
                  <Text>sections</Text>
                </HStack>
                <Box w="1px" h="12px" bg="#E2E8F0" />
                <HStack spacing={1}>
                  <Text fontWeight="500">{stats.totalSources}</Text>
                  <Text>sources</Text>
                </HStack>
              </HStack>
            </HStack>

            <Button
              leftIcon={<Plus size={16} />}
              size="sm"
              bg="#0F172A"
              color="white"
              fontSize="sm"
              fontWeight="500"
              borderRadius="md"
              px={3}
              _hover={{ bg: '#1E293B' }}
              onClick={handleCreateProject}
            >
              New project
            </Button>
          </Flex>

          {/* Toolbar */}
          <Flex gap={3} mb={4} align="center">
            <InputGroup maxW="320px" size="sm">
              <InputLeftElement pointerEvents="none">
                <Search size={14} color="#94A3B8" />
              </InputLeftElement>
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                border="1px solid"
                borderColor="#E2E8F0"
                borderRadius="md"
                fontSize="sm"
                _hover={{ borderColor: '#CBD5E1' }}
                _focus={{
                  borderColor: '#64748B',
                  boxShadow: '0 0 0 1px #64748B',
                }}
              />
            </InputGroup>

            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                rightIcon={<ChevronDown size={14} />}
                borderColor="#E2E8F0"
                fontSize="sm"
                fontWeight="500"
                color="#64748B"
                _hover={{ bg: 'white', borderColor: '#CBD5E1' }}
              >
                Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Progress'}
              </MenuButton>
              <MenuList fontSize="sm" minW="160px">
                <MenuItem onClick={() => setSortBy('recent')}>Recent</MenuItem>
                <MenuItem onClick={() => setSortBy('name')}>Name</MenuItem>
                <MenuItem onClick={() => setSortBy('progress')}>Progress</MenuItem>
              </MenuList>
            </Menu>
          </Flex>

          {/* Loading State */}
          {isLoading ? (
            <Box
              bg="white"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="lg"
              p={12}
              textAlign="center"
            >
              <Text color="#64748B" fontSize="sm">
                Loading projects...
              </Text>
            </Box>
          ) : filteredProjects.length === 0 && searchQuery ? (
            // No results
            <Box
              bg="white"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="lg"
              p={12}
              textAlign="center"
            >
              <Text color="#64748B" fontSize="sm">
                No projects found matching "{searchQuery}"
              </Text>
            </Box>
          ) : filteredProjects.length === 0 ? (
            // Empty state
            <Box
              bg="white"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="lg"
              p={12}
              textAlign="center"
            >
              <Stack spacing={3} align="center">
                <Box
                  w="48px"
                  h="48px"
                  bg="#F1F5F9"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FileText size={24} color="#64748B" />
                </Box>
                <Text fontSize="sm" fontWeight="500" color="#0F172A">
                  No projects yet
                </Text>
                <Text fontSize="sm" color="#64748B" maxW="sm">
                  Create your first thesis project to get started
                </Text>
                <Button
                  leftIcon={<Plus size={16} />}
                  size="sm"
                  bg="#0F172A"
                  color="white"
                  fontSize="sm"
                  fontWeight="500"
                  mt={2}
                  _hover={{ bg: '#1E293B' }}
                  onClick={handleCreateProject}
                >
                  Create project
                </Button>
              </Stack>
            </Box>
          ) : (
            // Projects Table
            <Box
              bg="white"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="lg"
              overflow="hidden"
            >
              <Table variant="simple" size="sm">
                <Thead bg="#F8FAFC">
                  <Tr>
                    <Th
                      color="#64748B"
                      fontSize="xs"
                      fontWeight="600"
                      textTransform="none"
                      letterSpacing="normal"
                      py={3}
                    >
                      Project
                    </Th>
                    <Th
                      color="#64748B"
                      fontSize="xs"
                      fontWeight="600"
                      textTransform="none"
                      letterSpacing="normal"
                    >
                      Status
                    </Th>
                    <Th
                      color="#64748B"
                      fontSize="xs"
                      fontWeight="600"
                      textTransform="none"
                      letterSpacing="normal"
                    >
                      Progress
                    </Th>
                    <Th
                      color="#64748B"
                      fontSize="xs"
                      fontWeight="600"
                      textTransform="none"
                      letterSpacing="normal"
                    >
                      Sections
                    </Th>
                    <Th
                      color="#64748B"
                      fontSize="xs"
                      fontWeight="600"
                      textTransform="none"
                      letterSpacing="normal"
                    >
                      Citation
                    </Th>
                    <Th
                      color="#64748B"
                      fontSize="xs"
                      fontWeight="600"
                      textTransform="none"
                      letterSpacing="normal"
                    >
                      Updated
                    </Th>
                    <Th w="40px"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredProjects.map((project, idx) => {
                    const sectionCount =
                      project.constitution?.outline.sections.length ?? 0;
                    const hasConstitution = !!project.constitution;
                    const progress = getProgress(project);

                    return (
                      <Tr
                        key={project.id}
                        cursor="pointer"
                        transition="background 0.15s"
                        _hover={{ bg: '#F8FAFC' }}
                        onClick={() => handleOpenProject(project.id)}
                        borderBottom={
                          idx === filteredProjects.length - 1
                            ? 'none'
                            : '1px solid #F1F5F9'
                        }
                      >
                        <Td py={3}>
                          <VStack align="start" spacing={0.5}>
                            <Text
                              fontSize="sm"
                              fontWeight="500"
                              color="#0F172A"
                              noOfLines={1}
                            >
                              {project.title}
                            </Text>
                            {project.description && (
                              <Text
                                fontSize="xs"
                                color="#64748B"
                                noOfLines={1}
                                maxW="400px"
                              >
                                {project.description}
                              </Text>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Badge
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            fontWeight="500"
                            bg={
                              hasConstitution
                                ? 'rgba(34, 197, 94, 0.1)'
                                : 'rgba(148, 163, 184, 0.1)'
                            }
                            color={hasConstitution ? '#15803D' : '#475569'}
                            textTransform="none"
                          >
                            {hasConstitution ? 'Active' : 'Setup'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Progress
                              value={progress}
                              size="xs"
                              w="60px"
                              borderRadius="full"
                              bg="#F1F5F9"
                              sx={{
                                '& > div': {
                                  backgroundColor: '#64748B',
                                },
                              }}
                            />
                            <Text fontSize="xs" color="#64748B" minW="32px">
                              {Math.round(progress)}%
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="#64748B">
                            {sectionCount}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="#64748B">
                            {project.citationStyle}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color="#94A3B8">
                            {formatDate(project.updatedAt)}
                          </Text>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MoreHorizontal size={16} />}
                              variant="ghost"
                              size="xs"
                              color="#94A3B8"
                              _hover={{ bg: '#F1F5F9', color: '#64748B' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <MenuList fontSize="sm" minW="140px">
                              <MenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenProject(project.id);
                                }}
                              >
                                Open
                              </MenuItem>
                              <MenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast({
                                    title: 'Coming soon',
                                    status: 'info',
                                  });
                                }}
                              >
                                Rename
                              </MenuItem>
                              <MenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast({
                                    title: 'Coming soon',
                                    status: 'info',
                                  });
                                }}
                              >
                                Duplicate
                              </MenuItem>
                              <MenuItem
                                color="red.600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast({
                                    title: 'Coming soon',
                                    status: 'info',
                                  });
                                }}
                              >
                                Delete
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </Container>
      </Box>
    </Flex>
  );
}

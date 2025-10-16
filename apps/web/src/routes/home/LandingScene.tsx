import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  Image,
  Badge
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { 
  Home, 
  BookOpen, 
  Sparkles, 
  Users, 
  ArrowRight,
  FileText,
  Search,
  Zap,
  Shield,
  Target,
  Brain,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../app/providers/firebase/AuthProvider';
import { TubelightNavbar } from '../../components/ui/TubelightNavbar';
import { AnimatedHero } from '../../components/ui/AnimatedHero';

type Phase = {
  number: number;
  title: string;
  duration: string;
  description: string;
  highlights: string[];
  color: string;
};

const phases: Phase[] = [
  {
    number: 1,
    title: 'The 5-Minute Foundation',
    duration: 'Phase 1',
    description: 'Establish your thesis roadmap with simple guided inputs.',
    highlights: [
      'Project setup wizard',
      'Thesis Constitution generation',
      'Clear outline created'
    ],
    color: 'brand'
  },
  {
    number: 2,
    title: 'Fueling Your Copilot',
    duration: 'Phase 2',
    description: 'Build your knowledge base with curated research sources.',
    highlights: [
      'Drag-and-drop uploads',
      'Automated summaries',
      'Centralized library'
    ],
    color: 'purple'
  },
  {
    number: 3,
    title: 'The Writing Loop',
    duration: 'Phase 3',
    description: 'Collaborate with AI to draft and refine each section.',
    highlights: ['AI-generated drafts', 'Transparent citations', 'Full editorial control'],
    color: 'blue'
  },
  {
    number: 4,
    title: 'The Final Mile',
    duration: 'Phase 4',
    description: 'Compile, format, and export your submission-ready thesis.',
    highlights: [
      'One-click compile',
      'Auto-formatted citations',
      'Professional document'
    ],
    color: 'green'
  }
];

export function LandingScene() {
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user);

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Features', url: '#features', icon: Sparkles },
    { name: 'How It Works', url: '#process', icon: BookOpen },
    { name: isAuthenticated ? 'Workspace' : 'Sign In', url: isAuthenticated ? '/workspace' : '/login', icon: Users }
  ];

  return (
    <Box w="full" bg="academic.background" position="relative">
      {/* Navigation */}
      <TubelightNavbar items={navItems} />
      
      <VStack spacing={0} align="stretch" w="full">
      {/* Hero Section - Animated */}
      <AnimatedHero />
      
      {/* Auth-specific CTAs */}
      <Box w="full" bg="academic.paper" py={8} borderBottom="1px solid" borderColor="academic.borderLight">
        <Container maxW="6xl">
          <VStack spacing={8}>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              {isAuthenticated ? (
                <>
                  <Button
                    as={RouterLink}
                    to="/onboarding"
                    size="lg"
                    colorScheme="brand"
                    rightIcon={<ArrowRight size={18} />}
                    isLoading={loading}
                  >
                    Begin onboarding
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/workspace"
                    variant="outline"
                    size="lg"
                  >
                    Go to workspace
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={RouterLink}
                    to="/login"
                    size="lg"
                    colorScheme="brand"
                    rightIcon={<ArrowRight size={18} />}
                    isLoading={loading}
                  >
                    Sign in to begin
                  </Button>
                  <Button
                    as={RouterLink}
                    to="#features"
                    variant="outline"
                    size="lg"
                  >
                    Learn more
                  </Button>
                </>
              )}
            </HStack>

            {/* Trust Indicators */}
            <HStack
              spacing={8}
              color="academic.secondaryText"
              fontSize="sm"
              flexWrap="wrap"
              justify="center"
            >
              <Flex align="center" gap={2}>
                <Shield size={16} />
                <Text>Source-Locked AI</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Award size={16} />
                <Text>Academic Integrity</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Users size={16} />
                <Text>Trusted by Scholars</Text>
              </Flex>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" py={{ base: 16, md: 24 }} px={{ base: 6, md: 12 }} bg="academic.paper">
        <Container maxW="6xl">
          <VStack spacing={16} align="stretch">
            {/* Section Header */}
            <VStack spacing={4} textAlign="center">
              <Heading
                size="2xl"
                letterSpacing="-0.02em"
                fontFamily="heading"
                color="academic.primaryText"
              >
                Powerful Features for Academic Success
              </Heading>
              <Text color="academic.secondaryText" fontSize="lg" maxW="2xl">
                Everything you need to write, refine, and submit your thesis with confidence
              </Text>
            </VStack>

            {/* Features Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              {[
                {
                  icon: Brain,
                  title: 'AI-Powered Drafting',
                  description: 'Generate contextual drafts grounded in your research sources with transparent citations'
                },
                {
                  icon: Search,
                  title: 'Source Management',
                  description: 'Organize and search through your research library with automated summaries'
                },
                {
                  icon: FileText,
                  title: 'Thesis Constitution',
                  description: 'Your personalized blueprint with outline, scope, and academic guidelines'
                },
                {
                  icon: Shield,
                  title: 'Academic Integrity',
                  description: 'All AI text is source-locked to prevent hallucination and ensure credibility'
                },
                {
                  icon: Target,
                  title: 'Citation Transparency',
                  description: 'Every claim is traceable with [CITE:sourceId] placeholders for easy reference'
                },
                {
                  icon: Zap,
                  title: 'Fast Iterations',
                  description: 'Quickly generate multiple drafts and revisions to find the perfect version'
                }
              ].map((feature, idx) => {
                const FeatureIcon = feature.icon;
                return (
                  <Box
                    key={idx}
                    bg="academic.background"
                    border="1px solid"
                    borderColor="academic.borderLight"
                    borderRadius="lg"
                    p={6}
                    transition="all 0.2s"
                    _hover={{
                      borderColor: 'academic.accent',
                      boxShadow: 'soft',
                      transform: 'translateY(-2px)'
                    }}
                  >
                    <VStack align="start" spacing={4}>
                      <Flex
                        w={12}
                        h={12}
                        align="center"
                        justify="center"
                        borderRadius="lg"
                        bg="rgba(96, 122, 148, 0.08)"
                        color="academic.accent"
                      >
                        <FeatureIcon size={24} />
                      </Flex>
                      <VStack align="start" spacing={2}>
                        <Heading size="sm" fontFamily="heading" color="academic.primaryText">
                          {feature.title}
                        </Heading>
                        <Text color="academic.secondaryText" fontSize="sm">
                          {feature.description}
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Process Section (Four Guided Phases) */}
      <Box id="process" py={{ base: 16, md: 24 }} px={{ base: 6, md: 12 }}>
        <Container maxW="6xl">
          <VStack spacing={12} align="stretch">
            <VStack spacing={4} textAlign="center">
              <Heading
                size="2xl"
                letterSpacing="-0.02em"
                fontFamily="heading"
                color="academic.primaryText"
              >
                Four Guided Phases
              </Heading>
              <Text color="academic.secondaryText" fontSize="lg" maxW="2xl">
                Each phase is designed to make your thesis writing simpler and more enjoyable
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {phases.map((phase) => {
                const phaseIcons = [FileText, Search, BookOpen, Award];
                const PhaseIcon = phaseIcons[phase.number - 1];
                
                return (
                  <Box
                    key={phase.number}
                    bg="academic.paper"
                    border="1px solid"
                    borderColor="academic.border"
                    borderRadius="lg"
                    p={8}
                    transition="all 0.2s"
                    _hover={{
                      borderColor: 'academic.accent',
                      boxShadow: 'soft'
                    }}
                  >
                    <VStack align="start" spacing={4}>
                      <HStack spacing={3}>
                        <Flex
                          w={12}
                          h={12}
                          align="center"
                          justify="center"
                          borderRadius="lg"
                          bg="academic.accent"
                          color="white"
                          flexShrink={0}
                        >
                          <PhaseIcon size={20} />
                        </Flex>
                        <VStack align="start" spacing={0}>
                          <Text color="academic.accent" fontSize="sm" fontWeight="semibold">
                            {phase.duration}
                          </Text>
                          <Heading size="md" fontFamily="heading" color="academic.primaryText">
                            {phase.title}
                          </Heading>
                        </VStack>
                      </HStack>

                      <Text color="academic.secondaryText" fontSize="sm">
                        {phase.description}
                      </Text>

                      <VStack align="start" spacing={2} w="full">
                        {phase.highlights.map((highlight, idx) => (
                          <Flex key={idx} align="center" gap={3}>
                            <Icon as={CheckIcon} color="academic.accent" boxSize="14px" />
                            <Text color="academic.secondaryText" fontSize="sm">{highlight}</Text>
                          </Flex>
                        ))}
                      </VStack>
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Value Proposition / Stats */}
      <Box
        bg="rgba(96, 122, 148, 0.03)"
        py={{ base: 16, md: 20 }}
        px={{ base: 6, md: 12 }}
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="academic.borderLight"
      >
        <Container maxW="5xl">
          <VStack spacing={12}>
            <VStack spacing={3} textAlign="center">
              <Heading
                size="xl"
                fontFamily="heading"
                color="academic.primaryText"
              >
                Why Choose Thesis Copilot?
              </Heading>
              <Text color="academic.secondaryText" fontSize="md">
                Built on principles of academic integrity and user empowerment
              </Text>
            </VStack>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={12}>
              {[
                {
                  icon: Shield,
                  label: 'Source-Locked AI',
                  value: 'All AI text grounded in your research',
                  stat: '100%'
                },
                {
                  icon: FileText,
                  label: 'Transparent Citations',
                  value: 'Every claim traceable to its source',
                  stat: 'Every Claim'
                },
                {
                  icon: Users,
                  label: 'Full Control',
                  value: 'You remain the author and editor',
                  stat: 'Your Thesis'
                }
              ].map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <VStack key={idx} spacing={4} align="center" textAlign="center">
                    <Flex
                      w={16}
                      h={16}
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg="academic.paper"
                      border="2px solid"
                      borderColor="academic.accent"
                      color="academic.accent"
                    >
                      <ItemIcon size={28} />
                    </Flex>
                    <VStack spacing={2}>
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color="academic.accent"
                        fontFamily="heading"
                      >
                        {item.stat}
                      </Text>
                      <VStack spacing={1}>
                        <Text fontWeight="semibold" color="academic.primaryText" fontSize="md">
                          {item.label}
                        </Text>
                        <Text color="academic.secondaryText" fontSize="sm">
                          {item.value}
                        </Text>
                      </VStack>
                    </VStack>
                  </VStack>
                );
              })}
            </Grid>

            {/* Additional Benefits */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} pt={8} w="full">
              {[
                { icon: Clock, text: 'Save 50+ hours on your thesis' },
                { icon: TrendingUp, text: 'Iterative refinement process' },
                { icon: Brain, text: 'Learn as you write with AI guidance' },
                { icon: Award, text: 'Maintain academic standards' }
              ].map((benefit, idx) => {
                const BenefitIcon = benefit.icon;
                return (
                  <Flex
                    key={idx}
                    align="center"
                    gap={3}
                    p={4}
                    bg="academic.paper"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="academic.borderLight"
                  >
                    <Flex
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      borderRadius="lg"
                      bg="rgba(96, 122, 148, 0.08)"
                      color="academic.accent"
                      flexShrink={0}
                    >
                      <BenefitIcon size={18} />
                    </Flex>
                    <Text color="academic.secondaryText" fontSize="sm" fontWeight="medium">
                      {benefit.text}
                    </Text>
                  </Flex>
                );
              })}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Testimonials / Social Proof */}
      <Box py={{ base: 16, md: 24 }} px={{ base: 6, md: 12 }} bg="academic.paper">
        <Container maxW="5xl">
          <VStack spacing={12}>
            <VStack spacing={3} textAlign="center">
              <Heading
                size="xl"
                fontFamily="heading"
                color="academic.primaryText"
              >
                Trusted by Graduate Students Worldwide
              </Heading>
              <Text color="academic.secondaryText" fontSize="md">
                See what students are saying about their experience
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {[
                {
                  quote: "Thesis Copilot helped me organize my chaotic research into a structured outline. The Constitution feature is a game-changer!",
                  author: "Sarah M.",
                  role: "PhD Candidate, Psychology"
                },
                {
                  quote: "The source-locked AI gives me confidence that I'm maintaining academic integrity while getting the help I need.",
                  author: "James L.",
                  role: "Master's Student, Computer Science"
                },
                {
                  quote: "I saved weeks of work with the AI-powered drafting. It's like having a research assistant available 24/7.",
                  author: "Maria G.",
                  role: "Doctoral Researcher, Sociology"
                }
              ].map((testimonial, idx) => (
                <Box
                  key={idx}
                  p={6}
                  bg="academic.background"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="academic.borderLight"
                >
                  <VStack align="start" spacing={4}>
                    <Text
                      color="academic.primaryText"
                      fontSize="sm"
                      lineHeight="tall"
                      fontStyle="italic"
                    >
                      "{testimonial.quote}"
                    </Text>
                    <VStack align="start" spacing={0}>
                      <Text
                        fontWeight="semibold"
                        color="academic.primaryText"
                        fontSize="sm"
                      >
                        {testimonial.author}
                      </Text>
                      <Text color="academic.secondaryText" fontSize="xs">
                        {testimonial.role}
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Final CTA Section */}
      <Box
        py={{ base: 16, md: 24 }}
        px={{ base: 6, md: 12 }}
        bg="rgba(96, 122, 148, 0.05)"
        position="relative"
        overflow="hidden"
      >
        {/* Background decoration */}
        <Box
          position="absolute"
          bottom="-10%"
          left="-10%"
          width="500px"
          height="500px"
          borderRadius="full"
          bg="academic.accent"
          opacity={0.03}
          filter="blur(80px)"
        />
        
        <Container maxW="4xl" position="relative" zIndex={1}>
          <VStack spacing={8} textAlign="center">
            <VStack spacing={4}>
              <Heading
                size="2xl"
                fontFamily="heading"
                color="academic.primaryText"
                letterSpacing="-0.02em"
              >
                Ready to Transform Your Thesis Writing?
              </Heading>
              <Text color="academic.secondaryText" fontSize="lg" maxW="2xl">
                Join students who are writing better theses with AI guidance. 
                Start your journey from blank page to polished draft today.
              </Text>
            </VStack>

            <HStack spacing={4} pt={4} flexWrap="wrap" justify="center">
              {isAuthenticated ? (
                <>
                  <Button
                    as={RouterLink}
                    to="/onboarding"
                    size="lg"
                    colorScheme="brand"
                    rightIcon={<ArrowRight size={18} />}
                  >
                    Start your thesis
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/workspace"
                    variant="outline"
                    size="lg"
                  >
                    Go to workspace
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={RouterLink}
                    to="/login"
                    size="lg"
                    colorScheme="brand"
                    rightIcon={<ArrowRight size={18} />}
                    isLoading={loading}
                  >
                    Sign in to get started
                  </Button>
                  <Button
                    as={RouterLink}
                    to="#features"
                    variant="ghost"
                    size="lg"
                  >
                    Learn more
                  </Button>
                </>
              )}
            </HStack>

            {/* Trust badges */}
            <HStack
              spacing={6}
              pt={8}
              opacity={0.6}
              fontSize="xs"
              color="academic.secondaryText"
              flexWrap="wrap"
              justify="center"
            >
              <Flex align="center" gap={1}>
                <CheckIcon w={3} h={3} />
                <Text>No credit card required</Text>
              </Flex>
              <Flex align="center" gap={1}>
                <CheckIcon w={3} h={3} />
                <Text>Free to start</Text>
              </Flex>
              <Flex align="center" gap={1}>
                <CheckIcon w={3} h={3} />
                <Text>Academic integrity guaranteed</Text>
              </Flex>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </VStack>
    </Box>
  );
}

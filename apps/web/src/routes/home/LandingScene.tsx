import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

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

  return (
    <VStack spacing={0} align="stretch" w="full">
      {/* Hero Section */}
      <Box
        w="full"
        bg="linear-gradient(135deg, rgba(91, 130, 245, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)"
        py={{ base: 16, md: 20 }}
        px={{ base: 6, md: 12 }}
        borderBottom="1px solid rgba(91, 130, 245, 0.1)"
      >
        <VStack spacing={8} maxW="3xl" mx="auto" align="center" textAlign="center">
          <VStack spacing={4}>
            <Heading
              size="3xl"
              letterSpacing="-0.04em"
              bgGradient="linear(to-r, brand.600, brand.500)"
              bgClip="text"
              color="gray.900"
            >
              From Blank Page to Polished Draft
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600" maxW="2xl">
              Thesis Copilot transforms academic writing from overwhelming to achievable. Get expert guidance
              every step of the way—your copilot, not your autopilot.
            </Text>
          </VStack>

          <HStack spacing={4} flexWrap="wrap" justify="center" pt={4}>
            {isAuthenticated ? (
              <>
                <Button
                  as={RouterLink}
                  to="/onboarding"
                  size="lg"
                  colorScheme="brand"
                  boxShadow="0 4px 12px rgba(91, 130, 245, 0.25)"
                  isLoading={loading}
                >
                  Begin onboarding
                </Button>
                <Button
                  as={RouterLink}
                  to="/workspace"
                  variant="outline"
                  size="lg"
                  colorScheme="brand"
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
                  boxShadow="0 4px 12px rgba(91, 130, 245, 0.25)"
                  isLoading={loading}
                >
                  Sign in to begin
                </Button>
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="outline"
                  size="lg"
                  colorScheme="brand"
                >
                  Learn more
                </Button>
              </>
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Phases Grid */}
      <Box py={{ base: 16, md: 20 }} px={{ base: 6, md: 12 }}>
        <VStack spacing={12} align="stretch">
          <VStack spacing={2} textAlign="center">
            <Heading size="2xl" letterSpacing="-0.04em" color="gray.900">
              Four Guided Phases
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Each phase is designed to make your thesis writing simpler and more enjoyable
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {phases.map((phase) => (
              <Box
                key={phase.number}
                bg="white"
                border="1px solid"
                borderColor="surface.border"
                borderRadius="xl"
                p={8}
                transition="all 0.3s"
                _hover={{
                  borderColor: 'brand.400',
                  bg: 'surface.cardHover',
                  boxShadow: '0 12px 24px rgba(91, 130, 245, 0.12)'
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
                      bgGradient={`linear(to-br, ${phase.color}.500, ${phase.color}.600)`}
                      flexShrink={0}
                    >
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {phase.number}
                      </Text>
                    </Flex>
                    <VStack align="start" spacing={0}>
                      <Text color="brand.600" fontSize="sm" fontWeight="semibold">
                        {phase.duration}
                      </Text>
                      <Heading size="md" letterSpacing="-0.02em" color="gray.900">
                        {phase.title}
                      </Heading>
                    </VStack>
                  </HStack>

                  <Text color="gray.600" fontSize="sm">
                    {phase.description}
                  </Text>

                  <VStack align="start" spacing={2} w="full">
                    {phase.highlights.map((highlight, idx) => (
                      <HStack key={idx} spacing={3} color="gray.700" fontSize="sm">
                        <Icon as={CheckIcon} color="brand.500" w={4} h={4} />
                        <Text>{highlight}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Value Proposition */}
      <Box
        bg="linear-gradient(135deg, rgba(91, 130, 245, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)"
        py={{ base: 12, md: 16 }}
        px={{ base: 6, md: 12 }}
        borderTop="1px solid rgba(91, 130, 245, 0.08)"
        borderBottom="1px solid rgba(91, 130, 245, 0.08)"
      >
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8} maxW="4xl" mx="auto">
          {[
            {
              label: 'Source-Locked',
              value: 'All AI text grounded in your research',
              icon: '🔐'
            },
            {
              label: 'Transparent Citations',
              value: 'Every claim traceable to its source',
              icon: '📌'
            },
            {
              label: 'Full Control',
              value: 'You remain the author and editor',
              icon: '✏️'
            }
          ].map((item, idx) => (
            <VStack key={idx} spacing={3} align="center" textAlign="center">
              <Text fontSize="3xl">{item.icon}</Text>
              <VStack spacing={1}>
                <Text fontWeight="bold" color="brand.600">
                  {item.label}
                </Text>
                <Text color="gray.600" fontSize="sm">
                  {item.value}
                </Text>
              </VStack>
            </VStack>
          ))}
        </Grid>
      </Box>

      {/* CTA Footer */}
      <Box py={{ base: 12, md: 16 }} px={{ base: 6, md: 12 }} textAlign="center">
        <VStack spacing={6}>
          <VStack spacing={2}>
            <Heading size="lg" color="gray.900">Ready to transform your thesis writing?</Heading>
            <Text color="gray.600">
              Join students who are writing better theses with AI guidance.
            </Text>
          </VStack>

          {isAuthenticated ? (
            <Button
              as={RouterLink}
              to="/onboarding"
              size="lg"
              colorScheme="brand"
              boxShadow="0 4px 12px rgba(91, 130, 245, 0.25)"
            >
              Start your thesis
            </Button>
          ) : (
            <Button
              as={RouterLink}
              to="/login"
              size="lg"
              colorScheme="brand"
              boxShadow="0 4px 12px rgba(91, 130, 245, 0.25)"
              isLoading={loading}
            >
              Sign in to get started
            </Button>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}

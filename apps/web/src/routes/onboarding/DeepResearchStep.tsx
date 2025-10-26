import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  Heading,
  Divider,
  Progress,
  Badge,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Spinner
} from '@chakra-ui/react';
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, DownloadIcon, InfoIcon } from '@chakra-ui/icons';
import {
  generateResearchPlan,
  refineResearchPlan,
  searchAcademicPapers,
  type ResearchPlan,
  type AcademicPaper
} from '../../lib/deep-research-api';
import { PaperCard } from '../../components/research/PaperCard';
import { PageShell } from '../shared/PageShell';
import { useOnboarding, useOnboardingStepNavigation } from './OnboardingContext';

type ResearchStatus =
  | 'idle'
  | 'generating-plan'
  | 'plan-ready'
  | 'searching-papers'
  | 'papers-ready';

export function DeepResearchStep() {
  const navigate = useNavigate();
  const { project } = useOnboarding();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ResearchStatus>('idle');
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [refinementFeedback, setRefinementFeedback] = useState('');

  const toast = useToast();

  // Step 1: Generate research plan
  const handleGeneratePlan = async () => {
    if (!query.trim()) {
      toast({
        title: 'Query required',
        description: 'Please enter a research query',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    if (!project) {
      toast({
        title: 'No project found',
        description: 'Please complete project setup first',
        status: 'error',
        duration: 3000
      });
      return;
    }

    setStatus('generating-plan');
    try {
      const plan = await generateResearchPlan(query, project.id);
      console.log('Received plan:', plan);

      if (!plan || !plan.subQuestions) {
        throw new Error('Invalid plan structure received from API');
      }

      setResearchPlan(plan);
      setStatus('plan-ready');
      toast({
        title: 'Research plan generated',
        description: `Created ${plan.subQuestions.length} sub-questions`,
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to generate plan:', error);
      toast({
        title: 'Plan generation failed',
        description: (error as Error).message,
        status: 'error',
        duration: 5000
      });
      setStatus('idle');
    }
  };

  // Step 2: Refine research plan
  const handleRefinePlan = async () => {
    if (!researchPlan || !refinementFeedback.trim()) {
      return;
    }

    if (!project) {
      toast({
        title: 'No project found',
        description: 'Please complete project setup first',
        status: 'error',
        duration: 3000
      });
      return;
    }

    setStatus('generating-plan');
    try {
      const refinedPlan = await refineResearchPlan(
        researchPlan.id,
        researchPlan,
        refinementFeedback,
        project.id
      );
      setResearchPlan(refinedPlan);
      setRefinementFeedback('');
      setStatus('plan-ready');
      toast({
        title: 'Plan refined',
        description: 'Research plan updated based on your feedback',
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to refine plan:', error);
      toast({
        title: 'Plan refinement failed',
        description: (error as Error).message,
        status: 'error',
        duration: 5000
      });
      setStatus('plan-ready');
    }
  };

  // Step 3: Search for academic papers with rate limiting and AI relevance filtering
  const handleSearchPapers = async () => {
    if (!researchPlan || !project) return;

    setStatus('searching-papers');
    setSearchProgress(0);
    setPapers([]);

    try {
      const allPapers: AcademicPaper[] = [];
      const totalQueries = researchPlan.subQuestions.reduce(
        (sum, sq) => sum + sq.searchQueries.length,
        0
      );
      let completed = 0;

      // Research context for AI relevance filtering
      const researchContext = {
        mainQuery: researchPlan.mainQuestion,
        domain: project.topic // e.g., "AI-powered employee well-being monitoring platform"
      };

      // Search for each sub-question's queries with rate limiting
      for (const subQuestion of researchPlan.subQuestions) {
        for (const searchQuery of subQuestion.searchQueries) {
          try {
            // Add 3 second delay between requests to respect Semantic Scholar's rate limits
            if (completed > 0) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }

            const results = await searchAcademicPapers(
              searchQuery,
              {
                limit: 10, // Increased from 5 to get more papers per query
                minCitations: 10 // Balanced - not too high to exclude recent work
              },
              researchContext // Pass research context for AI filtering
            );
            allPapers.push(...results);
            completed++;
            setSearchProgress((completed / totalQueries) * 100);
          } catch (error) {
            console.error(`Search failed for query: ${searchQuery}`, error);
            completed++;
            setSearchProgress((completed / totalQueries) * 100);
            // Continue with other queries even if one fails
          }
        }
      }

      // Deduplicate by paper ID
      const uniquePapers = Array.from(
        new Map(allPapers.map(p => [p.id, p])).values()
      );

      // Sort by citation count (descending)
      uniquePapers.sort((a, b) => b.citationCount - a.citationCount);

      setPapers(uniquePapers);
      setStatus('papers-ready');

      if (uniquePapers.length === 0) {
        toast({
          title: 'No papers found',
          description: 'Try refining your research query or reducing minimum citations',
          status: 'warning',
          duration: 5000
        });
      } else {
        toast({
          title: 'Papers found',
          description: `Found ${uniquePapers.length} relevant academic papers`,
          status: 'success',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Paper search failed:', error);
      toast({
        title: 'Search failed',
        description: (error as Error).message,
        status: 'error',
        duration: 5000
      });
      setStatus('plan-ready');
    }
  };

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    navigate('/onboarding/start');
    return false;
  }, [navigate]);

  const handleNext = useCallback(() => {
    if (status === 'papers-ready') {
      navigate('/onboarding/sources');
    }
    return false;
  }, [navigate, status]);

  const navigationHandlers = useMemo(
    () => ({
      onPrevious: handlePrevious,
      onNext: handleNext
    }),
    [handleNext, handlePrevious]
  );

  useOnboardingStepNavigation(navigationHandlers);

  return (
    <PageShell
      title="Step 2: Deep Research"
      description="Let AI find and analyze relevant academic papers for your thesis. Enter your research topic, review the AI-generated plan, and discover papers you can download and add to your knowledge base."
    >
      <VStack spacing={8} align="stretch">

        {/* Step 1: Research Query */}
        <Box>
          <VStack spacing={4} align="stretch">
            <Text fontWeight="semibold">Step 1: Enter your research query</Text>
            <HStack>
              <Input
                placeholder="E.g., 'Impact of machine learning on healthcare diagnostics'"
                value={query}
                onChange={e => setQuery(e.target.value)}
                size="lg"
                isDisabled={status !== 'idle' && status !== 'plan-ready'}
              />
              <Button
                leftIcon={<SearchIcon />}
                colorScheme="blue"
                onClick={handleGeneratePlan}
                isLoading={status === 'generating-plan'}
                isDisabled={!query.trim() || (status !== 'idle' && status !== 'plan-ready')}
                minW="200px"
              >
                Generate Plan
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Step 2: Research Plan */}
        {researchPlan && (
          <>
            <Divider />
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontWeight="semibold">Step 2: Review research plan</Text>
                <Badge colorScheme="green" fontSize="sm">
                  {researchPlan.subQuestions.length} sub-questions
                </Badge>
              </HStack>

              <Alert status="info" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Research Plan Generated</AlertTitle>
                  <AlertDescription>
                    We've broken down your query into focused sub-questions. Review them below and
                    provide feedback if needed.
                  </AlertDescription>
                </Box>
              </Alert>

              <Accordion allowMultiple defaultIndex={[0]}>
                {researchPlan.subQuestions.map((sq, index) => (
                  <AccordionItem key={sq.id}>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">
                            {index + 1}. {sq.question}
                          </Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                          Search Queries:
                        </Text>
                        {sq.searchQueries.map((query, idx) => (
                          <Text key={idx} fontSize="sm" pl={4}>
                            • {query}
                          </Text>
                        ))}
                        <Text fontSize="sm" fontWeight="semibold" color="gray.600" mt={2}>
                          Expected Sources:
                        </Text>
                        {sq.expectedSources.map((source, idx) => (
                          <Text key={idx} fontSize="sm" pl={4}>
                            • {source}
                          </Text>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Plan Refinement */}
              {status === 'plan-ready' && (
                <Box mt={4}>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Want to refine the plan? Provide feedback below:
                    </Text>
                    <Input
                      placeholder="E.g., 'Focus more on recent papers from 2020 onwards'"
                      value={refinementFeedback}
                      onChange={e => setRefinementFeedback(e.target.value)}
                    />
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={handleRefinePlan}
                        isDisabled={!refinementFeedback.trim()}
                      >
                        Refine Plan
                      </Button>
                      <Button size="sm" colorScheme="green" onClick={handleSearchPapers}>
                        Looks Good - Search Papers
                        {researchPlan && ` (${researchPlan.subQuestions.reduce((sum, sq) => sum + sq.searchQueries.length, 0)} queries)`}
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Step 3: Paper Search Progress */}
        {status === 'searching-papers' && (
          <>
            <Divider />
            <Box>
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Spinner size="sm" />
                  <Text fontWeight="semibold">Step 3: Searching for papers...</Text>
                </HStack>
                <Progress value={searchProgress} colorScheme="blue" hasStripe isAnimated />
                <Text fontSize="sm" color="gray.600">
                  {Math.round(searchProgress)}% complete
                </Text>
              </VStack>
            </Box>
          </>
        )}

        {/* Step 3: Papers Found - Display with Guidance */}
        {status === 'papers-ready' && papers.length > 0 && (
            <>
              <Divider />
              <Box>
                <VStack spacing={4} align="stretch" mb={6}>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Step 3: Review papers</Text>
                    <Badge colorScheme="blue" fontSize="sm">
                      {papers.length} papers found
                    </Badge>
                  </HStack>

                  <Alert status="info" variant="left-accent">
                    <AlertIcon as={InfoIcon} />
                    <Box>
                      <AlertTitle fontSize="md">How to Use These Papers</AlertTitle>
                      <AlertDescription fontSize="sm">
                        <VStack align="start" spacing={2} mt={2}>
                          <Text>1. Review the abstracts below to find relevant papers</Text>
                          <Text>2. Click <strong>"Download PDF"</strong> to save papers to your computer</Text>
                          <Text>3. Upload PDFs via the <strong>Sources</strong> page (next step) to add them to your knowledge base</Text>
                          <Text fontWeight="medium" color="blue.700" mt={2}>
                            Papers with abstracts only (no PDF) can still provide useful context - read them on Semantic Scholar!
                          </Text>
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={6}>
                  {papers.map(paper => (
                    <PaperCard
                      key={paper.id}
                      paper={paper}
                    />
                  ))}
                </SimpleGrid>

                <Button
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  leftIcon={<DownloadIcon />}
                  onClick={() => navigate('/onboarding/sources')}
                >
                  Continue to Upload Sources
                </Button>
              </Box>
            </>
          )}

        {/* Skip Button */}
        {status === 'idle' && (
          <Box pt={4}>
            <Button variant="link" colorScheme="gray" onClick={() => navigate('/onboarding/sources')}>
              Skip deep research for now
            </Button>
          </Box>
        )}
      </VStack>
    </PageShell>
  );
}

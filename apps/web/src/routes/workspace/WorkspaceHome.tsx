import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
  HStack
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningTwoIcon } from '@chakra-ui/icons';
import type { Project, Source, ThesisSection } from '@thesis-copilot/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchProjects,
  fetchSources,
  submitRetrieval,
  updateProject,
  saveDraft,
  generateDraft,
  downloadProjectDocx,
  fetchDraft
} from '../../lib/api';
import { PageShell } from '../shared/PageShell';
import { useStreamingDraft } from '../../lib/hooks/useStreamingDraft';

type SectionStatus = 'NEEDS_SOURCES' | 'READY_TO_DRAFT';

type ReadinessItem = {
  label: string;
  description: string;
  complete: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

type AddSectionFormValues = {
  title: string;
  objective: string;
  expectedLength?: number;
};

type AddSectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: AddSectionFormValues) => Promise<void>;
  isSaving: boolean;
};

function AddSectionModal({ isOpen, onClose, onSave, isSaving }: AddSectionModalProps) {
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [expectedLength, setExpectedLength] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setObjective('');
      setExpectedLength('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !objective.trim()) {
      return;
    }
    await onSave({
      title: title.trim(),
      objective: objective.trim(),
      expectedLength: expectedLength ? Number(expectedLength) : undefined
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent bg="white" border="1px solid" borderColor="gray.200">
        <ModalHeader color="gray.800">Add outline section</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Section title</FormLabel>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., Literature Review"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Objective</FormLabel>
              <Textarea
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                rows={4}
                placeholder="Define what this section should accomplish for your thesis."
              />
            </FormControl>
            <FormControl>
              <FormLabel>Target length (words)</FormLabel>
              <NumberInput
                min={0}
                value={expectedLength}
                onChange={(value) => setExpectedLength(value)}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isDisabled={!title.trim() || !objective.trim()}
            isLoading={isSaving}
          >
            Save section
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function deriveSectionStatus(hasReadySources: boolean): SectionStatus {
  if (!hasReadySources) {
    return 'NEEDS_SOURCES';
  }
  return 'READY_TO_DRAFT';
}

function getWordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(word => word.length > 0).length;
}

function statusLabel(status: SectionStatus) {
  if (status === 'READY_TO_DRAFT') {
    return { label: 'Ready to draft', color: 'green' as const };
  }
  return { label: 'Needs sources', color: 'yellow' as const };
}

type SectionOutlineItemProps = {
  section: ThesisSection;
  index: number;
  isActive: boolean;
  status: SectionStatus;
  onSelect: (sectionId: string) => void;
  wordCount?: number;
};

function SectionOutlineItem({ section, index, isActive, status, onSelect, wordCount = 0 }: SectionOutlineItemProps) {
  const statusMeta = statusLabel(status);
  const hasTarget = Boolean(section.expectedLength);
  const progress = hasTarget && section.expectedLength ? Math.min((wordCount / section.expectedLength) * 100, 100) : 0;

  return (
    <Box
      px={4}
      py={3}
      borderRadius="lg"
      border="1px solid"
      borderColor={isActive ? 'blue.400' : 'gray.200'}
      bg={isActive ? 'blue.50' : 'white'}
      cursor="pointer"
      transition="all 0.2s"
      onClick={() => onSelect(section.id)}
      _hover={{
        borderColor: 'blue.300',
        shadow: 'sm'
      }}
    >
      <Stack spacing={2}>
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="gray.500" fontWeight="medium">
            Section {index + 1}
          </Text>
          <Badge colorScheme={statusMeta.color} size="sm">
            {statusMeta.label}
          </Badge>
        </Flex>
        <Text fontWeight="semibold" color="gray.800">
          {section.title}
        </Text>
        <Text color="gray.600" fontSize="sm" noOfLines={2}>
          {section.objective}
        </Text>
        {hasTarget && (
          <Stack spacing={1}>
            <Flex justify="space-between" fontSize="xs" color="gray.500">
              <Text>{wordCount} words</Text>
              <Text>{section.expectedLength} target</Text>
            </Flex>
            <Box w="100%" h="4px" bg="gray.200" borderRadius="full" overflow="hidden">
              <Box
                h="100%"
                w={`${progress}%`}
                bg={progress >= 100 ? 'green.400' : progress >= 50 ? 'blue.400' : 'yellow.400'}
                transition="width 0.3s"
              />
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function ReadinessChecklist({ items }: { items: ReadinessItem[] }) {
  return (
    <VStack spacing={3} align="stretch">
      {items.map((item) => (
        <Flex
          key={item.label}
          align="flex-start"
          gap={3}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          px={4}
          py={3}
          bg="white"
        >
          <Box pt={1}>
            {item.complete ? (
              <CheckCircleIcon color="green.500" boxSize={4} />
            ) : (
              <WarningTwoIcon color="yellow.500" boxSize={4} />
            )}
          </Box>
          <Stack spacing={1} flex="1">
            <Text fontWeight="semibold" color="gray.800">
              {item.label}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {item.description}
            </Text>
            {!item.complete && item.onAction && item.actionLabel ? (
              <Button variant="outline" colorScheme="blue" size="xs" onClick={item.onAction}>
                {item.actionLabel}
              </Button>
            ) : null}
          </Stack>
        </Flex>
      ))}
    </VStack>
  );
}

export function WorkspaceHome() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const addSectionModal = useDisclosure();

  const [loadingProject, setLoadingProject] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const [sectionWordCounts, setSectionWordCounts] = useState<Record<string, number>>({});

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [draftingPreview, setDraftingPreview] = useState(false);
  const [draftPreview, setDraftPreview] = useState<string>('');
  const [retrievalPreview, setRetrievalPreview] = useState<string[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [savingSection, setSavingSection] = useState(false);
  const [generatingInitialDraft, setGeneratingInitialDraft] = useState(false);
  const [isExportingProject, setIsExportingProject] = useState(false);

  const { generateDraftStreaming } = useStreamingDraft({
    onComplete: async (fullText) => {
      // Save the generated draft to Firestore
      if (project && selectedSection) {
        try {
          await saveDraft(project.id, selectedSection.id, {
            html: fullText,
            citations: [],
            annotations: []
          });

          toast({
            status: 'success',
            title: 'Draft generated',
            description: 'Your draft has been created successfully!'
          });

          // Navigate to editor
          navigate(
            `/workspace/drafting?projectId=${encodeURIComponent(project.id)}&sectionId=${encodeURIComponent(
              selectedSection.id
            )}`
          );
        } catch (error) {
          toast({
            status: 'error',
            title: 'Failed to save draft',
            description: (error as Error).message
          });
        }
      }
    },
    onError: (error) => {
      toast({
        status: 'error',
        title: 'Draft generation failed',
        description: error
      });
    }
  });

  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProject(true);
      try {
        const data = await fetchProjects();
        setProjects(data);

        // If projectId is provided in URL, use that project
        if (projectIdFromUrl) {
          const selectedProject = data.find((p) => p.id === projectIdFromUrl);
          if (selectedProject) {
            setProject(selectedProject);
          } else {
            // Project ID not found, fall back to first project
            setProject(data.length > 0 ? data[0] : null);
          }
        } else if (data.length > 0) {
          setProject(data[0]);
        } else {
          setProject(null);
        }
        setProjectError(null);
      } catch (error) {
        setProjectError((error as Error).message);
        setProject(null);
      } finally {
        setLoadingProject(false);
      }
    };

    void loadProjects();
  }, [projectIdFromUrl]);

  const sections = useMemo<ThesisSection[]>(
    () => project?.constitution?.outline.sections ?? [],
    [project?.constitution]
  );

  useEffect(() => {
    if (!selectedSectionId && sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? null;

  const reloadSources = useCallback(async () => {
    if (!project) {
      setSources([]);
      return;
    }

    setLoadingSources(true);
    try {
      const data = await fetchSources(project.id);
      setSources(data);
      setSourcesError(null);
    } catch (error) {
      setSourcesError((error as Error).message);
    } finally {
      setLoadingSources(false);
    }
  }, [project]);

  useEffect(() => {
    void reloadSources();
  }, [reloadSources]);

  // Load word counts for all sections
  useEffect(() => {
    const loadWordCounts = async () => {
      if (!project || sections.length === 0) {
        setSectionWordCounts({});
        return;
      }

      const counts: Record<string, number> = {};

      // Fetch drafts for all sections in parallel
      await Promise.all(
        sections.map(async (section) => {
          try {
            const draft = await fetchDraft(project.id, section.id);
            counts[section.id] = draft?.html ? getWordCount(draft.html) : 0;
          } catch (error) {
            console.error(`Failed to fetch draft for section ${section.id}:`, error);
            counts[section.id] = 0;
          }
        })
      );

      setSectionWordCounts(counts);
    };

    void loadWordCounts();
  }, [project, sections]);

  const hasSources = sources.length > 0;
  const readySources = sources.filter((source) => source.status === 'READY');
  const ingestingSources = sources.filter((source) => source.status === 'PROCESSING');
  const hasReadySources = readySources.length > 0;

  const sectionStatus = deriveSectionStatus(hasReadySources);
  const sectionStatusMeta = useMemo(() => statusLabel(sectionStatus), [sectionStatus]);

  const readinessChecklist = useMemo<ReadinessItem[]>(
    () => [
      {
        label: 'Upload supporting sources',
        description:
          'Upload PDFs or notes that contain evidence for this section. They will be summarized automatically.',
        complete: hasSources,
        actionLabel: 'Open source manager',
        onAction: () => navigate('/workspace/sources')
      },
      {
        label: ingestingSources.length > 0 ? 'Ingestion in progress' : 'Sources processed',
        description: ingestingSources.length
          ? 'We are extracting text and embeddings. Refresh in a moment.'
          : 'Your sources are ready for retrieval and drafting.',
        complete: hasReadySources,
        actionLabel: ingestingSources.length ? undefined : 'Refresh status',
        onAction: ingestingSources.length ? undefined : () => void reloadSources()
      },
      {
        label: 'Generate AI draft preview',
        description:
          'Run a quick preview to see how the system will use your sources before opening the writer.',
        complete: Boolean(draftPreview),
        actionLabel: 'Preview section',
        onAction: selectedSection ? () => handleDraftPreview(selectedSection) : undefined
      }
    ],
    [hasSources, ingestingSources.length, hasReadySources, draftPreview, navigate, selectedSection, reloadSources]
  );

  const handleDraftPreview = useCallback(
    async (section: ThesisSection) => {
      if (!project) {
        return;
      }
      if (!hasReadySources) {
        setInfoMessage('Ingest at least one source to unlock the Section Writer.');
        return;
      }

      setDraftingPreview(true);
      setInfoMessage(null);
      setDraftPreview('');
      setRetrievalPreview([]);

      try {
        const retrieval = await submitRetrieval({
          projectId: project.id,
          sectionId: section.id,
          query: section.objective,
          limit: 5
        });

        if (retrieval.chunks.length === 0) {
          setInfoMessage('No evidence retrieved yet. Upload and ingest more sources to continue.');
          return;
        }

        setRetrievalPreview(retrieval.chunks.map((chunk) => chunk.text));

        const draft = await generateDraft({
          projectId: project.id,
          sectionId: section.id,
          section,
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
      } catch (error) {
        const message = (error as Error).message;
        toast({
          status: 'error',
          title: 'Preview failed',
          description: message
        });
      } finally {
        setDraftingPreview(false);
      }
    },
    [project, hasReadySources, toast]
  );

  const handleAddSection = useCallback(
    async (values: AddSectionFormValues) => {
      if (!project) {
        return;
      }

      if (!project.constitution) {
        toast({
          status: 'error',
          title: 'Outline unavailable',
          description: 'Complete onboarding to generate a thesis constitution before adding sections.'
        });
        return;
      }

      setSavingSection(true);
      try {
        const newSection: ThesisSection = {
          id: crypto.randomUUID(),
          title: values.title,
          objective: values.objective,
          expectedLength: values.expectedLength
        };

        const updatedProject = await updateProject(project.id, {
          constitution: {
            ...project.constitution,
            outline: {
              sections: [...project.constitution.outline.sections, newSection]
            }
          }
        });

        setProject(updatedProject);
        setProjects((prev) =>
          prev.map((existing) => (existing.id === updatedProject.id ? updatedProject : existing))
        );
        setSelectedSectionId(newSection.id);
        addSectionModal.onClose();
        toast({
          status: 'success',
          title: 'Section added',
          description: `"${newSection.title}" was added to your outline.`
        });
      } catch (error) {
        toast({
          status: 'error',
          title: 'Unable to save section',
          description: (error as Error).message
        });
      } finally {
        setSavingSection(false);
      }
    },
    [project, addSectionModal, toast]
  );

  const handleStartDrafting = useCallback(async () => {
    if (!project || !selectedSection) {
      return;
    }

    // Simply navigate to the editor - it will show an empty page
    // and the user can trigger generation from there
    navigate(
      `/workspace/drafting?projectId=${encodeURIComponent(project.id)}&sectionId=${encodeURIComponent(
        selectedSection.id
      )}`
    );
  }, [project, selectedSection, navigate]);

  const handleExportProject = useCallback(async () => {
    if (!project) {
      return;
    }

    setIsExportingProject(true);
    try {
      await downloadProjectDocx(project.id);
      toast({
        status: 'success',
        title: 'Export successful',
        description: 'Your complete thesis has been downloaded as a Word document.',
        duration: 3000
      });
    } catch (error) {
      toast({
        status: 'error',
        title: 'Export failed',
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setIsExportingProject(false);
    }
  }, [project, toast]);

  if (loadingProject) {
    return (
      <PageShell title="Workspace" description="Manage outline, sources, and drafting flow.">
        <Stack spacing={4}>
          <Skeleton height="160px" borderRadius="xl" />
          <Skeleton height="320px" borderRadius="xl" />
        </Stack>
      </PageShell>
    );
  }

  if (projectError) {
    return (
      <PageShell title="Workspace" description="Manage outline, sources, and drafting flow.">
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{projectError}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell title="Workspace" description="Manage outline, sources, and drafting flow.">
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>
            No projects yet. Complete onboarding to generate your first thesis outline.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (!project.constitution) {
    return (
      <PageShell title="Workspace" description="Manage outline, sources, and drafting flow.">
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>
            Generate a thesis constitution via onboarding to unlock the section workflow.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  const handleProjectChange = (newProjectId: string) => {
    const newProject = projects.find(p => p.id === newProjectId);
    if (newProject) {
      setProject(newProject);
      setSelectedSectionId(null);
      setDraftPreview('');
      setRetrievalPreview([]);
      navigate(`/workspace?projectId=${newProjectId}`);
    }
  };

  return (
    <PageShell
      title={
        <VStack align="flex-start" spacing={2}>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">{project.title}</Text>
          {projects.length > 1 && (
            <Select
              value={project.id}
              onChange={(e) => handleProjectChange(e.target.value)}
              size="sm"
              maxW="300px"
              bg="white"
              borderColor="gray.300"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          )}
        </VStack>
      }
      description="Outline your thesis, prepare evidence, and move sections into the writer."
      actions={
        <HStack spacing={3}>
          <Button
            colorScheme="green"
            variant="outline"
            onClick={() => void handleExportProject()}
            isLoading={isExportingProject}
            isDisabled={isExportingProject}
          >
            Export Complete Thesis
          </Button>
          <Button colorScheme="blue" variant="outline" onClick={addSectionModal.onOpen}>
            Add section
          </Button>
        </HStack>
      }
    >
      <Grid templateColumns={{ base: '1fr', lg: '280px 1fr' }} gap={6} alignItems="flex-start">
        <GridItem>
          <Stack spacing={4} border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} bg="white" shadow="sm">
            <Stack spacing={2}>
              <Heading size="sm" color="gray.800">
                Thesis outline
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Create sections and track readiness before drafting.
              </Text>
            </Stack>

            <Button colorScheme="blue" size="sm" onClick={addSectionModal.onOpen}>
              New section
            </Button>

            <Divider borderColor="gray.200" />

            {sections.length === 0 ? (
              <Stack spacing={3}>
                <Text fontWeight="semibold" color="gray.700">
                  No sections yet
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Start by defining the major sections of your thesis. We'll guide you through
                  evidence and drafting once a section is selected.
                </Text>
              </Stack>
            ) : (
              <VStack spacing={3} align="stretch">
                {sections.map((section, index) => (
                  <SectionOutlineItem
                    key={section.id}
                    section={section}
                    index={index}
                    isActive={section.id === selectedSectionId}
                    status={sectionStatus}
                    onSelect={setSelectedSectionId}
                    wordCount={sectionWordCounts[section.id] || 0}
                  />
                ))}
              </VStack>
            )}
          </Stack>
        </GridItem>

        <GridItem>
          {sections.length === 0 ? (
            <Stack
              spacing={4}
              border="1px solid" borderColor="gray.200"
              borderRadius="xl"
              px={6}
              py={8}
              bg="white"
              color="gray.700"
            >
              <Heading size="md" color="gray.800">
                Map your thesis outline
              </Heading>
              <Text>
                Add the major sections of your thesis to get a clear roadmap. Once a section is in
                place, we’ll help you attach evidence and open the Section Writer.
              </Text>
              <Button colorScheme="blue" onClick={addSectionModal.onOpen} alignSelf="flex-start">
                Add your first section
              </Button>
            </Stack>
          ) : selectedSection ? (
            <Stack spacing={6}>
              <Stack
                spacing={4}
                border="1px solid" borderColor="gray.200"
                borderRadius="xl"
                px={6}
                py={6}
                bg="white"
                color="gray.700"
              >
                <Stack spacing={1}>
                  <Text fontSize="sm" color="gray.500">
                    Section objective
                  </Text>
                  <Heading size="md" color="gray.800">
                    {selectedSection.title}
                  </Heading>
                  <Text color="gray.600">{selectedSection.objective}</Text>
                  {selectedSection.expectedLength ? (
                    <Text color="gray.500" fontSize="sm">
                      Target length: {selectedSection.expectedLength} words
                    </Text>
                  ) : null}
                </Stack>

                <Flex gap={6} wrap="wrap" fontSize="sm" color="gray.600">
                  <Text>
                    Sources: {loadingSources ? 'Loading...' : `${readySources.length}/${sources.length} ready`}
                  </Text>
                  <Text>
                    Status:&nbsp;
                    <Badge colorScheme={sectionStatusMeta.color} variant="subtle">
                      {sectionStatusMeta.label}
                    </Badge>
                  </Text>
                </Flex>

                <Divider borderColor="gray.200" />

                <Stack spacing={4}>
                  <Heading size="sm" color="gray.800">
                    Readiness checklist
                  </Heading>
                  <ReadinessChecklist items={readinessChecklist} />
                </Stack>

                <Divider borderColor="gray.200" />

                <Flex gap={3} flexWrap="wrap">
                  <Button
                    colorScheme="blue"
                    onClick={() => handleDraftPreview(selectedSection)}
                    isLoading={draftingPreview}
                    variant="outline"
                  >
                    Generate preview
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => void handleStartDrafting()}
                    isDisabled={!hasReadySources}
                  >
                    Start drafting
                  </Button>
                  <Button variant="ghost" colorScheme="blue" onClick={() => navigate('/workspace/sources')}>
                    Manage sources
                  </Button>
                </Flex>

                {sourcesError ? (
                  <Alert status="error" borderRadius="lg" bg="red.50">
                    <AlertIcon />
                    <AlertDescription>{sourcesError}</AlertDescription>
                  </Alert>
                ) : null}

                {infoMessage ? (
                  <Alert status="info" borderRadius="lg" bg="blue.50" color="gray.800">
                    <AlertIcon />
                    <AlertDescription>{infoMessage}</AlertDescription>
                  </Alert>
                ) : null}
              </Stack>

              {retrievalPreview.length > 0 ? (
                <Stack
                  spacing={3}
                  border="1px solid" borderColor="gray.200"
                  borderRadius="xl"
                  px={6}
                  py={5}
                  bg="blue.50"
                  color="gray.700"
                >
                  <Stack spacing={1}>
                    <Heading size="sm" color="gray.800">
                      Retrieved evidence ({retrievalPreview.length})
                    </Heading>
                    <Text fontSize="sm" color="gray.600">
                      Preview of key passages that will anchor this section draft.
                    </Text>
                  </Stack>
                  <Divider borderColor="gray.200" />
                  <Stack spacing={3}>
                    {retrievalPreview.map((chunk, index) => (
                      <Box
                        key={index}
                        border="1px solid" borderColor="gray.200"
                        borderRadius="lg"
                        px={4}
                        py={3}
                        bg="gray.50"
                      >
                        <Text fontSize="sm" color="gray.700">
                          {chunk}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              ) : null}

              {draftPreview ? (
                <Stack
                  spacing={3}
                  border="1px solid" borderColor="gray.200"
                  borderRadius="xl"
                  px={6}
                  py={5}
                  bg="white"
                  color="gray.700"
                >
                  <Heading size="sm" color="gray.800">
                    Draft preview
                  </Heading>
                  <Divider borderColor="gray.200" />
                  <Text fontSize="sm" whiteSpace="pre-wrap">
                    {draftPreview}
                  </Text>
                </Stack>
              ) : null}
            </Stack>
          ) : (
            <Stack
              spacing={4}
              border="1px solid" borderColor="gray.200"
              borderRadius="xl"
              px={6}
              py={8}
              bg="white"
              color="gray.700"
            >
              <Heading size="md" color="gray.800">
                Select a section
              </Heading>
              <Text>
                Highlight a section on the left to view readiness steps, preview evidence, and launch
                the writer.
              </Text>
            </Stack>
          )}
        </GridItem>
      </Grid>

      <AddSectionModal
        isOpen={addSectionModal.isOpen}
        onClose={addSectionModal.onClose}
        onSave={handleAddSection}
        isSaving={savingSection}
      />
    </PageShell>
  );
}

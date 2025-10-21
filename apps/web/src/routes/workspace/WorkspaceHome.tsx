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
      <ModalContent bg="rgba(15,23,42,0.95)" border="1px solid rgba(63,131,248,0.25)">
        <ModalHeader color="blue.100">Add outline section</ModalHeader>
        <ModalCloseButton color="blue.200" />
        <ModalBody>
          <Stack spacing={4} color="blue.50">
            <FormControl isRequired>
              <FormLabel color="blue.100">Section title</FormLabel>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., Literature Review"
                bg="rgba(15,23,42,0.7)"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color="blue.100">Objective</FormLabel>
              <Textarea
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                rows={4}
                placeholder="Define what this section should accomplish for your thesis."
                bg="rgba(15,23,42,0.7)"
              />
            </FormControl>
            <FormControl>
              <FormLabel color="blue.100">Target length (words)</FormLabel>
              <NumberInput
                min={0}
                value={expectedLength}
                onChange={(value) => setExpectedLength(value)}
              >
                <NumberInputField bg="rgba(15,23,42,0.7)" />
              </NumberInput>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} colorScheme="blue">
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
      borderColor={isActive ? 'blue.400' : 'rgba(63,131,248,0.25)'}
      bg={isActive ? 'rgba(59,130,246,0.18)' : 'rgba(15,23,42,0.65)'}
      cursor="pointer"
      transition="all 0.2s"
      onClick={() => onSelect(section.id)}
    >
      <Stack spacing={2}>
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="blue.300">
            Section {index + 1}
          </Text>
          <Badge colorScheme={statusMeta.color} size="sm">
            {statusMeta.label}
          </Badge>
        </Flex>
        <Text fontWeight="semibold" color="blue.100">
          {section.title}
        </Text>
        <Text color="blue.200" fontSize="sm" noOfLines={2}>
          {section.objective}
        </Text>
        {hasTarget && (
          <Stack spacing={1}>
            <Flex justify="space-between" fontSize="xs" color="blue.300">
              <Text>{wordCount} words</Text>
              <Text>{section.expectedLength} target</Text>
            </Flex>
            <Box w="100%" h="4px" bg="rgba(15,23,42,0.8)" borderRadius="full" overflow="hidden">
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
          border="1px solid rgba(63,131,248,0.2)"
          borderRadius="lg"
          px={4}
          py={3}
          bg="rgba(15,23,42,0.7)"
        >
          <Box pt={1}>
            {item.complete ? (
              <CheckCircleIcon color="green.300" boxSize={4} />
            ) : (
              <WarningTwoIcon color="yellow.300" boxSize={4} />
            )}
          </Box>
          <Stack spacing={1} flex="1">
            <Text fontWeight="semibold" color="blue.100">
              {item.label}
            </Text>
            <Text fontSize="sm" color="blue.200">
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

  return (
    <PageShell
      title={project.title}
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
          <Stack spacing={4} border="1px solid rgba(63,131,248,0.25)" borderRadius="xl" p={5}>
            <Stack spacing={2}>
              <Heading size="sm" color="blue.100">
                Thesis outline
              </Heading>
              <Text fontSize="sm" color="blue.200">
                Create sections and track readiness before drafting.
              </Text>
            </Stack>

            <Button colorScheme="blue" size="sm" onClick={addSectionModal.onOpen}>
              New section
            </Button>

            <Divider borderColor="rgba(148, 163, 230, 0.4)" />

            {sections.length === 0 ? (
              <Stack spacing={3} color="blue.50">
                <Text fontWeight="semibold" color="blue.100">
                  No sections yet
                </Text>
                <Text fontSize="sm" color="blue.200">
                  Start by defining the major sections of your thesis. We’ll guide you through
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
              border="1px solid rgba(63,131,248,0.25)"
              borderRadius="xl"
              px={6}
              py={8}
              bg="rgba(15,23,42,0.65)"
              color="blue.50"
            >
              <Heading size="md" color="blue.100">
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
                border="1px solid rgba(63,131,248,0.25)"
                borderRadius="xl"
                px={6}
                py={6}
                bg="rgba(15,23,42,0.7)"
                color="blue.50"
              >
                <Stack spacing={1}>
                  <Text fontSize="sm" color="blue.300">
                    Section objective
                  </Text>
                  <Heading size="md" color="blue.100">
                    {selectedSection.title}
                  </Heading>
                  <Text color="blue.200">{selectedSection.objective}</Text>
                  {selectedSection.expectedLength ? (
                    <Text color="blue.300" fontSize="sm">
                      Target length: {selectedSection.expectedLength} words
                    </Text>
                  ) : null}
                </Stack>

                <Flex gap={6} wrap="wrap" fontSize="sm" color="blue.200">
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

                <Divider borderColor="rgba(148, 163, 230, 0.4)" />

                <Stack spacing={4}>
                  <Heading size="sm" color="blue.100">
                    Readiness checklist
                  </Heading>
                  <ReadinessChecklist items={readinessChecklist} />
                </Stack>

                <Divider borderColor="rgba(148, 163, 230, 0.4)" />

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
                  <Alert status="error" borderRadius="lg" bg="rgba(220, 38, 38, 0.12)">
                    <AlertIcon />
                    <AlertDescription>{sourcesError}</AlertDescription>
                  </Alert>
                ) : null}

                {infoMessage ? (
                  <Alert status="info" borderRadius="lg" bg="rgba(59,130,246,0.12)" color="blue.100">
                    <AlertIcon />
                    <AlertDescription>{infoMessage}</AlertDescription>
                  </Alert>
                ) : null}
              </Stack>

              {retrievalPreview.length > 0 ? (
                <Stack
                  spacing={3}
                  border="1px solid rgba(63,131,248,0.25)"
                  borderRadius="xl"
                  px={6}
                  py={5}
                  bg="rgba(59,130,246,0.08)"
                  color="blue.50"
                >
                  <Stack spacing={1}>
                    <Heading size="sm" color="blue.100">
                      Retrieved evidence ({retrievalPreview.length})
                    </Heading>
                    <Text fontSize="sm" color="blue.200">
                      Preview of key passages that will anchor this section draft.
                    </Text>
                  </Stack>
                  <Divider borderColor="rgba(148, 163, 230, 0.3)" />
                  <Stack spacing={3}>
                    {retrievalPreview.map((chunk, index) => (
                      <Box
                        key={index}
                        border="1px solid rgba(63,131,248,0.25)"
                        borderRadius="lg"
                        px={4}
                        py={3}
                        bg="rgba(15,23,42,0.85)"
                      >
                        <Text fontSize="sm" color="blue.50">
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
                  border="1px solid rgba(63,131,248,0.25)"
                  borderRadius="xl"
                  px={6}
                  py={5}
                  bg="rgba(15,23,42,0.7)"
                  color="blue.50"
                >
                  <Heading size="sm" color="blue.100">
                    Draft preview
                  </Heading>
                  <Divider borderColor="rgba(148, 163, 230, 0.3)" />
                  <Text fontSize="sm" whiteSpace="pre-wrap">
                    {draftPreview}
                  </Text>
                </Stack>
              ) : null}
            </Stack>
          ) : (
            <Stack
              spacing={4}
              border="1px solid rgba(63,131,248,0.25)"
              borderRadius="xl"
              px={6}
              py={8}
              bg="rgba(15,23,42,0.65)"
              color="blue.50"
            >
              <Heading size="md" color="blue.100">
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

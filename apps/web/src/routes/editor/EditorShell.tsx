import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  HStack,
  Skeleton,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { DOMSerializer, type Node as ProseMirrorNode } from 'prosemirror-model';
import { PageShell } from '../shared/PageShell';
import { TipTapEditor } from './components/TipTapEditor';
import { CitationSidebar } from './components/CitationSidebar';
import { DraftProvider, useDraft } from './components/EditorContext';
import { DocumentPage } from './components/DocumentPage';
import { AIChatPanel, type ChatMessage } from './components/AIChatPanel';
import {
  requestParagraphRewrite,
  submitRetrieval,
  fetchProjects,
  downloadSectionDocx,
  processAICommand
} from '../../lib/api';
import { useStreamingDraft } from '../../lib/hooks/useStreamingDraft';
import type { Project, ThesisSection, EditOperation } from '@thesis-copilot/shared';
import { applyDiffMarks } from '../../lib/diff-utils';

type ParagraphInfo = {
  index: number;
  from: number;
  to: number;
  node: ProseMirrorNode;
};

type RewriteSuggestion = {
  paragraphIndex: number;
  paragraphId: string;
  suggestionHtml: string;
  originalHtml: string;
  currentHtml: string;
  reasoning?: string;
  applied: boolean;
};

type RewriteState = {
  loading: boolean;
  error: string | null;
  suggestion: RewriteSuggestion | null;
};

type EditorContentViewProps = {
  editor: Editor | null;
  onEditorReady: (editor: Editor | null) => void;
  rewriteState: RewriteState;
  onApplyRewrite: () => void;
  onUndoRewrite: () => void;
  onDismissRewrite: () => void;
  isGeneratingDraft?: boolean;
  chatMessages: ChatMessage[];
  onSendCommand: (command: string) => void;
  pendingEdit: { operation: EditOperation | null; originalHtml: string } | null;
  onApplyChanges: () => void;
  onRejectChanges: () => void;
};

function enumerateParagraphs(editor: Editor): ParagraphInfo[] {
  const paragraphs: ParagraphInfo[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'paragraph') {
      const index = paragraphs.length;
      paragraphs.push({ index, node, from: pos, to: pos + node.nodeSize });
      return false;
    }
    return true;
  });
  return paragraphs;
}

function findParagraphAtSelection(editor: Editor): ParagraphInfo | null {
  const { from, to } = editor.state.selection;
  return enumerateParagraphs(editor).find((paragraph) => from >= paragraph.from && to <= paragraph.to) ?? null;
}

function findParagraphByIndex(editor: Editor, index: number): ParagraphInfo | null {
  return enumerateParagraphs(editor).find((paragraph) => paragraph.index === index) ?? null;
}

function nodeToHtml(editor: Editor, node: ProseMirrorNode): string {
  const serializer = DOMSerializer.fromSchema(editor.schema);
  const container = document.createElement('div');
  container.appendChild(serializer.serializeNode(node));
  return container.innerHTML;
}

function extractParagraphHtmls(html: string): string[] {
  if (!html) {
    return [];
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  return Array.from(container.querySelectorAll('p')).map((p) => p.outerHTML);
}

function EditorContentView({
  editor,
  onEditorReady,
  rewriteState,
  onApplyRewrite,
  onUndoRewrite,
  onDismissRewrite,
  isGeneratingDraft,
  chatMessages,
  onSendCommand,
  pendingEdit,
  onApplyChanges,
  onRejectChanges
}: EditorContentViewProps) {
  const {
    projectId,
    sectionId,
    html,
    setHtml,
    citations,
    isLoading,
    error,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt
  } = useDraft();

  const handleInsertCitation = useCallback(
    (placeholder: string) => {
      if (!editor) {
        return;
      }
      editor.chain().focus().insertContent(`${placeholder} `).run();
    },
    [editor]
  );

  if (!projectId || !sectionId) {
    return (
      <Stack spacing={4} align="flex-start">
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          Choose a section to start editing
        </Text>
        <Text color="gray.600">
          Open the workspace, pick a project, and launch the editor from a specific outline section to load its latest draft.
        </Text>
        <Button as={RouterLink} to="/workspace" colorScheme="blue">
          Go to workspace
        </Button>
      </Stack>
    );
  }

  const rewriteAlert = rewriteState.error ? (
    <Alert status="error" borderRadius="lg" mb={4}>
      <AlertIcon />
      <Text>{rewriteState.error}</Text>
    </Alert>
  ) : null;

  const rewritePreview = rewriteState.suggestion ? (
    <Stack
      spacing={3}
      border="1px solid"
      borderColor="blue.200"
      borderRadius="xl"
      bg="blue.50"
      px={5}
      py={4}
      mt={4}
    >
      <Text fontWeight="semibold" color="gray.800">
        Suggested rewrite
      </Text>
      {rewriteState.suggestion.reasoning ? (
        <Text fontSize="sm" color="gray.600">
          {rewriteState.suggestion.reasoning}
        </Text>
      ) : null}
      <Stack spacing={3}>
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          px={4}
          py={3}
          bg="white"
        >
          <Text fontWeight="medium" color="gray.700" mb={2}>
            Current paragraph
          </Text>
          <Box
            color="gray.800"
            fontSize="sm"
            dangerouslySetInnerHTML={{ __html: rewriteState.suggestion.currentHtml }}
          />
        </Box>
        <Box
          border="1px solid"
          borderColor="blue.300"
          borderRadius="lg"
          px={4}
          py={3}
          bg="blue.50"
        >
          <Text fontWeight="medium" color="blue.700" mb={2}>
            Suggested paragraph
          </Text>
          <Box
            color="gray.800"
            fontSize="sm"
            dangerouslySetInnerHTML={{ __html: rewriteState.suggestion.suggestionHtml }}
          />
        </Box>
      </Stack>
      <HStack spacing={3}>
        <Button
          colorScheme="blue"
          onClick={rewriteState.suggestion.applied ? onUndoRewrite : onApplyRewrite}
        >
          {rewriteState.suggestion.applied ? 'Undo rewrite' : 'Apply suggestion'}
        </Button>
        <Button variant="ghost" onClick={onDismissRewrite}>
          Dismiss
        </Button>
      </HStack>
    </Stack>
  ) : null;

  return (
    <Box>
      {error ? (
        <Alert status="error" borderRadius="lg" mb={4}>
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      ) : null}

      {rewriteAlert}

      {isGeneratingDraft ? (
        <Alert status="info" borderRadius="lg" mb={4}>
          <AlertIcon />
          <Text>AI is writing your draft... Watch it appear in real-time!</Text>
        </Alert>
      ) : null}

      {isLoading ? (
        <DocumentPage>
          <Flex
            direction="column"
            align="center"
            justify="center"
            minH="400px"
            opacity={0.6}
          >
            <Text fontSize="lg" color="gray.600" mb={2}>
              Loading your document...
            </Text>
            <Text fontSize="sm" color="gray.500" mb={4}>
              If this takes more than 5 seconds, check that your backend is running
            </Text>
            <Stack spacing={2} width="100%" maxW="500px">
              <Skeleton height="20px" />
              <Skeleton height="20px" width="80%" />
              <Skeleton height="20px" width="90%" />
            </Stack>
          </Flex>
        </DocumentPage>
      ) : (
        <Flex direction="row" h="calc(100vh - 200px)" gap={0}>
          {/* Left: AI Chat Panel */}
          <Box w="350px" h="100%">
            <AIChatPanel
              messages={chatMessages}
              onSendCommand={onSendCommand}
              isProcessing={isGeneratingDraft}
              hasPendingEdit={!!pendingEdit}
              onApplyChanges={onApplyChanges}
              onRejectChanges={onRejectChanges}
            />
          </Box>

          {/* Right: Document Editor */}
          <Box flex="1" overflowY="auto">
            <DocumentPage>
              <TipTapEditor
                content={html}
                onUpdate={setHtml}
                isSaving={isSaving}
                onEditorReady={onEditorReady}
              />
            </DocumentPage>
            <Text fontSize="sm" color="gray.600" mt={4} textAlign="center" px={4}>
              {isSaving
                ? 'Saving changes… '
                : hasUnsavedChanges
                  ? 'Unsaved changes — autosave will run in a moment or hit Save now. '
                  : lastSavedAt
                    ? `Last saved at ${new Date(lastSavedAt).toLocaleTimeString()}. `
                    : 'AI will write your draft automatically. '}
            </Text>
            {rewritePreview}
          </Box>
        </Flex>
      )}
    </Box>
  );
}

export function EditorShell() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const sectionId = searchParams.get('sectionId');

  return (
    <DraftProvider projectId={projectId} sectionId={sectionId}>
      <EditorInnerShell />
    </DraftProvider>
  );
}

function EditorInnerShell() {
  const toast = useToast();
  const {
    projectId,
    sectionId,
    html,
    setHtml,
    citations,
    persistedHtml,
    manualSave,
    isSaving,
    hasUnsavedChanges,
    isLoading: isDraftLoading
  } = useDraft();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [rewriteState, setRewriteState] = useState<RewriteState>({
    loading: false,
    error: null,
    suggestion: null
  });
  const [canRewrite, setCanRewrite] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [section, setSection] = useState<ThesisSection | null>(null);
  const [autoGenerateAttempted, setAutoGenerateAttempted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const prevLoadingRef = useRef(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingEdit, setPendingEdit] = useState<{
    operation: EditOperation | null;
    originalHtml: string;
  } | null>(null);

  // Initialize streaming hook first (before useEffects that use it)
  const { generateDraftStreaming } = useStreamingDraft({
    onToken: (content) => {
      console.log('[Token received]', { content: content.substring(0, 20), hasEditor: !!editor });

      // Update chat panel with streaming token
      setChatMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status === 'writing') {
          // Append to existing writing message
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              content: lastMsg.content + content
            }
          ];
        }
        return prev;
      });

      // Append each token to the editor in real-time
      if (editor) {
        // Insert content at the end of the document
        const { doc } = editor.state;
        const endPos = doc.content.size - 1; // Position before final closing tag

        // Insert text at the end
        editor.chain()
          .focus('end')
          .insertContent(content)
          .run();

        console.log('[Appended to editor]', {
          token: content.substring(0, 10),
          position: endPos
        });
      } else {
        console.warn('[Token received but editor is null - cannot display content]');
      }
    },
    onComplete: (fullText) => {
      console.log('[Stream complete]', { textLength: fullText.length, hasEditor: !!editor });
      setIsGeneratingDraft(false);

      // Update chat: mark message as complete
      setChatMessages((prev) => {
        const updated = [...prev];
        const writingMsg = updated.find(m => m.status === 'writing');
        if (writingMsg) {
          writingMsg.status = 'complete';
        }
        return updated;
      });

      toast({
        status: 'success',
        title: 'Draft generated!',
        description: 'Your AI-generated draft is ready for editing.',
        duration: 3000
      });
      // The editor content should already be updated via onToken
      // Just trigger a manual save to persist to backend
      if (editor) {
        // Force update the context with final editor content
        const finalHtml = editor.getHTML();
        console.log('[Setting final HTML to context]', { length: finalHtml.length });
        setHtml(finalHtml);
      } else {
        // Fallback: If editor is not ready, wrap the text in paragraph tags
        console.log('[No editor - setting HTML directly to context]');
        const wrappedHtml = `<p>${fullText}</p>`;
        setHtml(wrappedHtml);
      }
    },
    onError: (error) => {
      setIsGeneratingDraft(false);

      // Update chat: add error message
      setChatMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];

        // If last message was thinking or writing, update it to show error
        if (lastMsg && (lastMsg.status === 'thinking' || lastMsg.status === 'writing')) {
          lastMsg.content = `Error: ${error}`;
          lastMsg.status = 'complete';
        } else {
          // Otherwise add new error message
          updated.push({
            id: `msg-${Date.now()}-error`,
            role: 'assistant',
            content: `Error: ${error}`,
            timestamp: new Date(),
            status: 'complete'
          });
        }
        return updated;
      });

      toast({
        status: 'error',
        title: 'Generation failed',
        description: error,
        duration: 5000
      });
    }
  });

  // Fetch project and section data
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        const projects = await fetchProjects();
        const foundProject = projects.find((p) => p.id === projectId);
        if (foundProject) {
          setProject(foundProject);

          // Find the section
          const foundSection = foundProject.constitution?.outline.sections.find(
            (s) => s.id === sectionId
          );
          if (foundSection) {
            setSection(foundSection);
          }
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    };

    void loadProject();
  }, [projectId, sectionId]);

  // Debug: Track isDraftLoading changes
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1];
    console.log(`[Debug ${timestamp}] isDraftLoading changed:`, isDraftLoading);
  }, [isDraftLoading]);

  // Debug: Track html changes
  useEffect(() => {
    console.log('[Debug] html changed:', {
      length: html.length,
      preview: html.substring(0, 50),
      isEmpty: html.trim() === '' || html.trim() === '<p></p>'
    });
  }, [html]);

  // Trigger auto-generation when loading completes
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const isNowLoaded = !isDraftLoading;

    console.log('[Loading Transition]', {
      wasLoading,
      isNowLoaded,
      isDraftLoading,
      transition: wasLoading && isNowLoaded ? 'LOADING → LOADED' : 'no change'
    });

    // Update ref for next render
    prevLoadingRef.current = isDraftLoading;

    // If still loading, skip
    if (isDraftLoading) {
      console.log('[Loading Transition] Skipped: Still loading (isDraftLoading=true)');
      return;
    }

    // Only proceed if we just finished loading
    if (!wasLoading || !isNowLoaded) {
      console.log('[Loading Transition] Skipped: Not a loading→loaded transition');
      return;
    }

    // Check if we should auto-generate
    if (autoGenerateAttempted) {
      console.log('[Loading Transition] Skipped: Already attempted auto-generation');
      return;
    }

    if (!project || !section || !projectId || !sectionId) {
      console.log('[Loading Transition] Skipped: Missing project/section data');
      return;
    }

    if (isGeneratingDraft) {
      console.log('[Loading Transition] Skipped: Already generating');
      return;
    }

    // IMPORTANT: Wait for editor to be ready before generating
    if (!editor) {
      console.log('[Loading Transition] Skipped: Editor not ready yet');
      return;
    }

    // Check if draft is empty
    const isEmpty =
      html.trim() === '<p></p>' ||
      html.trim() === '' ||
      html.trim() === '<p><br></p>' ||
      html.trim() === '<p><br/></p>';

    if (!isEmpty) {
      console.log('[Loading Transition] Skipped: Draft is not empty', { html: html.substring(0, 100) });
      return;
    }

    console.log('[Loading Transition] ✅ Starting auto-generation after load complete!');
    setAutoGenerateAttempted(true);

    const autoGenerate = async () => {
      console.log('[Auto-Generate] Starting generation', {
        projectId: project.id,
        sectionId: section.id,
        editorReady: !!editor
      });

      setIsGeneratingDraft(true);

      // Add "thinking" message to chat
      const thinkingMsgId = `msg-${Date.now()}-thinking`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: thinkingMsgId,
          role: 'assistant',
          content: 'Analyzing sources and preparing to write...',
          timestamp: new Date(),
          status: 'thinking'
        }
      ]);

      try {
        // Retrieve evidence from sources
        console.log('[Auto-Generate] Submitting retrieval request...');
        const retrieval = await submitRetrieval({
          projectId: project.id,
          sectionId: section.id,
          query: section.objective,
          limit: 5
        });

        console.log('[Auto-Generate] Retrieval complete', {
          chunkCount: retrieval.chunks.length
        });

        if (retrieval.chunks.length === 0) {
          console.warn('[Auto-Generate] No sources available for drafting');
          toast({
            status: 'warning',
            title: 'No sources available',
            description: 'Please upload and ingest sources in the workspace first.',
            duration: 5000
          });
          setIsGeneratingDraft(false);
          return;
        }

        // Show generation starting
        toast({
          status: 'info',
          title: 'Generating draft...',
          description: 'Watch as the AI writes your thesis section!',
          duration: 3000
        });

        console.log('[Auto-Generate] Starting streaming draft generation...');

        // Update chat: thinking → writing
        setChatMessages((prev) => {
          const updated = [...prev];
          const thinkingMsg = updated.find(m => m.status === 'thinking');
          if (thinkingMsg) {
            thinkingMsg.status = 'writing';
            thinkingMsg.content = '';
          } else {
            // Add writing message if thinking message not found
            updated.push({
              id: `msg-${Date.now()}-writing`,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              status: 'writing'
            });
          }
          return updated;
        });

        // Clear the editor before starting to stream
        if (editor) {
          console.log('[Auto-Generate] Clearing editor before streaming');
          editor.commands.setContent('');
        }

        // Call streaming API
        await generateDraftStreaming({
          projectId: project.id,
          sectionId: section.id,
          section: section,
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

        console.log('[Auto-Generate] Draft generation completed successfully');
      } catch (error) {
        console.error('[Auto-Generate] Generation failed:', error);
        setIsGeneratingDraft(false);
        toast({
          status: 'error',
          title: 'Generation failed',
          description: (error as Error).message,
          duration: 5000
        });
      }
    };

    void autoGenerate();
  }, [
    isDraftLoading,
    html,
    project,
    section,
    projectId,
    sectionId,
    isGeneratingDraft,
    autoGenerateAttempted,
    generateDraftStreaming,
    toast,
    editor  // Added: Wait for editor to be ready
  ]);

  // Auto-generate draft when editor is empty (OLD - keeping for debugging)
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1];
    console.log(`[Auto-Generate] Effect triggered at ${timestamp}`, {
      autoGenerateAttempted,
      isDraftLoading,
      hasProject: !!project,
      hasSection: !!section,
      projectId,
      sectionId,
      isGeneratingDraft,
      htmlLength: html.length,
      htmlPreview: html.substring(0, 50)
    });

    // Wait for draft loading to complete
    if (isDraftLoading) {
      console.log('[Auto-Generate] Skipped: Still loading draft');
      return;
    }

    // Don't auto-generate if:
    // - Already attempted
    // - No project/section data yet
    // - Draft is not empty
    // - Already generating
    if (autoGenerateAttempted) {
      console.log('[Auto-Generate] Skipped: Already attempted');
      return;
    }

    if (!project || !section) {
      console.log('[Auto-Generate] Skipped: No project/section data yet');
      return;
    }

    if (!projectId || !sectionId) {
      console.log('[Auto-Generate] Skipped: No projectId/sectionId');
      return;
    }

    if (isGeneratingDraft) {
      console.log('[Auto-Generate] Skipped: Already generating');
      return;
    }

    // Check if draft is empty (only has empty paragraph)
    const isEmpty =
      html.trim() === '<p></p>' ||
      html.trim() === '' ||
      html.trim() === '<p><br></p>' ||
      html.trim() === '<p><br/></p>';

    if (!isEmpty) {
      console.log('[Auto-Generate] Skipped: Draft is not empty', { html: html.substring(0, 100) });
      return;
    }

    console.log('[Auto-Generate] ✅ All conditions met! Starting auto-generation...');
    setAutoGenerateAttempted(true);

    const autoGenerate = async () => {
      console.log('[Auto-Generate] Starting auto-generation', {
        projectId: project.id,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionObjective: section.objective
      });

      setIsGeneratingDraft(true);

      // Add "thinking" message to chat
      const thinkingMsgId = `msg-${Date.now()}-thinking`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: thinkingMsgId,
          role: 'assistant',
          content: 'Analyzing sources and preparing to write...',
          timestamp: new Date(),
          status: 'thinking'
        }
      ]);

      try {
        // Retrieve evidence from sources
        console.log('[Auto-Generate] Submitting retrieval request...');
        const retrieval = await submitRetrieval({
          projectId: project.id,
          sectionId: section.id,
          query: section.objective,
          limit: 5
        });

        console.log('[Auto-Generate] Retrieval complete', {
          chunkCount: retrieval.chunks.length
        });

        if (retrieval.chunks.length === 0) {
          console.warn('[Auto-Generate] No sources available for drafting');
          toast({
            status: 'warning',
            title: 'No sources available',
            description: 'Please upload and ingest sources in the workspace first.',
            duration: 5000
          });
          setIsGeneratingDraft(false);
          return;
        }

        // Show generation starting
        toast({
          status: 'info',
          title: 'Generating draft...',
          description: 'Watch as the AI writes your thesis section!',
          duration: 3000
        });

        console.log('[Auto-Generate] Starting streaming draft generation...');

        // Update chat: thinking → writing
        setChatMessages((prev) => {
          const updated = [...prev];
          const thinkingMsg = updated.find(m => m.status === 'thinking');
          if (thinkingMsg) {
            thinkingMsg.status = 'writing';
            thinkingMsg.content = '';
          } else {
            // Add writing message if thinking message not found
            updated.push({
              id: `msg-${Date.now()}-writing`,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              status: 'writing'
            });
          }
          return updated;
        });

        // Clear the editor before starting to stream
        if (editor) {
          console.log('[Auto-Generate] Clearing editor before streaming');
          editor.commands.setContent('');
        }

        // Call streaming API
        await generateDraftStreaming({
          projectId: project.id,
          sectionId: section.id,
          section: section,
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

        console.log('[Auto-Generate] Draft generation completed successfully');
      } catch (error) {
        console.error('[Auto-Generate] Generation failed:', error);
        setIsGeneratingDraft(false);
        toast({
          status: 'error',
          title: 'Generation failed',
          description: (error as Error).message,
          duration: 5000
        });
      }
    };

    void autoGenerate();
  }, [
    html,
    isDraftLoading,
    project,
    section,
    projectId,
    sectionId,
    isGeneratingDraft,
    autoGenerateAttempted,
    generateDraftStreaming,
    toast
  ]);

  useEffect(() => {
    if (!editor || !projectId || !sectionId) {
      setCanRewrite(false);
      return;
    }

    const update = () => {
      setCanRewrite(Boolean(findParagraphAtSelection(editor)));
    };

    editor.on('selectionUpdate', update);
    update();

    return () => {
      editor.off('selectionUpdate', update);
    };
  }, [editor, projectId, sectionId]);

  const handleRequestRewrite = useCallback(async () => {
    if (!editor || !projectId || !sectionId) {
      return;
    }

    const paragraph = findParagraphAtSelection(editor);
    if (!paragraph) {
      setRewriteState({ loading: false, error: 'Select a single paragraph to request a rewrite.', suggestion: null });
      return;
    }

    const paragraphHtml = nodeToHtml(editor, paragraph.node);
    const persistedParagraphs = extractParagraphHtmls(persistedHtml);
    const originalHtml = persistedParagraphs[paragraph.index] ?? paragraphHtml;
    const currentParagraphs = extractParagraphHtmls(editor.getHTML());
    const surrounding = {
      previous: currentParagraphs.slice(Math.max(0, paragraph.index - 1), paragraph.index),
      next: currentParagraphs.slice(paragraph.index + 1, paragraph.index + 2)
    };

    setRewriteState({ loading: true, error: null, suggestion: null });

    try {
      const response = await requestParagraphRewrite({
        projectId,
        sectionId,
        paragraphId: `paragraph-${paragraph.index}`,
        originalHtml,
        editedHtml: paragraphHtml,
        citations,
        surroundingParagraphs: surrounding,
        maxTokens: 350
      });

      setRewriteState({
        loading: false,
        error: null,
        suggestion: {
          paragraphIndex: paragraph.index,
          paragraphId: response.paragraphId,
          suggestionHtml: response.suggestionHtml,
          originalHtml,
          currentHtml: paragraphHtml,
          reasoning: response.reasoning,
          applied: false
        }
      });
    } catch (error) {
      setRewriteState({
        loading: false,
        error: (error as Error).message,
        suggestion: null
      });
    }
  }, [citations, editor, persistedHtml, projectId, sectionId]);

  const applyRewrite = useCallback(() => {
    if (!editor || !rewriteState.suggestion) {
      return;
    }
    const info = findParagraphByIndex(editor, rewriteState.suggestion.paragraphIndex);
    if (!info) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt({ from: info.from, to: info.to }, rewriteState.suggestion.suggestionHtml, {
        parseOptions: { preserveWhitespace: true }
      })
      .run();

    setRewriteState((state) =>
      state.suggestion
        ? {
            ...state,
            suggestion: {
              ...state.suggestion,
              applied: true
            }
          }
        : state
    );
  }, [editor, rewriteState.suggestion]);

  const undoRewrite = useCallback(() => {
    if (!editor || !rewriteState.suggestion) {
      return;
    }
    const info = findParagraphByIndex(editor, rewriteState.suggestion.paragraphIndex);
    if (!info) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt({ from: info.from, to: info.to }, rewriteState.suggestion.currentHtml, {
        parseOptions: { preserveWhitespace: true }
      })
      .run();

    setRewriteState((state) =>
      state.suggestion
        ? {
            ...state,
            suggestion: {
              ...state.suggestion,
              applied: false
            }
          }
        : state
    );
  }, [editor, rewriteState.suggestion]);

  const dismissRewrite = useCallback(() => {
    setRewriteState((state) => ({ ...state, error: null, suggestion: null }));
  }, []);

  const handleExportSection = useCallback(async () => {
    if (!projectId || !sectionId) {
      return;
    }

    setIsExporting(true);
    try {
      await downloadSectionDocx(projectId, sectionId);
      toast({
        status: 'success',
        title: 'Export successful',
        description: 'Your section has been downloaded as a Word document.',
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
      setIsExporting(false);
    }
  }, [projectId, sectionId, toast]);

  const handleSendCommand = useCallback(
    async (command: string) => {
      if (!projectId || !sectionId || !project || !editor) {
        toast({
          status: 'error',
          title: 'Cannot process command',
          description: 'Editor not ready',
          duration: 3000
        });
        return;
      }

      // Add user message to chat
      const userMsgId = `msg-${Date.now()}-user`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          content: command,
          timestamp: new Date()
        }
      ]);

      // Add AI thinking response
      const thinkingMsgId = `msg-${Date.now()}-thinking`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: thinkingMsgId,
          role: 'assistant',
          content: 'Analyzing your request...',
          timestamp: new Date(),
          status: 'thinking'
        }
      ]);

      try {
        const currentHtml = editor.getHTML();
        const { from, to } = editor.state.selection;
        const selectionRange = from !== to ? { from, to } : undefined;

        // Call AI command API
        const response = await processAICommand({
          projectId,
          sectionId,
          command,
          currentHtml,
          selectionRange,
          thesisSummary: {
            scope: project.constitution?.scope,
            toneGuidelines: project.constitution?.toneGuidelines,
            coreArgument: project.constitution?.coreArgument
          },
          citations,
          maxTokens: 500
        });

        // Apply changes directly to editor with highlighting
        const operation = response.operation;

        // Store pending edit for approval
        setPendingEdit({
          operation,
          originalHtml: currentHtml
        });

        // Apply changes with diff highlighting in editor
        if (operation.type === 'insert') {
          if (operation.position === 'end') {
            editor.chain().focus('end').insertContent(`<span data-diff="addition">${operation.content}</span>`).run();
          } else if (operation.position === 'start') {
            editor.chain().focus('start').insertContent(`<span data-diff="addition">${operation.content}</span>`).run();
          } else {
            editor.chain().focus().insertContent(`<span data-diff="addition">${operation.content}</span>`).run();
          }
        } else if (operation.type === 'replace') {
          const contentBefore = currentHtml.substring(0, operation.from);
          const contentAfter = currentHtml.substring(operation.to);
          const originalContent = operation.originalContent || currentHtml.substring(operation.from, operation.to);

          const newHtml = contentBefore +
            `<span data-diff="deletion">${originalContent}</span>` +
            `<span data-diff="addition">${operation.content}</span>` +
            contentAfter;

          editor.commands.setContent(newHtml);
        } else if (operation.type === 'delete') {
          const deletedContent = operation.deletedContent || currentHtml.substring(operation.from, operation.to);
          editor
            .chain()
            .focus()
            .insertContentAt(
              { from: operation.from, to: operation.to },
              `<span data-diff="deletion">${deletedContent}</span>`
            )
            .run();
        } else if (operation.type === 'rewrite') {
          // Show full rewrite with diff marks
          const { diffHtml } = applyDiffMarks(currentHtml, operation.content);
          editor.commands.setContent(diffHtml);
        }

        // Update chat with response and add action buttons
        setChatMessages((prev) => {
          const updated = [...prev];
          const thinkingMsg = updated.find((m) => m.id === thinkingMsgId);
          if (thinkingMsg) {
            thinkingMsg.content = response.reasoning;
            thinkingMsg.status = 'complete';
          }
          return updated;
        });
      } catch (error) {
        // Update chat with error
        setChatMessages((prev) => {
          const updated = [...prev];
          const thinkingMsg = updated.find((m) => m.id === thinkingMsgId);
          if (thinkingMsg) {
            thinkingMsg.content = `Error: ${(error as Error).message}`;
            thinkingMsg.status = 'complete';
          }
          return updated;
        });

        toast({
          status: 'error',
          title: 'Command failed',
          description: (error as Error).message,
          duration: 5000
        });
      }
    },
    [projectId, sectionId, project, editor, citations, setHtml, toast]
  );

  const handleApplyChanges = useCallback(() => {
    if (!editor || !pendingEdit?.operation) {
      return;
    }

    try {
      // Remove diff highlights and keep the new content
      const currentHtml = editor.getHTML();

      // Remove paragraph-level diff attributes and styles
      const cleanHtml = currentHtml
        // Remove deleted paragraphs entirely
        .replace(/<p[^>]*data-diff="deletion"[^>]*>.*?<\/p>/g, '')
        // Keep addition paragraphs but remove diff attributes and styles
        .replace(/<p([^>]*)data-diff="addition"([^>]*)style="[^"]*"([^>]*)>/g, '<p$1$2$3>')
        .replace(/data-diff="addition"/g, '')
        // Also handle span-level diffs (legacy)
        .replace(/<span data-diff="deletion">.*?<\/span>/g, '') // Remove deleted text
        .replace(/<span data-diff="addition">(.*?)<\/span>/g, '$1'); // Keep added text, remove highlights

      editor.commands.setContent(cleanHtml);
      setHtml(cleanHtml);

      // Clear pending edit
      setPendingEdit(null);

      toast({
        status: 'success',
        title: 'Changes applied',
        description: 'Your edits have been saved',
        duration: 3000
      });
    } catch (error) {
      toast({
        status: 'error',
        title: 'Failed to apply changes',
        description: (error as Error).message,
        duration: 5000
      });
    }
  }, [editor, pendingEdit, setHtml, toast]);

  const handleRejectChanges = useCallback(() => {
    if (!editor || !pendingEdit) {
      return;
    }

    try {
      // Restore original HTML
      editor.commands.setContent(pendingEdit.originalHtml);
      setHtml(pendingEdit.originalHtml);

      // Clear pending edit
      setPendingEdit(null);

      toast({
        status: 'info',
        title: 'Changes rejected',
        description: 'Document restored to previous state',
        duration: 3000
      });
    } catch (error) {
      toast({
        status: 'error',
        title: 'Failed to reject changes',
        description: (error as Error).message,
        duration: 5000
      });
    }
  }, [editor, pendingEdit, setHtml, toast]);

  return (
    <PageShell
      title="Document editor"
      description="Review AI-assisted drafts, apply your edits, and request contextual rewrites."
      actions={
        <HStack spacing={3}>
          <Button as={RouterLink} to="/workspace" variant="ghost" colorScheme="blue">
            Back to workspace
          </Button>
          <Button
            variant="outline"
            colorScheme="green"
            onClick={() => void handleExportSection()}
            isLoading={isExporting}
            isDisabled={isExporting}
          >
            Export to Word
          </Button>
          <Button onClick={() => void manualSave()} isLoading={isSaving} isDisabled={!hasUnsavedChanges && !isSaving}>
            {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save changes' : 'Saved'}
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => void handleRequestRewrite()}
            isLoading={rewriteState.loading}
            isDisabled={!canRewrite || rewriteState.loading}
          >
            Request rewrite
          </Button>
        </HStack>
      }
    >
      <EditorContentView
        editor={editor}
        onEditorReady={setEditor}
        rewriteState={rewriteState}
        onApplyRewrite={applyRewrite}
        onUndoRewrite={undoRewrite}
        onDismissRewrite={dismissRewrite}
        isGeneratingDraft={isGeneratingDraft}
        chatMessages={chatMessages}
        onSendCommand={handleSendCommand}
        pendingEdit={pendingEdit}
        onApplyChanges={handleApplyChanges}
        onRejectChanges={handleRejectChanges}
      />
    </PageShell>
  );
}

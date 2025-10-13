import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  HStack,
  Skeleton,
  Stack,
  Text
} from '@chakra-ui/react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { DOMSerializer, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { PageShell } from '../shared/PageShell';
import { TipTapEditor } from './components/TipTapEditor';
import { CitationSidebar } from './components/CitationSidebar';
import { DraftProvider, useDraft } from './components/EditorContext';
import { requestParagraphRewrite } from '../../lib/api';

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
  onDismissRewrite
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
      <Stack spacing={4} color="blue.50" align="flex-start">
        <Text fontSize="lg" fontWeight="semibold" color="blue.100">
          Choose a section to start editing
        </Text>
        <Text color="blue.200">
          Open the workspace, pick a project, and launch the editor from a specific outline section to load its latest draft.
        </Text>
        <Button as={RouterLink} to="/workspace" variant="outline" colorScheme="blue">
          Go to workspace
        </Button>
      </Stack>
    );
  }

  const rewriteAlert = rewriteState.error ? (
    <Alert status="error" borderRadius="lg" bg="rgba(220, 38, 38, 0.12)" color="red.100">
      <AlertIcon />
      <Text>{rewriteState.error}</Text>
    </Alert>
  ) : null;

  const rewritePreview = rewriteState.suggestion ? (
    <Stack
      spacing={3}
      border="1px solid rgba(63,131,248,0.25)"
      borderRadius="xl"
      bg="rgba(15,23,42,0.65)"
      px={5}
      py={4}
    >
      <Text fontWeight="semibold" color="blue.100">
        Suggested rewrite
      </Text>
      {rewriteState.suggestion.reasoning ? (
        <Text fontSize="sm" color="blue.200">
          {rewriteState.suggestion.reasoning}
        </Text>
      ) : null}
      <Stack spacing={3}>
        <Box
          border="1px solid rgba(147,197,253,0.25)"
          borderRadius="lg"
          px={4}
          py={3}
          bg="rgba(30,41,59,0.9)"
        >
          <Text fontWeight="medium" color="blue.100" mb={2}>
            Current paragraph
          </Text>
          <Box
            color="blue.50"
            fontSize="sm"
            dangerouslySetInnerHTML={{ __html: rewriteState.suggestion.currentHtml }}
          />
        </Box>
        <Box
          border="1px solid rgba(63,131,248,0.4)"
          borderRadius="lg"
          px={4}
          py={3}
          bg="rgba(30,64,175,0.2)"
        >
          <Text fontWeight="medium" color="blue.100" mb={2}>
            Suggested paragraph
          </Text>
          <Box
            color="blue.50"
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
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="flex-start">
      <Stack flex="1" spacing={4} color="blue.50">
        {error ? (
          <Alert status="error" borderRadius="lg" bg="rgba(220, 38, 38, 0.12)" color="red.100">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        ) : null}

        {rewriteAlert}

        {isLoading ? (
          <Stack spacing={3}>
            <Skeleton height="260px" borderRadius="2xl" />
            <Skeleton height="20px" borderRadius="lg" />
          </Stack>
        ) : (
          <>
            <TipTapEditor
              content={html}
              onUpdate={setHtml}
              isSaving={isSaving}
              onEditorReady={onEditorReady}
            />
            <Text fontSize="sm" color="blue.200">
              {isSaving
                ? 'Saving changes… '
                : hasUnsavedChanges
                  ? 'Unsaved changes — autosave will run in a moment or hit Save now. '
                  : lastSavedAt
                    ? `Last saved at ${new Date(lastSavedAt).toLocaleTimeString()}. `
                    : 'Start drafting to trigger autosave. '}
              Highlight a paragraph and use "Request rewrite" to preview alternative phrasings.
            </Text>
            {rewritePreview}
          </>
        )}
      </Stack>
      <CitationSidebar citations={citations} onInsertCitation={handleInsertCitation} />
    </Flex>
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
  const {
    projectId,
    sectionId,
    citations,
    persistedHtml,
    manualSave,
    isSaving,
    hasUnsavedChanges
  } = useDraft();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [rewriteState, setRewriteState] = useState<RewriteState>({
    loading: false,
    error: null,
    suggestion: null
  });
  const [canRewrite, setCanRewrite] = useState(false);

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

  return (
    <PageShell
      title="Document editor"
      description="Review AI-assisted drafts, apply your edits, and request contextual rewrites."
      actions={
        <HStack spacing={3}>
          <Button as={RouterLink} to="/workspace" variant="ghost" colorScheme="blue">
            Back to workspace
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
      />
    </PageShell>
  );
}

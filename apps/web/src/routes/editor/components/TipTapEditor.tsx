import {
  EditorContent,
  useEditor,
  type Editor
} from '@tiptap/react';
import StarterKitExtension from '@tiptap/starter-kit';
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { useEffect } from 'react';
import { CitationHighlightExtension } from './extensions/CitationHighlight';

const StarterKit = StarterKitExtension;

type TipTapEditorProps = {
  content: string;
  onUpdate?: (value: string) => void;
  isSaving?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
};

export function TipTapEditor({
  content,
  onUpdate,
  isSaving = false,
  onEditorReady
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, CitationHighlightExtension],
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'thesis-editor-content'
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => {
      if (onEditorReady) {
        onEditorReady(null);
      }
    };
  }, [editor, onEditorReady]);

  const toolbar = editor ? (
    <ButtonGroup size="sm" variant="ghost" colorScheme="blue">
      <Tooltip label="Bold" hasArrow>
        <Button
          fontWeight="bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
          isActive={editor.isActive('bold')}
        >
          B
        </Button>
      </Tooltip>
      <Tooltip label="Italic" hasArrow>
        <Button
          fontStyle="italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
          isActive={editor.isActive('italic')}
        >
          I
        </Button>
      </Tooltip>
      <Tooltip label="Bullet list" hasArrow>
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Toggle bullet list"
          isActive={editor.isActive('bulletList')}
        >
          • List
        </Button>
      </Tooltip>
    </ButtonGroup>
  ) : null;

  return (
    <Card
      bg="rgba(15,23,42,0.7)"
      border="1px solid rgba(63,131,248,0.25)"
      borderRadius="2xl"
      opacity={isSaving ? 0.9 : 1}
      transition="opacity 0.2s ease"
    >
      <CardBody
        pb={6}
        display="flex"
        flexDirection="column"
        gap={3}
        sx={{
          '.thesis-editor-content': {
            color: 'rgba(241,245,255,0.92)',
            minHeight: '320px',
            lineHeight: 1.7,
            '& .citation-token': {
              background: 'rgba(147,197,253,0.18)',
              borderBottom: '1px dashed rgba(147,197,253,0.7)',
              borderRadius: '4px',
              padding: '0 2px'
            },
            '& p': {
              marginBottom: '1em'
            }
          }
        }}
      >
        {toolbar ? <HStack justify="flex-start">{toolbar}</HStack> : null}
        <EditorContent editor={editor} />
      </CardBody>
    </Card>
  );
}

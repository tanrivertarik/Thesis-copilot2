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
import { DiffAdditionMark, DiffDeletionMark } from './extensions/DiffHighlight';

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
    extensions: [
      StarterKit,
      CitationHighlightExtension,
      DiffAdditionMark,
      DiffDeletionMark
    ],
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
      bg="white"
      border="none"
      borderRadius="0"
      boxShadow="none"
      opacity={isSaving ? 0.9 : 1}
      transition="opacity 0.2s ease"
    >
      <CardBody
        p={0}
        display="flex"
        flexDirection="column"
        gap={3}
        sx={{
          '.thesis-editor-content': {
            minHeight: '500px',
            outline: 'none',
            color: 'black', // Ensure text is black

            '&:focus': {
              outline: 'none'
            },

            // Inherit all the styling from DocumentPage and ensure black text
            '& > *': {
              outline: 'none',
              color: 'inherit'
            },

            '& p': {
              color: 'black'
            }
          }
        }}
      >
        {toolbar ? (
          <HStack 
            justify="flex-start" 
            position="sticky" 
            top="0" 
            bg="white" 
            zIndex={10}
            py={2}
            borderBottom="1px solid"
            borderColor="gray.200"
            mb={4}
          >
            {toolbar}
          </HStack>
        ) : null}
        <EditorContent editor={editor} />
      </CardBody>
    </Card>
  );
}

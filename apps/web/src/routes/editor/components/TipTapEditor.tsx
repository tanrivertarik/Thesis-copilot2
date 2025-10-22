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
  Tooltip,
  Text,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useEffect, useMemo } from 'react';
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

  // Calculate page count based on content
  // Average academic page: ~250 words with double spacing
  const pageCount = useMemo(() => {
    if (!editor) return 1;

    const html = editor.getHTML();
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(word => word.length > 0);
    const wordCount = words.length;

    // Estimate pages: ~250 words per page for double-spaced academic text
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 250));

    return estimatedPages;
  }, [editor?.state.doc]); // eslint-disable-line react-hooks/exhaustive-deps

  const toolbar = editor ? (
    <HStack spacing={4} width="100%" justify="space-between">
      <HStack spacing={2}>
        <ButtonGroup size="sm" variant="ghost" colorScheme="blue">
          {/* Heading Dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size="sm"
              variant="ghost"
              fontWeight={
                editor.isActive('heading')
                  ? 'semibold'
                  : 'normal'
              }
              bg={editor.isActive('heading') ? 'blue.50' : 'transparent'}
            >
              {editor.isActive('heading', { level: 1 })
                ? 'Heading 1'
                : editor.isActive('heading', { level: 2 })
                ? 'Heading 2'
                : editor.isActive('heading', { level: 3 })
                ? 'Heading 3'
                : 'Normal'}
            </MenuButton>
            <MenuList>
              <MenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                fontWeight={editor.isActive('paragraph') ? 'semibold' : 'normal'}
              >
                Normal text
              </MenuItem>
              <MenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                fontSize="16pt"
                fontWeight="bold"
                bg={editor.isActive('heading', { level: 1 }) ? 'blue.50' : undefined}
              >
                Heading 1
              </MenuItem>
              <MenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                fontSize="14pt"
                fontWeight="bold"
                bg={editor.isActive('heading', { level: 2 }) ? 'blue.50' : undefined}
              >
                Heading 2
              </MenuItem>
              <MenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                fontSize="12pt"
                fontWeight="bold"
                fontStyle="italic"
                bg={editor.isActive('heading', { level: 3 }) ? 'blue.50' : undefined}
              >
                Heading 3
              </MenuItem>
            </MenuList>
          </Menu>

          <Tooltip label="Bold" hasArrow>
            <Button
              fontWeight="bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Toggle bold"
              bg={editor.isActive('bold') ? 'blue.50' : 'transparent'}
            >
              B
            </Button>
          </Tooltip>
          <Tooltip label="Italic" hasArrow>
            <Button
              fontStyle="italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Toggle italic"
              bg={editor.isActive('italic') ? 'blue.50' : 'transparent'}
            >
              I
            </Button>
          </Tooltip>
          <Tooltip label="Bullet list" hasArrow>
            <Button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              aria-label="Toggle bullet list"
              bg={editor.isActive('bulletList') ? 'blue.50' : 'transparent'}
            >
              • List
            </Button>
          </Tooltip>
        </ButtonGroup>
      </HStack>

      {/* Page count indicator */}
      <HStack spacing={2} px={3}>
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </Text>
      </HStack>
    </HStack>
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
            position: 'relative',

            // Visual page break indicators every ~930px (A4 height minus margins)
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 930px,
                #e2e8f0 930px,
                #e2e8f0 932px,
                transparent 932px,
                transparent calc(930px + 2em)
              )
            `,
            backgroundSize: '100% calc(930px + 2em)',
            paddingBottom: '2em',

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
            },

            // Diff highlighting styles - paragraph level
            '& p[data-diff="addition"]': {
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '8px',
              borderRadius: '4px',
              borderLeft: '4px solid #28a745'
            },

            '& p[data-diff="deletion"]': {
              backgroundColor: '#f8d7da',
              color: '#721c24',
              textDecoration: 'line-through',
              padding: '8px',
              borderRadius: '4px',
              borderLeft: '4px solid #dc3545'
            },

            // Diff highlighting styles - span level (legacy support)
            '& span[data-diff="addition"]': {
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '2px 0',
              borderRadius: '2px'
            },

            '& span[data-diff="deletion"]': {
              backgroundColor: '#f8d7da',
              color: '#721c24',
              textDecoration: 'line-through',
              padding: '2px 0',
              borderRadius: '2px'
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

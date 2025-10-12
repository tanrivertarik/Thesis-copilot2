import { Button, Divider, HStack, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { PageShell } from '../shared/PageShell';

export function EditorShell() {
  return (
    <PageShell
      title="Document editor"
      description="Review AI-assisted drafts, apply your edits, and request contextual rewrites."
      actions={
        <HStack spacing={3}>
          <Button as={RouterLink} to="/workspace" variant="ghost" colorScheme="blue">
            Back to workspace
          </Button>
          <Button colorScheme="blue">Request rewrite</Button>
        </HStack>
      }
    >
      <Stack spacing={6} color="blue.50">
        <Text>
          This placeholder represents the upcoming editor powered by TipTap/Slate. We will surface
          the Thesis Constitution, retrieved evidence, and inline citation placeholders here.
        </Text>
        <Divider borderColor="rgba(148, 163, 230, 0.4)" />
        <Text fontSize="sm">
          Next iteration: add document tabs, paragraph-level controls, and cite-as-you-write
          components.
        </Text>
      </Stack>
    </PageShell>
  );
}

import { Card, CardBody, Heading, Stack, Text, Button } from '@chakra-ui/react';
import type { DraftCitation } from '@thesis-copilot/shared';

type CitationSidebarProps = {
  citations: DraftCitation[];
  onInsertCitation?: (placeholder: string) => void;
};

export function CitationSidebar({ citations, onInsertCitation }: CitationSidebarProps) {
  return (
    <Card
      bg="rgba(12,20,34,0.9)"
      border="1px solid rgba(63,131,248,0.25)"
      borderRadius="2xl"
      minW={{ base: '100%', lg: '320px' }}
    >
      <CardBody>
        <Heading size="sm" color="blue.100" mb={4}>
          Citations
        </Heading>
        <Stack spacing={4} color="blue.50">
          {citations.length === 0 ? (
            <Text fontSize="sm" color="blue.200">
              No citations yet. Add sources or request retrieval to see referenced evidence here.
            </Text>
          ) : (
            citations.map((citation) => {
              const author =
                citation.metadata && typeof citation.metadata.author === 'string'
                  ? citation.metadata.author
                  : undefined;
              const yearValue = citation.metadata?.year;
              const year = typeof yearValue === 'string' || typeof yearValue === 'number' ? yearValue : undefined;

              return (
                <Stack key={citation.placeholder} spacing={2} borderBottom="1px solid rgba(63,131,248,0.15)" pb={3}>
                  <Text fontWeight="semibold" color="blue.100">
                    {citation.sourceTitle}
                  </Text>
                  <Text fontSize="xs" color="blue.300">
                    {citation.placeholder}
                    {author ? ` • ${author}` : ''}
                    {year ? ` (${year})` : ''}
                  </Text>
                  <Text fontSize="sm" color="blue.200">
                    {citation.snippet ?? 'Evidence preview snippet will appear here.'}
                  </Text>
                  {onInsertCitation ? (
                    <Button
                      size="sm"
                      alignSelf="flex-start"
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => onInsertCitation(citation.placeholder)}
                    >
                      Insert citation
                    </Button>
                  ) : null}
                </Stack>
              );
            })
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

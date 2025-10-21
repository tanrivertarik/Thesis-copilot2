import {
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Stack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Divider,
  useDisclosure
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect, useMemo } from 'react';
import type { Source } from '@thesis-copilot/shared';
import { fetchSources } from '../../../lib/api';

type CitationPickerProps = {
  projectId: string;
  onInsertCitation: (sourceId: string, sourceTitle: string) => void;
};

export function CitationPicker({ projectId, onInsertCitation }: CitationPickerProps) {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const [sources, setSources] = useState<Source[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load sources when picker opens
  useEffect(() => {
    if (isOpen && sources.length === 0) {
      const loadSources = async () => {
        setIsLoading(true);
        try {
          const fetchedSources = await fetchSources(projectId);
          setSources(fetchedSources);
        } catch (error) {
          console.error('Failed to load sources:', error);
        } finally {
          setIsLoading(false);
        }
      };
      void loadSources();
    }
  }, [isOpen, projectId, sources.length]);

  // Filter sources based on search query
  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) {
      return sources;
    }
    const query = searchQuery.toLowerCase();
    return sources.filter(
      (source) =>
        source.metadata.title.toLowerCase().includes(query) ||
        (source.metadata.author && source.metadata.author.toLowerCase().includes(query)) ||
        (source.metadata.publicationYear && String(source.metadata.publicationYear).includes(query))
    );
  }, [sources, searchQuery]);

  const handleInsertCitation = (source: Source) => {
    onInsertCitation(source.id, source.metadata.title);
    onClose();
    setSearchQuery('');
  };

  return (
    <Box position="fixed" bottom="24px" right="24px" zIndex={1000}>
      <Popover
        isOpen={isOpen}
        onClose={onClose}
        placement="top-end"
        closeOnBlur={true}
      >
        <PopoverTrigger>
          <Button
            colorScheme="blue"
            size="lg"
            borderRadius="full"
            boxShadow="lg"
            onClick={onToggle}
            _hover={{ transform: 'scale(1.05)' }}
            transition="transform 0.2s"
          >
            + Citation
          </Button>
        </PopoverTrigger>
        <PopoverContent width="400px" maxH="500px">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader fontWeight="semibold" fontSize="lg" pb={2}>
            Insert Citation
          </PopoverHeader>
          <PopoverBody p={0}>
            <Stack spacing={0}>
              {/* Search input */}
              <Box px={4} pt={2} pb={3}>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search sources by title, author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    borderRadius="md"
                  />
                </InputGroup>
              </Box>

              <Divider />

              {/* Sources list */}
              <Box maxH="350px" overflowY="auto" px={4} py={2}>
                {isLoading ? (
                  <Text fontSize="sm" color="gray.500" py={4} textAlign="center">
                    Loading sources...
                  </Text>
                ) : filteredSources.length === 0 ? (
                  <Text fontSize="sm" color="gray.500" py={4} textAlign="center">
                    {searchQuery ? 'No sources match your search' : 'No sources available'}
                  </Text>
                ) : (
                  <Stack spacing={2}>
                    {filteredSources.map((source) => (
                      <Box
                        key={source.id}
                        p={3}
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        _hover={{ bg: 'blue.50', borderColor: 'blue.300', cursor: 'pointer' }}
                        onClick={() => handleInsertCitation(source)}
                        transition="all 0.2s"
                      >
                        <Stack spacing={1}>
                          <Text fontWeight="semibold" fontSize="sm" color="gray.800" noOfLines={2}>
                            {source.metadata.title}
                          </Text>
                          <Stack direction="row" spacing={2} align="center">
                            {source.metadata.author && (
                              <Text fontSize="xs" color="gray.600">
                                {source.metadata.author}
                              </Text>
                            )}
                            {source.metadata.publicationYear && (
                              <Badge colorScheme="blue" fontSize="xs">
                                {source.metadata.publicationYear}
                              </Badge>
                            )}
                          </Stack>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Click to insert [CITE:{source.id}]
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
}

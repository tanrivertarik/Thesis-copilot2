import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  HStack,
  VStack,
  Badge
} from '@chakra-ui/react';

type DiffPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  originalHtml: string;
  previewHtml: string;
  reasoning?: string;
  operationType: 'insert' | 'replace' | 'delete' | 'rewrite';
};

export function DiffPreviewModal({
  isOpen,
  onClose,
  onApply,
  originalHtml,
  previewHtml,
  reasoning,
  operationType
}: DiffPreviewModalProps) {
  const operationLabels = {
    insert: 'Insert Content',
    replace: 'Replace Content',
    delete: 'Delete Content',
    rewrite: 'Rewrite Content'
  };

  const operationColors = {
    insert: 'green',
    replace: 'blue',
    delete: 'red',
    rewrite: 'purple'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="1200px">
        <ModalHeader>
          <HStack spacing={3}>
            <Text>AI Edit Preview</Text>
            <Badge colorScheme={operationColors[operationType]} fontSize="sm">
              {operationLabels[operationType]}
            </Badge>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {reasoning && (
              <Box
                p={4}
                bg="blue.50"
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="blue.500"
              >
                <Text fontWeight="semibold" mb={2} color="blue.700">
                  AI Reasoning
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {reasoning}
                </Text>
              </Box>
            )}

            <Box>
              <Text fontWeight="semibold" mb={2} fontSize="sm" color="gray.600">
                Legend
              </Text>
              <HStack spacing={4} fontSize="sm">
                <HStack>
                  <Box
                    w="20px"
                    h="20px"
                    bg="#d4edda"
                    borderRadius="sm"
                    border="1px solid #c3e6cb"
                  />
                  <Text>Added text</Text>
                </HStack>
                <HStack>
                  <Box
                    w="20px"
                    h="20px"
                    bg="#f8d7da"
                    borderRadius="sm"
                    border="1px solid #f5c6cb"
                  />
                  <Text>Deleted text</Text>
                </HStack>
              </HStack>
            </Box>

            {operationType !== 'insert' && originalHtml && (
              <Box>
                <Text fontWeight="semibold" mb={2} color="gray.700">
                  Original Content
                </Text>
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  maxH="300px"
                  overflowY="auto"
                >
                  <Box
                    dangerouslySetInnerHTML={{ __html: originalHtml }}
                    sx={{
                      '& p': {
                        marginBottom: 2,
                        color: 'black'
                      }
                    }}
                  />
                </Box>
              </Box>
            )}

            <Box>
              <Text fontWeight="semibold" mb={2} color="gray.700">
                {operationType === 'delete' ? 'Content to Delete' : 'Preview with Changes'}
              </Text>
              <Box
                p={4}
                bg="white"
                borderRadius="md"
                border="2px solid"
                borderColor="blue.300"
                maxH="400px"
                overflowY="auto"
              >
                <Box
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  sx={{
                    '& p': {
                      marginBottom: 2,
                      color: 'black'
                    },
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
                  }}
                />
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onApply}>
              Apply Changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

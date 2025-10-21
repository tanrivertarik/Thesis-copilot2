import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Stack,
  Box,
  Text,
  Button,
  HStack,
  Badge,
  Divider,
  useToast
} from '@chakra-ui/react';
import { useState } from 'react';
import type { DraftVersion } from '@thesis-copilot/shared';
import { restoreDraftVersion } from '../../../lib/api';

type VersionHistoryProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  sectionId: string;
  versions: DraftVersion[];
  currentVersion: number;
  onVersionRestored: () => void;
};

export function VersionHistory({
  isOpen,
  onClose,
  projectId,
  sectionId,
  versions,
  currentVersion,
  onVersionRestored
}: VersionHistoryProps) {
  const toast = useToast();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      await restoreDraftVersion(projectId, sectionId, versionId);
      toast({
        status: 'success',
        title: 'Version restored',
        description: 'Your document has been restored to the selected version',
        duration: 3000
      });
      onVersionRestored();
      onClose();
    } catch (error) {
      toast({
        status: 'error',
        title: 'Restore failed',
        description: (error as Error).message,
        duration: 5000
      });
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(word => word.length > 0).length;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Version History</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {versions.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No previous versions available yet. Your document will automatically save versions as you work.
            </Text>
          ) : (
            <Stack spacing={3}>
              {versions.map((version, index) => {
                const wordCount = getWordCount(version.html);
                const isLatest = index === 0;

                return (
                  <Box
                    key={version.id}
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={isLatest ? 'blue.200' : 'gray.200'}
                    bg={isLatest ? 'blue.50' : 'white'}
                    _hover={{ borderColor: 'blue.300', bg: isLatest ? 'blue.100' : 'gray.50' }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between" align="start">
                      <Stack spacing={1} flex="1">
                        <HStack>
                          <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                            {formatDate(version.createdAt)}
                          </Text>
                          {isLatest && (
                            <Badge colorScheme="blue" fontSize="xs">
                              Latest
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="xs" color="gray.600">
                          {wordCount} words
                        </Text>
                        {version.summary && (
                          <Text fontSize="xs" color="gray.500" fontStyle="italic">
                            {version.summary}
                          </Text>
                        )}
                        <Divider my={2} />
                        <Text fontSize="xs" color="gray.700" noOfLines={3}>
                          {version.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150)}...
                        </Text>
                      </Stack>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => handleRestore(version.id)}
                        isLoading={restoringId === version.id}
                        isDisabled={restoringId !== null}
                      >
                        Restore
                      </Button>
                    </HStack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

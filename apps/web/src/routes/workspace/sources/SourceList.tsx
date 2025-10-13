import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Stack,
  Text,
  VStack,
  Skeleton,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { fetchSources } from '../../../lib/api';
import type { Source } from '@thesis-copilot/shared';

interface SourceListProps {
  projectId: string;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

function SourceStatusBadge({ status }: { status: Source['status'] }) {
  const statusConfig = {
    UPLOADED: { color: 'yellow', label: 'Uploaded' },
    PROCESSING: { color: 'blue', label: 'Processing...' },
    READY: { color: 'green', label: 'Ready' },
    FAILED: { color: 'red', label: 'Failed' }
  };

  const config = statusConfig[status];
  return <Badge colorScheme={config.color}>{config.label}</Badge>;
}

function SourceCard({ source }: { source: Source }) {
  return (
    <Card size="sm">
      <CardHeader pb={2}>
        <Flex justify="between" align="center">
          <Heading size="md" color="gray.800" noOfLines={1}>
            {source.metadata.title}
          </Heading>
          <SourceStatusBadge status={source.status} />
        </Flex>
      </CardHeader>
      <CardBody pt={0}>
        <Stack spacing={2}>
          <Flex justify="between" align="center" fontSize="sm" color="gray.600">
            <Text>
              <Badge variant="outline" mr={2}>
                {source.kind}
              </Badge>
              {source.metadata.author && `by ${source.metadata.author}`}
              {source.metadata.publicationYear && ` (${source.metadata.publicationYear})`}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(source.createdAt).toLocaleDateString()}
            </Text>
          </Flex>
          
          {source.summary?.abstract && (
            <Text fontSize="sm" color="gray.700" noOfLines={2}>
              {source.summary.abstract}
            </Text>
          )}

          {source.embeddingModel && (
            <Flex justify="between" align="center" fontSize="xs" color="gray.500">
              <Text>Model: {source.embeddingModel}</Text>
              {source.status === 'READY' && (
                <Badge size="sm" colorScheme="green">
                  Searchable
                </Badge>
              )}
            </Flex>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

export function SourceList({ projectId, onRefresh, refreshTrigger }: SourceListProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSources(projectId);
      setSources(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, [projectId, refreshTrigger]);

  const handleRefresh = () => {
    loadSources();
    onRefresh?.();
  };

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height="120px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <AlertDescription>
          Failed to load sources: {error}
          <Button ml={3} size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (sources.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500" fontSize="lg">
          No sources uploaded yet
        </Text>
        <Text color="gray.400" fontSize="sm" mt={2}>
          Upload your first PDF to get started
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Flex justify="between" align="center">
        <Text fontWeight="semibold" color="gray.700">
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </Text>
        <Button size="sm" variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </Flex>
      
      {sources.map((source) => (
        <SourceCard key={source.id} source={source} />
      ))}
    </VStack>
  );
}
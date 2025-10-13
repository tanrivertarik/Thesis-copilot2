import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Progress,
  Stack,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useState, useCallback, useRef } from 'react';
import { createSource, uploadSourceFile } from '../../../lib/api';
import type { SourceIngestionResult } from '@thesis-copilot/shared';

interface FileUploadBoxProps {
  projectId: string;
  onUploadComplete?: (result: SourceIngestionResult) => void;
  disabled?: boolean;
}

export function FileUploadBox({ projectId, onUploadComplete, disabled }: FileUploadBoxProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sourceTitle, setSourceTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a PDF file.',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a PDF file smaller than 10MB.',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        // Create source record first
        const title = sourceTitle.trim() || file.name.replace('.pdf', '');
        const source = await createSource({
          projectId,
          kind: 'PDF',
          metadata: {
            title
          }
        });

        setProgress(30);

        // Upload and process file
        const result = await uploadSourceFile(source.id, file);
        setProgress(100);

        toast({
          title: 'File uploaded successfully',
          description: `${title} has been processed and ingested.`,
          status: 'success',
          duration: 5000,
          isClosable: true
        });

        // Reset form
        setSourceTitle('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        onUploadComplete?.(result);
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: (error as Error).message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [projectId, sourceTitle, onUploadComplete, toast]
  );

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box
      borderWidth={2}
      borderStyle="dashed"
      borderColor={uploading ? 'blue.400' : 'gray.300'}
      borderRadius="lg"
      p={8}
      textAlign="center"
      cursor={disabled || uploading ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.6 : 1}
      transition="all 0.2s"
      _hover={
        !disabled && !uploading
          ? {
              borderColor: 'blue.400',
              bg: 'gray.50'
            }
          : {}
      }
      onClick={!disabled && !uploading ? handleBoxClick : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      <VStack spacing={4}>
        {uploading ? (
          <>
            <Text fontSize="lg" fontWeight="medium" color="blue.600">
              Processing your PDF...
            </Text>
            <Progress value={progress} colorScheme="blue" w="100%" />
            <Text fontSize="sm" color="gray.600">
              {progress < 30
                ? 'Creating source record...'
                : progress < 100
                ? 'Extracting text and generating embeddings...'
                : 'Finalizing ingestion...'}
            </Text>
          </>
        ) : (
          <>
            <Stack spacing={3} w="100%" maxW="300px">
              <FormControl>
                <FormLabel fontSize="sm" color="gray.700">
                  Source title (optional)
                </FormLabel>
                <Input
                  placeholder="e.g., Smith et al. 2023 - Key Findings"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  size="sm"
                  bg="white"
                />
              </FormControl>
            </Stack>
            <Text fontSize="lg" fontWeight="medium" color="gray.700">
              Click to upload PDF
            </Text>
            <Text fontSize="sm" color="gray.500">
              or drag and drop a PDF file here
            </Text>
            <Text fontSize="xs" color="gray.400">
              Maximum file size: 10MB
            </Text>
          </>
        )}
      </VStack>
    </Box>
  );
}
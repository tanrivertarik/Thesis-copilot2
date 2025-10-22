import { Box, VStack, Text } from '@chakra-ui/react';
import { type ReactNode } from 'react';

type PagedDocumentViewProps = {
  children: ReactNode;
  pageCount: number;
};

/**
 * PagedDocumentView renders content across multiple separate page boxes,
 * similar to Google Docs multi-page view.
 */
export function PagedDocumentView({ children, pageCount }: PagedDocumentViewProps) {
  return (
    <Box
      bg="gray.100"
      minH="100vh"
      py={8}
      px={4}
      display="flex"
      justifyContent="center"
    >
      <VStack spacing={6} align="center">
        {Array.from({ length: Math.max(1, pageCount) }).map((_, pageIndex) => (
          <Box
            key={pageIndex}
            bg="white"
            width="21cm" // A4 width
            height="29.7cm" // A4 height
            boxShadow="0 0 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08)"
            borderRadius="2px"
            padding="2.54cm"
            position="relative"
            overflow="hidden"
            sx={{
              // Academic paper typography
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '12pt',
              lineHeight: '2.0',
              color: 'black',

              // Proper paragraph styling
              '& p': {
                marginBottom: '0',
                textAlign: 'justify',
                textIndent: '0.5in',
                color: 'black',
                '&:first-of-type': {
                  textIndent: '0'
                }
              },

              // Heading styles
              '& h1': {
                fontSize: '16pt',
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: '0',
                marginBottom: '1em',
                textTransform: 'uppercase',
                color: 'black'
              },

              '& h2': {
                fontSize: '14pt',
                fontWeight: 'bold',
                marginTop: '1.5em',
                marginBottom: '0.75em',
                textIndent: '0',
                color: 'black'
              },

              '& h3': {
                fontSize: '12pt',
                fontWeight: 'bold',
                fontStyle: 'italic',
                marginTop: '1em',
                marginBottom: '0.5em',
                textIndent: '0',
                color: 'black'
              },

              // List styling
              '& ul, & ol': {
                marginLeft: '0.5in',
                marginBottom: '1em'
              },

              '& li': {
                marginBottom: '0.5em',
                color: 'black'
              },

              // Citation styling
              '& .citation-token': {
                color: '#1e40af',
                fontWeight: '500',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '0 4px',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'rgba(59, 130, 246, 0.2)'
                }
              }
            }}
          >
            {/* Only render content on first page */}
            {pageIndex === 0 && children}

            {/* Page number */}
            <Text
              position="absolute"
              bottom="1.5cm"
              left="50%"
              transform="translateX(-50%)"
              fontSize="10pt"
              color="gray.600"
              fontFamily='"Times New Roman", Times, serif'
            >
              {pageIndex + 1}
            </Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

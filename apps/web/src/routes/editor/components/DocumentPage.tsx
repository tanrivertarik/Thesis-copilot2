import { Box, Text } from '@chakra-ui/react';
import { type ReactNode } from 'react';

type DocumentPageProps = {
  children: ReactNode;
  showPageNumbers?: boolean;
  pageNumber?: number;
};

/**
 * DocumentPage component that styles content to look like a professional
 * document page (similar to Google Docs) with A4 dimensions, margins, and shadows.
 */
export function DocumentPage({ children, showPageNumbers = true, pageNumber = 1 }: DocumentPageProps) {
  return (
    <Box
      // Gray background like Google Docs
      bg="gray.100"
      minH="100vh"
      py={8}
      px={4}
      display="flex"
      justifyContent="center"
    >
      <Box
        // White page with A4-like dimensions (allowing multi-page)
        bg="white"
        width="100%"
        maxWidth="21cm" // A4 width
        minHeight="29.7cm" // A4 height (but can grow for multi-page)
        boxShadow="0 0 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08)"
        borderRadius="2px"
        // Page margins (2.54cm = 1 inch on all sides for academic papers)
        padding="2.54cm"
        position="relative"
        sx={{
          // Academic paper typography
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: '12pt',
          lineHeight: '2.0', // Double spacing for thesis
          color: 'black',
          
          // Proper paragraph styling
          '& p': {
            marginBottom: '0', // No extra space in double-spacing
            textAlign: 'justify',
            textIndent: '0.5in', // First line indent for paragraphs
            '&:first-of-type': {
              textIndent: '0' // No indent for first paragraph
            }
          },
          
          // Heading styles
          '& h1': {
            fontSize: '16pt',
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: '0',
            marginBottom: '1em',
            textTransform: 'uppercase'
          },
          
          '& h2': {
            fontSize: '14pt',
            fontWeight: 'bold',
            marginTop: '1.5em',
            marginBottom: '0.75em',
            textIndent: '0'
          },
          
          '& h3': {
            fontSize: '12pt',
            fontWeight: 'bold',
            fontStyle: 'italic',
            marginTop: '1em',
            marginBottom: '0.5em',
            textIndent: '0'
          },
          
          // List styling
          '& ul, & ol': {
            marginLeft: '0.5in',
            marginBottom: '1em'
          },
          
          '& li': {
            marginBottom: '0.5em'
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
          },
          
          // Block quote styling
          '& blockquote': {
            marginLeft: '0.5in',
            marginRight: '0.5in',
            marginTop: '1em',
            marginBottom: '1em',
            fontStyle: 'italic',
            borderLeft: '3px solid #e5e7eb',
            paddingLeft: '1em'
          },

          // Page break support for multi-page documents
          '& .page-break': {
            pageBreakAfter: 'always',
            breakAfter: 'page',
            borderTop: '2px dashed #cbd5e0',
            marginTop: '2em',
            marginBottom: '2em',
            paddingTop: '2em',
            position: 'relative',
            '&::before': {
              content: '"Page Break"',
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10pt',
              color: '#718096',
              backgroundColor: 'white',
              padding: '0 8px'
            }
          },

          // Visual page indicator (every ~29.7cm of content)
          '& h1:not(:first-of-type), & h2:not(:first-of-type)': {
            pageBreakBefore: 'avoid'
          },

          // Print-friendly
          '@media print': {
            boxShadow: 'none',
            margin: 0,
            padding: '1in',
            pageBreakInside: 'avoid',

            // Remove visual page break indicators in print
            '& .page-break::before': {
              display: 'none'
            },

            '& .page-break': {
              borderTop: 'none',
              marginTop: 0,
              marginBottom: 0,
              paddingTop: 0
            }
          }
        }}
      >
        {children}

        {/* Page number (bottom center) */}
        {showPageNumbers && (
          <Text
            position="absolute"
            bottom="1.5cm"
            left="50%"
            transform="translateX(-50%)"
            fontSize="10pt"
            color="gray.600"
            fontFamily='"Times New Roman", Times, serif'
            sx={{
              '@media print': {
                color: 'black'
              }
            }}
          >
            {pageNumber}
          </Text>
        )}
      </Box>
    </Box>
  );
}

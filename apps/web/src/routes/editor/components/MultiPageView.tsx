import { Box, VStack, Text } from '@chakra-ui/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

type MultiPageViewProps = {
  children: ReactNode;
};

/**
 * MultiPageView wraps content and displays it across multiple A4-sized pages
 * with visual separation, similar to Google Docs.
 */
export function MultiPageView({ children }: MultiPageViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!contentRef.current) return;

    const calculatePages = () => {
      const contentHeight = contentRef.current?.scrollHeight || 0;
      // A4 height (29.7cm) minus top/bottom padding (2.54cm each) = ~24.62cm usable ≈ 930px
      const usablePageHeight = 930;
      const calculated = Math.max(1, Math.ceil(contentHeight / usablePageHeight));
      setPageCount(calculated);
    };

    // Initial calculation
    calculatePages();

    // Watch for content changes
    const resizeObserver = new ResizeObserver(calculatePages);
    const mutationObserver = new MutationObserver(calculatePages);

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children]);

  return (
    <Box bg="gray.100" minH="100vh" py={8} px={4}>
      <VStack spacing={8} align="center">
        {Array.from({ length: pageCount }).map((_, pageIndex) => (
          <Box
            key={pageIndex}
            bg="white"
            width="21cm" // A4 width
            minHeight="29.7cm" // A4 height
            boxShadow="0 0 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08)"
            borderRadius="2px"
            padding="2.54cm"
            position="relative"
            sx={{
              // Academic paper typography
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '12pt',
              lineHeight: '2.0',
              color: 'black',

              // Only show content for first page initially
              ...(pageIndex === 0
                ? {}
                : {
                    visibility: 'hidden',
                    position: 'absolute',
                    top: '-9999px'
                  })
            }}
          >
            {pageIndex === 0 && (
              <Box ref={contentRef} sx={{ '& > *': { color: 'black' } }}>
                {children}
              </Box>
            )}

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

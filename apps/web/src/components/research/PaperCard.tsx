import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Checkbox,
  Icon,
  Link,
  Collapse,
  Button
} from '@chakra-ui/react';
import { useState } from 'react';
import { ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import type { AcademicPaper } from '../../lib/deep-research-api';

type PaperCardProps = {
  paper: AcademicPaper;
  isSelected: boolean;
  onToggle: (paperId: string) => void;
};

export function PaperCard({ paper, isSelected, onToggle }: PaperCardProps) {
  const [showAbstract, setShowAbstract] = useState(false);

  return (
    <Box
      borderWidth="1px"
      borderColor={isSelected ? 'blue.300' : 'gray.200'}
      borderRadius="lg"
      p={4}
      bg={isSelected ? 'blue.50' : 'white'}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        borderColor: 'blue.300',
        shadow: 'sm'
      }}
      onClick={() => onToggle(paper.id)}
    >
      <HStack align="start" spacing={3}>
        {/* Checkbox */}
        <Checkbox
          isChecked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggle(paper.id);
          }}
          size="lg"
          colorScheme="blue"
          mt={1}
        />

        {/* Content */}
        <VStack align="stretch" spacing={2} flex={1}>
          {/* Title */}
          <Text
            fontWeight="semibold"
            fontSize="md"
            color="gray.800"
            lineHeight="1.4"
          >
            {paper.title}
          </Text>

          {/* Authors and Year */}
          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="sm" color="gray.600">
              {paper.authors}
            </Text>
            {paper.year && (
              <>
                <Text fontSize="sm" color="gray.400">•</Text>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  {paper.year}
                </Text>
              </>
            )}
          </HStack>

          {/* Badges */}
          <HStack spacing={2} flexWrap="wrap">
            {/* Citation Count */}
            <Badge colorScheme="purple" fontSize="xs">
              {paper.citationCount.toLocaleString()} citations
            </Badge>

            {/* Venue */}
            {paper.venue && (
              <Badge colorScheme="gray" fontSize="xs">
                {paper.venue}
              </Badge>
            )}

            {/* PDF Available */}
            {paper.pdfUrl && (
              <Badge colorScheme="green" fontSize="xs">
                PDF Available
              </Badge>
            )}
          </HStack>

          {/* Abstract Toggle */}
          {paper.abstract && (
            <>
              <Button
                size="xs"
                variant="ghost"
                leftIcon={showAbstract ? <ChevronUpIcon /> : <ChevronDownIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAbstract(!showAbstract);
                }}
                width="fit-content"
              >
                {showAbstract ? 'Hide' : 'Show'} Abstract
              </Button>

              <Collapse in={showAbstract}>
                <Box
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderColor="blue.300"
                >
                  <Text fontSize="sm" color="gray.700" lineHeight="1.6">
                    {paper.abstract}
                  </Text>
                </Box>
              </Collapse>
            </>
          )}

          {/* Links */}
          <HStack spacing={3} pt={1}>
            <Link
              href={paper.sourceUrl}
              isExternal
              fontSize="sm"
              color="blue.600"
              onClick={(e) => e.stopPropagation()}
            >
              View on Semantic Scholar <Icon as={ExternalLinkIcon} mx="2px" />
            </Link>

            {paper.pdfUrl && (
              <Link
                href={paper.pdfUrl}
                isExternal
                fontSize="sm"
                color="green.600"
                onClick={(e) => e.stopPropagation()}
              >
                Download PDF <Icon as={ExternalLinkIcon} mx="2px" />
              </Link>
            )}
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}

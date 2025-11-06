/**
 * EnhancedProjectCard Component
 *
 * Modern project card with progress tracking, metrics, and visual indicators.
 */

import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Progress,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Grid,
} from '@chakra-ui/react';
import {
  FileText,
  Clock,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  ArrowRight,
  BookOpen,
  Target,
} from 'lucide-react';
import type { Project } from '@thesis-copilot/shared';

interface EnhancedProjectCardProps {
  project: Project;
  onOpen: (projectId: string) => void;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onDuplicate?: (projectId: string) => void;
}

const statusColors = {
  planning: { bg: 'rgba(107, 114, 128, 0.1)', color: '#4B5563', stripe: '#9CA3AF' },
  research: { bg: 'rgba(168, 85, 247, 0.1)', color: '#7E22CE', stripe: '#A855F7' },
  writing: { bg: 'rgba(59, 130, 246, 0.1)', color: '#1E40AF', stripe: '#3B82F6' },
  review: { bg: 'rgba(249, 115, 22, 0.1)', color: '#C2410C', stripe: '#F97316' },
  complete: { bg: 'rgba(34, 197, 94, 0.1)', color: '#15803D', stripe: '#22C55E' },
  overdue: { bg: 'rgba(239, 68, 68, 0.1)', color: '#B91C1C', stripe: '#EF4444' },
};

export function EnhancedProjectCard({
  project,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
}: EnhancedProjectCardProps) {
  const sectionCount = project.constitution?.outline.sections.length ?? 0;
  const hasConstitution = !!project.constitution;

  // Calculate progress (mock - would come from actual data)
  const progress = hasConstitution ? Math.min((sectionCount / 10) * 100, 100) : 10;

  // Determine status
  const status = !hasConstitution ? 'planning' : progress < 100 ? 'writing' : 'complete';
  const colors = statusColors[status];

  // Mock word count (would come from actual data)
  const wordCount = Math.floor(Math.random() * 15000);

  // Format last updated
  const lastUpdated = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Not updated';

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      border="1px solid"
      borderColor="#E5E7EB"
      _hover={{
        borderColor: colors.stripe,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transform: 'translateY(-8px)',
      }}
      onClick={() => onOpen(project.id)}
    >
      {/* Color-coded header stripe */}
      <Box h="4px" bg={colors.stripe} />

      {/* Card content */}
      <Box p={6}>
        {/* Header with title and menu */}
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Heading
            size="md"
            color="#2D3748"
            fontFamily="Lora"
            noOfLines={2}
            flex={1}
            pr={3}
            lineHeight="shorter"
          >
            {project.title}
          </Heading>

          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVertical size={18} />}
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              _hover={{ bg: 'rgba(0,0,0,0.05)' }}
            />
            <MenuList>
              {onEdit && (
                <MenuItem
                  icon={<Edit3 size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project.id);
                  }}
                >
                  Edit
                </MenuItem>
              )}
              {onDuplicate && (
                <MenuItem
                  icon={<Copy size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(project.id);
                  }}
                >
                  Duplicate
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem
                  icon={<Trash2 size={16} />}
                  color="red.600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                >
                  Delete
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </Flex>

        {/* Description */}
        {project.description && (
          <Text
            color="#6B7280"
            fontSize="sm"
            noOfLines={2}
            lineHeight="tall"
            mb={4}
            minH="40px"
          >
            {project.description}
          </Text>
        )}

        {/* Progress section */}
        <Box mb={4}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="xs" color="#6B7280" fontWeight="medium">
              Progress
            </Text>
            <Text fontSize="xs" fontWeight="bold" color={colors.color}>
              {Math.round(progress)}%
            </Text>
          </Flex>
          <Progress
            value={progress}
            size="sm"
            borderRadius="full"
            bg="#F3F4F6"
            sx={{
              '& > div': {
                backgroundColor: colors.stripe,
              },
            }}
          />
        </Box>

        {/* Metrics grid */}
        <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={4}>
          {/* Sections */}
          <VStack
            spacing={1}
            align="center"
            p={3}
            bg="#F9FAFB"
            borderRadius="lg"
          >
            <FileText size={16} color="#6B7280" />
            <Text fontSize="lg" fontWeight="bold" color="#2D3748">
              {sectionCount}
            </Text>
            <Text fontSize="xs" color="#9CA3AF">
              sections
            </Text>
          </VStack>

          {/* Words */}
          <VStack
            spacing={1}
            align="center"
            p={3}
            bg="#F9FAFB"
            borderRadius="lg"
          >
            <BookOpen size={16} color="#6B7280" />
            <Text fontSize="lg" fontWeight="bold" color="#2D3748">
              {(wordCount / 1000).toFixed(1)}k
            </Text>
            <Text fontSize="xs" color="#9CA3AF">
              words
            </Text>
          </VStack>

          {/* Status */}
          <VStack
            spacing={1}
            align="center"
            p={3}
            bg="#F9FAFB"
            borderRadius="lg"
          >
            <Target size={16} color="#6B7280" />
            <Text fontSize="xs" fontWeight="bold" color={colors.color} noOfLines={1}>
              {status}
            </Text>
            <Text fontSize="xs" color="#9CA3AF">
              status
            </Text>
          </VStack>
        </Grid>

        {/* Status badges */}
        <HStack spacing={2} mb={4}>
          <Badge
            bg={colors.bg}
            color={colors.color}
            fontSize="xs"
            px={3}
            py={1}
            borderRadius="full"
            fontWeight="semibold"
            textTransform="capitalize"
          >
            {status}
          </Badge>
          <Badge
            variant="subtle"
            colorScheme="gray"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            {project.citationStyle}
          </Badge>
        </HStack>

        {/* Footer with timestamp and CTA */}
        <Flex justify="space-between" align="center">
          <HStack spacing={2} color="#9CA3AF" fontSize="xs">
            <Clock size={14} />
            <Text>Updated {lastUpdated}</Text>
          </HStack>

          <HStack spacing={2}>
            <IconButton
              icon={<ArrowRight size={16} />}
              size="sm"
              colorScheme="blue"
              variant="ghost"
              aria-label="Open project"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(project.id);
              }}
            />
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
}

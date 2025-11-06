/**
 * ActivityTimeline Component
 *
 * Displays recent activity feed with icons and timestamps.
 */

import { Box, VStack, HStack, Text, Flex } from '@chakra-ui/react';
import { StaggerContainer, StaggerItem } from '@/lib/animations';

export interface ActivityItem {
  id: string;
  icon: React.ReactElement;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  title: string;
  description: string;
  time: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const colorSchemes = {
  blue: {
    bg: 'rgba(59, 130, 246, 0.1)',
    iconColor: '#2563EB',
    dotBg: '#2563EB',
  },
  green: {
    bg: 'rgba(34, 197, 94, 0.1)',
    iconColor: '#16A34A',
    dotBg: '#16A34A',
  },
  purple: {
    bg: 'rgba(168, 85, 247, 0.1)',
    iconColor: '#9333EA',
    dotBg: '#9333EA',
  },
  orange: {
    bg: 'rgba(249, 115, 22, 0.1)',
    iconColor: '#EA580C',
    dotBg: '#EA580C',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.1)',
    iconColor: '#DC2626',
    dotBg: '#DC2626',
  },
};

export function ActivityTimeline({ activities, maxItems = 5 }: ActivityTimelineProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <Box
        textAlign="center"
        py={8}
        color="#9CA3AF"
      >
        <Text fontSize="sm">No recent activity</Text>
      </Box>
    );
  }

  return (
    <StaggerContainer staggerDelay={0.08}>
      <VStack spacing={0} align="stretch">
        {displayActivities.map((activity, index) => {
          const colors = colorSchemes[activity.color];
          const isLast = index === displayActivities.length - 1;

          return (
            <StaggerItem key={activity.id}>
              <Flex gap={4} position="relative">
                {/* Timeline line */}
                {!isLast && (
                  <Box
                    position="absolute"
                    left="19px"
                    top="40px"
                    bottom="-16px"
                    w="2px"
                    bg="#E5E7EB"
                  />
                )}

                {/* Icon circle */}
                <Box position="relative" flexShrink={0}>
                  <Box
                    w="40px"
                    h="40px"
                    bg={colors.bg}
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color={colors.iconColor}
                    position="relative"
                    zIndex={1}
                  >
                    {activity.icon}
                  </Box>
                </Box>

                {/* Content */}
                <Box flex={1} pb={4}>
                  <Flex justify="space-between" align="flex-start" mb={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="#2D3748"
                    >
                      {activity.title}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="#9CA3AF"
                      flexShrink={0}
                      ml={2}
                    >
                      {activity.time}
                    </Text>
                  </Flex>
                  <Text
                    fontSize="sm"
                    color="#6B7280"
                    lineHeight="tall"
                  >
                    {activity.description}
                  </Text>
                </Box>
              </Flex>
            </StaggerItem>
          );
        })}
      </VStack>
    </StaggerContainer>
  );
}

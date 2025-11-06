/**
 * StatCard Component
 *
 * Displays a key metric with icon, value, label, and trend indicator.
 * Used in dashboard overview section.
 */

import { Box, Flex, Text, HStack } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '@/lib/animations';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactElement;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorSchemes = {
  blue: {
    bg: 'rgba(59, 130, 246, 0.1)',
    iconBg: 'rgba(59, 130, 246, 0.15)',
    iconColor: '#2563EB',
    text: '#1E40AF',
    trendColor: '#2563EB',
  },
  green: {
    bg: 'rgba(34, 197, 94, 0.1)',
    iconBg: 'rgba(34, 197, 94, 0.15)',
    iconColor: '#16A34A',
    text: '#15803D',
    trendColor: '#16A34A',
  },
  purple: {
    bg: 'rgba(168, 85, 247, 0.1)',
    iconBg: 'rgba(168, 85, 247, 0.15)',
    iconColor: '#9333EA',
    text: '#7E22CE',
    trendColor: '#9333EA',
  },
  orange: {
    bg: 'rgba(249, 115, 22, 0.1)',
    iconBg: 'rgba(249, 115, 22, 0.15)',
    iconColor: '#EA580C',
    text: '#C2410C',
    trendColor: '#EA580C',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.1)',
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconColor: '#DC2626',
    text: '#B91C1C',
    trendColor: '#DC2626',
  },
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendUp = true,
  color = 'blue',
}: StatCardProps) {
  const colors = colorSchemes[color];

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#E5E7EB"
      borderRadius="xl"
      p={6}
      transition="all 0.2s"
      _hover={{
        borderColor: colors.iconColor,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        transform: 'translateY(-2px)',
      }}
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box
          w="48px"
          h="48px"
          bg={colors.iconBg}
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={colors.iconColor}
        >
          {icon}
        </Box>
      </Flex>

      <Text
        fontSize="3xl"
        fontWeight="bold"
        color="#2D3748"
        lineHeight="1"
        mb={2}
      >
        <AnimatedCounter value={value} duration={1200} />
      </Text>

      <Text
        fontSize="sm"
        color="#6B7280"
        fontWeight="medium"
        mb={trend ? 2 : 0}
      >
        {label}
      </Text>

      {trend && (
        <HStack spacing={1}>
          <Text
            fontSize="xs"
            color={trendUp ? colors.trendColor : '#DC2626'}
            fontWeight="semibold"
          >
            {trendUp ? '↗' : '↘'} {trend}
          </Text>
        </HStack>
      )}
    </Box>
  );
}

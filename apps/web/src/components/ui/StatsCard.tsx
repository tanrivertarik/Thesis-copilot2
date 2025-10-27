import { Box, Heading, Text, Flex } from "@chakra-ui/react";
import { type LucideIcon } from "lucide-react";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, color = "#607A94" }: StatsCardProps) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#E5E7EB"
      borderRadius="xl"
      p={6}
      transition="all 0.2s"
      _hover={{
        boxShadow: '0 4px 12px rgba(96, 122, 148, 0.1)',
        transform: 'translateY(-2px)'
      }}
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box
          w="48px"
          h="48px"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={`${color}15`}
        >
          <Icon size={24} color={color} />
        </Box>
        {trend && (
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={trend.isPositive ? '#10B981' : '#EF4444'}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </Text>
        )}
      </Flex>
      <Heading size="lg" color="#2D3748" fontFamily="Lora" mb={1}>
        {value}
      </Heading>
      <Text fontSize="sm" color="#6B7280">
        {title}
      </Text>
    </Box>
  );
}


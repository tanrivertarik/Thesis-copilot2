import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Heading, Stack, Text } from '@chakra-ui/react';

type PageShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <Box
      w="full"
      borderRadius="2xl"
      bg="white"
      border="1px solid rgba(91, 130, 245, 0.12)"
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
      px={{ base: 8, md: 12 }}
      py={{ base: 10, md: 14 }}
    >
      <Stack spacing={{ base: 8, md: 10 }}>
        <Stack spacing={4}>
          <Heading size="2xl" letterSpacing="-0.04em" color="gray.900">
            {title}
          </Heading>
          {description ? (
            <Text fontSize="lg" color="gray.600">
              {description}
            </Text>
          ) : null}
        </Stack>

        {actions ? <Stack spacing={3}>{actions}</Stack> : null}

        {children}
      </Stack>
    </Box>
  );
}

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
      bg="rgba(15, 23, 42, 0.85)"
      border="1px solid rgba(63,131,248,0.25)"
      boxShadow="2xl"
      px={{ base: 8, md: 12 }}
      py={{ base: 10, md: 14 }}
    >
      <Stack spacing={{ base: 8, md: 10 }}>
        <Stack spacing={4}>
          <Heading size="2xl" letterSpacing="-0.04em">
            {title}
          </Heading>
          {description ? (
            <Text fontSize="lg" color="blue.100">
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

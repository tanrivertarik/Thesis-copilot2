import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Heading, Stack, Text } from '@chakra-ui/react';

type PageShellProps = PropsWithChildren<{
  title: string | ReactNode;
  description?: string;
  actions?: ReactNode;
}>;

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <Box
      w="full"
      borderRadius="lg"
      bg="academic.paper"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.05)"
      px={{ base: 8, md: 12 }}
      py={{ base: 10, md: 14 }}
    >
      <Stack spacing={{ base: 8, md: 10 }}>
        <Stack spacing={4}>
          <Heading 
            size="2xl" 
            letterSpacing="-0.02em" 
            fontFamily="heading"
            color="academic.primaryText"
            fontWeight="bold"
          >
            {title}
          </Heading>
          {description ? (
            <Text fontSize="lg" color="academic.secondaryText" fontFamily="body">
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

import { Outlet } from 'react-router-dom';
import { Box, Container } from '@chakra-ui/react';

export function AppLayout() {
  return (
    <Box
      minH="100vh"
      bgGradient="radial(surface, #020617)"
      display="flex"
      alignItems="stretch"
    >
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 12 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

import { Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { Navbar } from '../../components/layout/Navbar';

export function AppLayout() {
  return (
    <Box minH="100vh" bg="academic.background">
      <Navbar />
      <Outlet />
    </Box>
  );
}

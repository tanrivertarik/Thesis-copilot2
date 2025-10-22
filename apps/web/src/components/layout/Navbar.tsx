import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  HStack,
  Button,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function Navbar() {
  const { user, signOutUser } = useAuth();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Don't show navbar on landing page or login
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={1000}
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      boxShadow="sm"
    >
      <Container maxW="7xl" py={3}>
        <Flex align="center" justify="space-between">
          {/* Logo/Brand */}
          <HStack spacing={8}>
            <RouterLink to="/dashboard">
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="academic.accent"
                fontFamily="heading"
                _hover={{ color: 'academic.accentHover' }}
                transition="color 0.2s"
              >
                Thesis Copilot
              </Text>
            </RouterLink>

            {/* Navigation Links */}
            {user && (
              <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                <Button
                  as={RouterLink}
                  to="/dashboard"
                  variant="ghost"
                  size="sm"
                  colorScheme={isActive('/dashboard') ? 'brand' : 'gray'}
                  bg={isActive('/dashboard') ? 'brand.50' : 'transparent'}
                  fontWeight={isActive('/dashboard') ? 'semibold' : 'normal'}
                >
                  Dashboard
                </Button>
                <Button
                  as={RouterLink}
                  to="/workspace"
                  variant="ghost"
                  size="sm"
                  colorScheme={isActive('/workspace') ? 'brand' : 'gray'}
                  bg={isActive('/workspace') ? 'brand.50' : 'transparent'}
                  fontWeight={isActive('/workspace') ? 'semibold' : 'normal'}
                >
                  Workspace
                </Button>
                <Button
                  as={RouterLink}
                  to="/workspace/sources"
                  variant="ghost"
                  size="sm"
                  colorScheme={isActive('/workspace/sources') ? 'brand' : 'gray'}
                  bg={isActive('/workspace/sources') ? 'brand.50' : 'transparent'}
                  fontWeight={isActive('/workspace/sources') ? 'semibold' : 'normal'}
                >
                  Sources
                </Button>
              </HStack>
            )}
          </HStack>

          {/* User Menu */}
          {user && (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                rightIcon={<ChevronDownIcon />}
              >
                <HStack spacing={2}>
                  <Avatar size="xs" name={user.email || user.uid} bg="academic.accent" />
                  <Text fontSize="sm" display={{ base: 'none', md: 'block' }}>
                    {user.email || 'User'}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/dashboard">
                  Dashboard
                </MenuItem>
                <MenuItem as={RouterLink} to="/workspace">
                  Workspace
                </MenuItem>
                <MenuItem as={RouterLink} to="/workspace/sources">
                  Source Manager
                </MenuItem>
                <MenuItem onClick={signOutUser} color="red.500">
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Container>
    </Box>
  );
}

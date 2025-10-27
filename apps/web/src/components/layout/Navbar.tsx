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
  Avatar
} from '@chakra-ui/react';
import { ChevronDown, Home, FolderOpen, LogOut } from 'lucide-react';
import { useAuth } from '../../app/providers/firebase/AuthProvider';

export function Navbar() {
  const { user, signOutUser } = useAuth();
  const location = useLocation();

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
      bg="rgba(248, 248, 247, 0.8)"
      backdropFilter="blur(12px)"
      borderBottom="1px solid"
      borderColor="rgba(229, 231, 235, 0.8)"
    >
      <Container maxW="7xl" py={4}>
        <Flex align="center" justify="space-between">
          {/* Logo/Brand */}
          <RouterLink to="/dashboard">
            <Text
              fontSize="xl"
              fontWeight="600"
              color="#2D3748"
              fontFamily="Lora"
              _hover={{ color: '#607A94' }}
              transition="color 0.2s"
            >
              Thesis Copilot
            </Text>
          </RouterLink>

          {/* Navigation Pills */}
          {user && (
            <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
              <Button
                as={RouterLink}
                to="/dashboard"
                variant="ghost"
                size="sm"
                leftIcon={<Home size={16} />}
                bg={isActive('/dashboard') ? 'rgba(96, 122, 148, 0.1)' : 'transparent'}
                color={isActive('/dashboard') ? '#607A94' : '#6B7280'}
                fontWeight={isActive('/dashboard') ? '600' : '500'}
                borderRadius="xl"
                px={4}
                _hover={{
                  bg: 'rgba(96, 122, 148, 0.08)',
                  color: '#607A94'
                }}
              >
                Dashboard
              </Button>
              <Button
                as={RouterLink}
                to="/workspace"
                variant="ghost"
                size="sm"
                leftIcon={<FolderOpen size={16} />}
                bg={isActive('/workspace') ? 'rgba(96, 122, 148, 0.1)' : 'transparent'}
                color={isActive('/workspace') ? '#607A94' : '#6B7280'}
                fontWeight={isActive('/workspace') ? '600' : '500'}
                borderRadius="xl"
                px={4}
                _hover={{
                  bg: 'rgba(96, 122, 148, 0.08)',
                  color: '#607A94'
                }}
              >
                Workspace
              </Button>
            </HStack>
          )}

          {/* User Menu */}
          {user && (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                rightIcon={<ChevronDown size={16} />}
                borderRadius="xl"
                px={3}
                _hover={{
                  bg: 'rgba(96, 122, 148, 0.08)'
                }}
              >
                <HStack spacing={2}>
                  <Avatar 
                    size="xs" 
                    name={user.email || user.uid} 
                    bg="#607A94"
                    color="white"
                  />
                  <Text 
                    fontSize="sm" 
                    display={{ base: 'none', md: 'block' }}
                    color="#2D3748"
                    fontWeight="500"
                  >
                    {user.email?.split('@')[0] || 'User'}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList
                bg="white"
                border="1px solid"
                borderColor="#E5E7EB"
                borderRadius="xl"
                boxShadow="0 10px 40px rgba(0,0,0,0.1)"
                py={2}
                minW="200px"
              >
                <MenuItem 
                  as={RouterLink} 
                  to="/dashboard"
                  icon={<Home size={16} />}
                  borderRadius="lg"
                  mx={2}
                  fontSize="sm"
                  color="#2D3748"
                  _hover={{
                    bg: 'rgba(96, 122, 148, 0.08)'
                  }}
                >
                  Dashboard
                </MenuItem>
                <MenuItem 
                  as={RouterLink} 
                  to="/workspace"
                  icon={<FolderOpen size={16} />}
                  borderRadius="lg"
                  mx={2}
                  fontSize="sm"
                  color="#2D3748"
                  _hover={{
                    bg: 'rgba(96, 122, 148, 0.08)'
                  }}
                >
                  Workspace
                </MenuItem>
                <Box h="1px" bg="#E5E7EB" my={2} mx={2} />
                <MenuItem 
                  onClick={signOutUser} 
                  icon={<LogOut size={16} />}
                  color="#DC2626"
                  borderRadius="lg"
                  mx={2}
                  fontSize="sm"
                  _hover={{
                    bg: 'rgba(220, 38, 38, 0.08)'
                  }}
                >
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

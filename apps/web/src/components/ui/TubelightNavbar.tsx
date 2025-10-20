import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface TubelightNavbarProps {
  items: NavItem[];
  className?: string;
}

export function TubelightNavbar({ items, className }: TubelightNavbarProps) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set active tab based on current location
    const currentItem = items.find(item => item.url === location.pathname);
    if (currentItem) {
      setActiveTab(currentItem.name);
    }
  }, [location.pathname, items]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box
      position="fixed"
      top={{ base: 'auto', md: '0' }}
      bottom={{ base: '0', md: '0' }}
      left="50%"
      transform="translateX(-50%)"
      zIndex={50}
      pb={{ base: 6, md: 0 }}
      pt={{ base: 0, md: 6 }}
      className={className}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={3}
        bg="rgba(248, 248, 247, 0.9)"
        borderWidth="1px"
        borderColor="academic.border"
        backdropFilter="blur(12px)"
        py={1}
        px={1}
        borderRadius="full"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <RouterLink
              key={item.name}
              to={item.url}
              onClick={() => setActiveTab(item.name)}
              style={{ textDecoration: 'none' }}
            >
              <Box
                position="relative"
                cursor="pointer"
                fontSize="sm"
                fontWeight="semibold"
                px={6}
                py={2}
                borderRadius="full"
                transition="all 0.2s"
                color={isActive ? 'academic.accent' : 'academic.secondaryText'}
                bg={isActive ? 'rgba(96, 122, 148, 0.08)' : 'transparent'}
                _hover={{
                  color: 'academic.accent'
                }}
              >
                <Box display={{ base: 'none', md: 'inline' }}>{item.name}</Box>
                <Box display={{ base: 'inline', md: 'none' }}>
                  <Icon size={18} strokeWidth={2.5} />
                </Box>
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      background: 'rgba(96, 122, 148, 0.05)',
                      borderRadius: '9999px',
                      zIndex: -10
                    }}
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '32px',
                        height: '4px',
                        background: '#607A94',
                        borderTopLeftRadius: '9999px',
                        borderTopRightRadius: '9999px'
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          width: '48px',
                          height: '24px',
                          background: 'rgba(96, 122, 148, 0.2)',
                          borderRadius: '9999px',
                          filter: 'blur(8px)',
                          top: '-8px',
                          left: '-8px'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          width: '32px',
                          height: '24px',
                          background: 'rgba(96, 122, 148, 0.2)',
                          borderRadius: '9999px',
                          filter: 'blur(8px)',
                          top: '-4px'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          width: '16px',
                          height: '16px',
                          background: 'rgba(96, 122, 148, 0.2)',
                          borderRadius: '9999px',
                          filter: 'blur(4px)',
                          top: 0,
                          left: '8px'
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </Box>
            </RouterLink>
          );
        })}
      </Box>
    </Box>
  );
}

import { Box, Flex, IconButton } from "@chakra-ui/react";
import { Link as RouterLink, type LinkProps } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({ children, ...props }: { children: React.ReactNode } & React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props}>{children}</DesktopSidebar>
      <MobileSidebar {...(props as React.ComponentProps<"div">)}>{children}</MobileSidebar>
    </>
  );
};

const MotionBox = motion(Box);

export const DesktopSidebar = ({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <MotionBox
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      h="100vh"
      px={4}
      py={4}
      bg="rgba(248, 248, 247, 0.95)"
      backdropFilter="blur(12px)"
      borderRight="1px solid"
      borderColor="rgba(229, 231, 235, 0.8)"
      flexShrink={0}
      animate={{
        width: animate ? (open ? "300px" : "80px") : "300px",
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

export const MobileSidebar = ({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <Flex
      display={{ base: "flex", md: "none" }}
      h="64px"
      px={4}
      py={4}
      align="center"
      justify="space-between"
      w="full"
      bg="rgba(248, 248, 247, 0.95)"
      backdropFilter="blur(12px)"
      borderBottom="1px solid"
      borderColor="rgba(229, 231, 235, 0.8)"
      position="sticky"
      top={0}
      zIndex={1000}
      {...props}
    >
      <Flex justify="flex-end" w="full" zIndex={20}>
        <IconButton
          aria-label="Open menu"
          icon={<Menu color="#2D3748" />}
          variant="ghost"
          onClick={() => setOpen(!open)}
        />
      </Flex>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            style={{
              position: "fixed",
              height: "100vh",
              width: "100vw",
              inset: 0,
              backgroundColor: "#FFFFFF",
              padding: "2.5rem",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <Box
              position="absolute"
              right="40px"
              top="40px"
              zIndex={50}
              cursor="pointer"
              onClick={() => setOpen(!open)}
            >
              <X color="#2D3748" />
            </Box>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
};

const MotionFlex = motion(Flex);

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  
  const linkContent = (
    <>
      <Box flexShrink={0}>
        {link.icon}
      </Box>
      <MotionFlex
        as="span"
        fontSize="sm"
        color="#2D3748"
        whiteSpace="nowrap"
        overflow="hidden"
        animate={{
          display: animate ? (open ? "inline-flex" : "none") : "inline-flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{
          duration: 0.15,
        }}
        _groupHover={{
          transform: "translateX(4px)"
        }}
      >
        {link.label}
      </MotionFlex>
    </>
  );
  
  // If link has onClick handler, render as button
  if (link.onClick) {
    return (
      <Flex
        onClick={link.onClick}
        align="center"
        gap={2}
        py={2}
        px={3}
        borderRadius="lg"
        cursor="pointer"
        transition="all 0.2s"
        role="group"
        _hover={{
          bg: "rgba(96, 122, 148, 0.08)"
        }}
        {...props}
      >
        {linkContent}
      </Flex>
    );
  }
  
  // Otherwise render as RouterLink
  return (
    <Flex
      as={RouterLink}
      to={link.href}
      align="center"
      gap={2}
      py={2}
      px={3}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      role="group"
      _hover={{
        bg: "rgba(96, 122, 148, 0.08)"
      }}
      {...props}
    >
      {linkContent}
    </Flex>
  );
};

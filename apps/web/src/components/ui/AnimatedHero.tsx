import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, BookOpen } from "lucide-react";
import { Box, Container, Heading, Text, HStack, VStack, Button } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../app/providers/firebase/AuthProvider";

function AnimatedHero() {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["powerful", "intelligent", "reliable", "innovative", "scholarly"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <Box w="full" bg="academic.background" pt={0}>
      <Container maxW="container.xl">
        <VStack
          gap={2}
          py={{ base: 16, lg: 32 }}
          align="center"
          justify="center"
        >
          {/* Badge */}
          

          {/* Animated Heading */}
          <VStack gap={4}>
            <Heading
              as="h1"
              fontSize={{ base: "5xl", md: "7xl" }}
              maxW="2xl"
              textAlign="center"
              fontFamily="Lora"
              fontWeight="normal"
              lineHeight="1.1"
              
            >
              <Text as="span" color="academic.accent">
                Your thesis writing is
              </Text>
              <Box
                as="span"
                position="relative"
                display="flex"
                w="full"
                justifyContent="center"
                overflow="hidden"
                textAlign="center"
                pb={{ base: 2, md: 4 }}
                pt={{ base: 1, md: 1 }}
                minH={{ base: "60px", md: "80px" }}
              >
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    style={{
                      position: "absolute",
                      fontWeight: 600,
                      color: "#2D3748",
                    }}
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </Box>
            </Heading>

            <Text
              fontSize={{ base: "lg", md: "xl" }}
              lineHeight="relaxed"
              color="academic.secondaryText"
              maxW="2xl"
              textAlign="center"
              fontFamily="Inter"
            >
              From blank page to polished draft. Thesis Copilot combines AI assistance
              with academic rigor, helping you write faster while maintaining full
              control and ensuring every claim is grounded in your sources.
            </Text>
          </VStack>

          {/* CTA Buttons */}
          <HStack spacing={3} flexWrap="wrap" justify="center">
            <Button 
              variant="outline" 
              size="lg"
              as={RouterLink}
              to="#features"
              borderColor="academic.accent"
              color="academic.accent"
              _hover={{
                bg: "academic.accent",
                color: "white"
              }}
              rightIcon={<BookOpen size={16} />}
            >
              Learn more
            </Button>
            <Button 
              size="lg"
              as={RouterLink}
              to={isAuthenticated ? "/onboarding" : "/login"}
              bg="academic.accent"
              color="white"
              _hover={{
                bg: "#506580"
              }}
              rightIcon={<MoveRight size={16} />}
            >
              {isAuthenticated ? "Start writing" : "Sign in to begin"}
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}

export { AnimatedHero };

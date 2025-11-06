/**
 * Animation Showcase
 *
 * Demo page displaying all available animations from the animation system.
 * Useful for developers to see animations in action and copy usage examples.
 *
 * Access at: /animation-showcase
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Badge,
  Divider,
  Code,
  useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  // Components
  FadeIn,
  SlideUp,
  SlideDown,
  SlideLeft,
  SlideRight,
  ScaleUp,
  PremiumEntrance,
  BlurFade,
  StaggerContainer,
  StaggerItem,
  ScrollFadeIn,
  ScrollScaleIn,
  AnimatedCard,
  AnimatedButton,
  AnimatedCounter,
  Typewriter,
  AnimatedList,

  // Hooks
  useMountAnimation,
  useChangeAnimation,
  useScrollAnimation,

  // Presets (for manual use)
  presets,
  timing,
} from '../lib/animations';

export default function AnimationShowcase() {
  const [showBasic, setShowBasic] = useState(true);
  const [counter, setCounter] = useState(0);
  const [typewriterKey, setTypewriterKey] = useState(0);
  const toast = useToast();

  const { ref: scrollRef, inView } = useScrollAnimation();
  const hasChanged = useChangeAnimation(counter, 500);

  const demoItems = [
    { id: 1, title: 'Project Alpha', status: 'Active' },
    { id: 2, title: 'Thesis Beta', status: 'Draft' },
    { id: 3, title: 'Research Gamma', status: 'Complete' },
  ];

  return (
    <Container maxW="7xl" py={12}>
      {/* Header */}
      <FadeIn>
        <VStack spacing={4} align="start" mb={12}>
          <Heading size="2xl" color="academic.primary">
            Animation Showcase
          </Heading>
          <Text fontSize="lg" color="academic.secondary">
            Explore all animations available in the Thesis Copilot animation
            system. Click buttons to trigger animations and see code examples.
          </Text>
        </VStack>
      </FadeIn>

      <VStack spacing={16} align="stretch">
        {/* =============================================== */}
        {/* BASIC ANIMATIONS */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Basic Animations"
          description="Fundamental entrance and exit animations"
        >
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
            <AnimationDemo
              name="Fade In"
              code='<FadeIn>Content</FadeIn>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <FadeIn>
                    <DemoBox>Fades in smoothly</DemoBox>
                  </FadeIn>
                )}
              </AnimatePresence>
            </AnimationDemo>

            <AnimationDemo
              name="Slide Up"
              code='<SlideUp>Content</SlideUp>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <SlideUp>
                    <DemoBox>Slides up + fade</DemoBox>
                  </SlideUp>
                )}
              </AnimatePresence>
            </AnimationDemo>

            <AnimationDemo
              name="Slide Down"
              code='<SlideDown>Content</SlideDown>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <SlideDown>
                    <DemoBox>Slides down + fade</DemoBox>
                  </SlideDown>
                )}
              </AnimatePresence>
            </AnimationDemo>

            <AnimationDemo
              name="Slide Left"
              code='<SlideLeft>Content</SlideLeft>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <SlideLeft>
                    <DemoBox>Slides from left</DemoBox>
                  </SlideLeft>
                )}
              </AnimatePresence>
            </AnimationDemo>

            <AnimationDemo
              name="Slide Right"
              code='<SlideRight>Content</SlideRight>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <SlideRight>
                    <DemoBox>Slides from right</DemoBox>
                  </SlideRight>
                )}
              </AnimatePresence>
            </AnimationDemo>

            <AnimationDemo
              name="Scale Up"
              code='<ScaleUp>Content</ScaleUp>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <ScaleUp>
                    <DemoBox>Scales up + fade</DemoBox>
                  </ScaleUp>
                )}
              </AnimatePresence>
            </AnimationDemo>
          </Grid>
        </ShowcaseSection>

        {/* =============================================== */}
        {/* PREMIUM ANIMATIONS */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Premium Animations"
          description="Combined effects for high-impact entrances"
        >
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
            <AnimationDemo
              name="Premium Entrance"
              code='<PremiumEntrance>Content</PremiumEntrance>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <PremiumEntrance>
                    <DemoBox>Scale + slide + fade</DemoBox>
                  </PremiumEntrance>
                )}
              </AnimatePresence>
            </AnimationDemo>

            <AnimationDemo
              name="Blur Fade"
              code='<BlurFade>Content</BlurFade>'
              onTrigger={() => {
                setShowBasic(false);
                setTimeout(() => setShowBasic(true), 100);
              }}
            >
              <AnimatePresence mode="wait">
                {showBasic && (
                  <BlurFade>
                    <DemoBox>Blur + fade (glass)</DemoBox>
                  </BlurFade>
                )}
              </AnimatePresence>
            </AnimationDemo>
          </Grid>
        </ShowcaseSection>

        {/* =============================================== */}
        {/* STAGGER ANIMATIONS */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Stagger Animations"
          description="Animate multiple items with cascading delays"
        >
          <AnimationDemo
            name="Stagger Container"
            code={`<StaggerContainer>
  <StaggerItem>Item 1</StaggerItem>
  <StaggerItem>Item 2</StaggerItem>
  <StaggerItem>Item 3</StaggerItem>
</StaggerContainer>`}
            onTrigger={() => {
              setShowBasic(false);
              setTimeout(() => setShowBasic(true), 100);
            }}
          >
            <AnimatePresence mode="wait">
              {showBasic && (
                <StaggerContainer>
                  <HStack spacing={4}>
                    <StaggerItem>
                      <DemoBox size="sm">Item 1</DemoBox>
                    </StaggerItem>
                    <StaggerItem>
                      <DemoBox size="sm">Item 2</DemoBox>
                    </StaggerItem>
                    <StaggerItem>
                      <DemoBox size="sm">Item 3</DemoBox>
                    </StaggerItem>
                    <StaggerItem>
                      <DemoBox size="sm">Item 4</DemoBox>
                    </StaggerItem>
                  </HStack>
                </StaggerContainer>
              )}
            </AnimatePresence>
          </AnimationDemo>

          <AnimationDemo
            name="Animated List"
            code={`<AnimatedList
  items={items}
  renderItem={(item) => <Card>{item}</Card>}
  staggerDelay={0.08}
/>`}
            onTrigger={() => {
              setShowBasic(false);
              setTimeout(() => setShowBasic(true), 100);
            }}
          >
            <AnimatePresence mode="wait">
              {showBasic && (
                <AnimatedList
                  items={demoItems}
                  renderItem={(item) => (
                    <Card size="sm" bg="academic.paper">
                      <CardBody>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">{item.title}</Text>
                          <Badge colorScheme="blue">{item.status}</Badge>
                        </HStack>
                      </CardBody>
                    </Card>
                  )}
                  staggerDelay={0.08}
                />
              )}
            </AnimatePresence>
          </AnimationDemo>
        </ShowcaseSection>

        {/* =============================================== */}
        {/* SCROLL ANIMATIONS */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Scroll Animations"
          description="Trigger animations when elements enter viewport"
        >
          <VStack spacing={8} align="stretch">
            <ScrollFadeIn>
              <Card bg="academic.accent" color="white">
                <CardBody>
                  <Heading size="md">Scroll Fade In</Heading>
                  <Text mt={2}>Fades in when scrolled into view</Text>
                  <Code mt={2} colorScheme="gray">
                    {'<ScrollFadeIn>Content</ScrollFadeIn>'}
                  </Code>
                </CardBody>
              </Card>
            </ScrollFadeIn>

            <ScrollScaleIn>
              <Card bg="academic.accentHover" color="white">
                <CardBody>
                  <Heading size="md">Scroll Scale In</Heading>
                  <Text mt={2}>Scales up when scrolled into view</Text>
                  <Code mt={2} colorScheme="gray">
                    {'<ScrollScaleIn>Content</ScrollScaleIn>'}
                  </Code>
                </CardBody>
              </Card>
            </ScrollScaleIn>

            <Box ref={scrollRef}>
              <Card
                bg={inView ? 'green.500' : 'gray.300'}
                color="white"
                transition="all 0.3s"
              >
                <CardBody>
                  <Heading size="md">useScrollAnimation Hook</Heading>
                  <Text mt={2}>
                    Status: {inView ? '✓ In View' : '✗ Not in view'}
                  </Text>
                  <Code mt={2} colorScheme="gray">
                    {'const { ref, inView } = useScrollAnimation();'}
                  </Code>
                </CardBody>
              </Card>
            </Box>
          </VStack>
        </ShowcaseSection>

        {/* =============================================== */}
        {/* INTERACTIVE COMPONENTS */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Interactive Components"
          description="Hover and tap animations for user interactions"
        >
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
            <Card>
              <CardBody>
                <Heading size="sm" mb={4}>
                  Animated Button
                </Heading>
                <AnimatedButton
                  style={{
                    padding: '12px 24px',
                    background: '#607A94',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  onClick={() =>
                    toast({
                      title: 'Button clicked!',
                      status: 'success',
                      duration: 2000,
                    })
                  }
                >
                  Hover & Click Me
                </AnimatedButton>
                <Code mt={4} display="block" whiteSpace="pre">
                  {'<AnimatedButton>\n  Click\n</AnimatedButton>'}
                </Code>
              </CardBody>
            </Card>

            <AnimatedCard enableHover>
              <Card h="full">
                <CardBody>
                  <Heading size="sm" mb={2}>
                    Animated Card
                  </Heading>
                  <Text fontSize="sm" color="academic.secondary">
                    Hover over this card to see lift effect
                  </Text>
                  <Code mt={4} display="block" whiteSpace="pre" fontSize="xs">
                    {'<AnimatedCard\n  enableHover>\n  Content\n</AnimatedCard>'}
                  </Code>
                </CardBody>
              </Card>
            </AnimatedCard>
          </Grid>
        </ShowcaseSection>

        {/* =============================================== */}
        {/* SPECIAL EFFECTS */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Special Effects"
          description="Unique animations for specific use cases"
        >
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
            <Card>
              <CardBody>
                <Heading size="sm" mb={4}>
                  Animated Counter
                </Heading>
                <HStack spacing={4} mb={4}>
                  <Button
                    size="sm"
                    onClick={() => setCounter((c) => Math.max(0, c - 10))}
                  >
                    -10
                  </Button>
                  <Button size="sm" onClick={() => setCounter((c) => c + 10)}>
                    +10
                  </Button>
                </HStack>
                <Box
                  fontSize="3xl"
                  fontWeight="bold"
                  color="academic.accent"
                  transform={hasChanged ? 'scale(1.2)' : 'scale(1)'}
                  transition="transform 0.2s"
                >
                  <AnimatedCounter value={counter} duration={800} />
                </Box>
                <Code mt={4} display="block" whiteSpace="pre" fontSize="xs">
                  {'<AnimatedCounter\n  value={42}\n  duration={1000}\n/>'}
                </Code>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Heading size="sm" mb={4}>
                  Typewriter Effect
                </Heading>
                <Button
                  size="sm"
                  mb={4}
                  onClick={() => setTypewriterKey((k) => k + 1)}
                >
                  Restart
                </Button>
                <Text fontSize="lg" fontFamily="mono" minH="60px">
                  <Typewriter
                    key={typewriterKey}
                    text="The AI assistant for academic writing..."
                    speed={30}
                  />
                </Text>
                <Code mt={4} display="block" whiteSpace="pre" fontSize="xs">
                  {'<Typewriter\n  text="Hello!"\n  speed={50}\n/>'}
                </Code>
              </CardBody>
            </Card>
          </Grid>
        </ShowcaseSection>

        {/* =============================================== */}
        {/* TIMING REFERENCE */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Timing Reference"
          description="Standard timing values for consistent animations"
        >
          <Grid templateColumns="repeat(5, 1fr)" gap={4}>
            {Object.entries(timing).map(([name, duration]) => (
              <Card key={name} textAlign="center">
                <CardBody>
                  <Badge colorScheme="blue" mb={2}>
                    {name}
                  </Badge>
                  <Text fontSize="2xl" fontWeight="bold">
                    {duration}s
                  </Text>
                  <Text fontSize="xs" color="academic.secondary">
                    {duration * 1000}ms
                  </Text>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </ShowcaseSection>

        {/* =============================================== */}
        {/* USAGE EXAMPLES */}
        {/* =============================================== */}
        <ShowcaseSection
          title="Quick Start Examples"
          description="Copy-paste code snippets to get started"
        >
          <VStack spacing={4} align="stretch">
            <CodeExample
              title="Basic Component Usage"
              code={`import { FadeIn, SlideUp } from '@/lib/animations';

function MyComponent() {
  return (
    <FadeIn>
      <Card>Content fades in on mount</Card>
    </FadeIn>
  );
}`}
            />

            <CodeExample
              title="Stagger List Items"
              code={`import { StaggerContainer, StaggerItem } from '@/lib/animations';

function ProjectList({ projects }) {
  return (
    <StaggerContainer>
      {projects.map(project => (
        <StaggerItem key={project.id}>
          <ProjectCard {...project} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}`}
            />

            <CodeExample
              title="Scroll-Triggered Animation"
              code={`import { ScrollFadeIn } from '@/lib/animations';

function FeatureSection() {
  return (
    <ScrollFadeIn>
      <Card>Appears when scrolled into view</Card>
    </ScrollFadeIn>
  );
}`}
            />

            <CodeExample
              title="Custom Animation with Hooks"
              code={`import { useScrollAnimation } from '@/lib/animations';

function MyComponent() {
  const { ref, inView } = useScrollAnimation();

  return (
    <Box ref={ref} opacity={inView ? 1 : 0}>
      Custom scroll behavior
    </Box>
  );
}`}
            />
          </VStack>
        </ShowcaseSection>
      </VStack>
    </Container>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface ShowcaseSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function ShowcaseSection({ title, description, children }: ShowcaseSectionProps) {
  return (
    <Box>
      <VStack align="start" spacing={2} mb={6}>
        <Heading size="lg" color="academic.primary">
          {title}
        </Heading>
        <Text color="academic.secondary">{description}</Text>
      </VStack>
      <Divider mb={6} />
      {children}
    </Box>
  );
}

interface AnimationDemoProps {
  name: string;
  code: string;
  onTrigger: () => void;
  children: React.ReactNode;
}

function AnimationDemo({ name, code, onTrigger, children }: AnimationDemoProps) {
  return (
    <Card>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Heading size="xs" color="academic.primary">
            {name}
          </Heading>
          <Box minH="100px" display="flex" alignItems="center" justifyContent="center">
            {children}
          </Box>
          <Button size="sm" onClick={onTrigger} colorScheme="blue">
            Replay
          </Button>
          <Code fontSize="xs" p={2} borderRadius="md">
            {code}
          </Code>
        </VStack>
      </CardBody>
    </Card>
  );
}

interface DemoBoxProps {
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

function DemoBox({ children, size = 'md' }: DemoBoxProps) {
  return (
    <Box
      bg="academic.accent"
      color="white"
      p={size === 'sm' ? 3 : 6}
      borderRadius="lg"
      textAlign="center"
      fontSize={size === 'sm' ? 'sm' : 'md'}
      fontWeight="medium"
    >
      {children}
    </Box>
  );
}

interface CodeExampleProps {
  title: string;
  code: string;
}

function CodeExample({ title, code }: CodeExampleProps) {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={3}>
          {title}
        </Heading>
        <Code
          display="block"
          whiteSpace="pre"
          p={4}
          borderRadius="md"
          fontSize="sm"
          bg="gray.50"
        >
          {code}
        </Code>
      </CardBody>
    </Card>
  );
}

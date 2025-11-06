/**
 * Animated Component Wrappers
 *
 * Pre-built animated components for common use cases.
 * Drop-in replacements for standard elements with animations baked in.
 *
 * Usage:
 * import { FadeIn, SlideUp, StaggerContainer } from '@/lib/animations';
 * <FadeIn><YourContent /></FadeIn>
 */

import React from 'react';
import { motion, HTMLMotionProps, MotionProps } from 'framer-motion';
import {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleUp,
  premiumEntrance,
  pageTransition,
  staggerContainer,
  staggerItem,
  modalBackdrop,
  modalContent,
  scrollFadeIn,
  scrollScaleIn,
  blurFade,
  cardHover,
  buttonPress,
} from './presets';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type AnimatedDivProps = HTMLMotionProps<'div'>;
type AnimatedSectionProps = HTMLMotionProps<'section'>;
type AnimatedButtonProps = HTMLMotionProps<'button'>;

// =============================================================================
// BASIC ANIMATIONS
// =============================================================================

/**
 * Fade in on mount
 */
export const FadeIn: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={fadeIn}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Slide up with fade
 */
export const SlideUp: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={slideUp}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Slide down with fade
 */
export const SlideDown: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={slideDown}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Slide from left
 */
export const SlideLeft: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={slideLeft}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Slide from right
 */
export const SlideRight: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={slideRight}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Scale up with fade
 */
export const ScaleUp: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={scaleUp}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Premium entrance (scale + fade + slide)
 */
export const PremiumEntrance: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={premiumEntrance}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Blur fade (glassmorphism effect)
 */
export const BlurFade: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={blurFade}
    {...props}
  >
    {children}
  </motion.div>
);

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

/**
 * Page wrapper with transition
 */
export const AnimatedPage: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageTransition}
    style={{ width: '100%', height: '100%' }}
    {...props}
  >
    {children}
  </motion.div>
);

// =============================================================================
// STAGGER ANIMATIONS
// =============================================================================

interface StaggerContainerProps extends AnimatedDivProps {
  /** Delay between each child animation (seconds) */
  staggerDelay?: number;
  /** Delay before starting first child (seconds) */
  delayChildren?: number;
}

/**
 * Container that staggers its children's animations
 *
 * @example
 * <StaggerContainer>
 *   <StaggerItem>Item 1</StaggerItem>
 *   <StaggerItem>Item 2</StaggerItem>
 * </StaggerContainer>
 */
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.05,
  delayChildren = 0.1,
  ...props
}) => {
  const customStaggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={customStaggerContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Child item for StaggerContainer
 */
export const StaggerItem: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div variants={staggerItem} {...props}>
    {children}
  </motion.div>
);

// =============================================================================
// SCROLL ANIMATIONS
// =============================================================================

interface ScrollAnimationProps extends AnimatedDivProps {
  /** Trigger animation only once */
  once?: boolean;
  /** Viewport margin to trigger animation earlier/later */
  margin?: string;
  /** Amount of element that needs to be visible (0-1) */
  amount?: number;
}

/**
 * Fade in when scrolled into view
 *
 * @example
 * <ScrollFadeIn>Content appears when scrolled</ScrollFadeIn>
 */
export const ScrollFadeIn: React.FC<ScrollAnimationProps> = ({
  children,
  once = true,
  margin = '-50px',
  amount = 0.3,
  ...props
}) => (
  <motion.div
    initial="initial"
    whileInView="whileInView"
    variants={scrollFadeIn}
    viewport={{ once, margin, amount }}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Scale in when scrolled into view
 */
export const ScrollScaleIn: React.FC<ScrollAnimationProps> = ({
  children,
  once = true,
  margin = '-100px',
  amount = 0.3,
  ...props
}) => (
  <motion.div
    initial="initial"
    whileInView="whileInView"
    variants={scrollScaleIn}
    viewport={{ once, margin, amount }}
    {...props}
  >
    {children}
  </motion.div>
);

// =============================================================================
// MODAL/DIALOG ANIMATIONS
// =============================================================================

/**
 * Modal backdrop (overlay)
 */
export const ModalBackdrop: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={modalBackdrop}
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    }}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Modal content (dialog box)
 */
export const ModalContent: React.FC<AnimatedDivProps> = ({ children, ...props }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={modalContent}
    {...props}
  >
    {children}
  </motion.div>
);

// =============================================================================
// INTERACTIVE COMPONENTS
// =============================================================================

interface AnimatedCardProps extends AnimatedDivProps {
  /** Enable hover lift effect */
  enableHover?: boolean;
}

/**
 * Card with hover lift animation
 *
 * @example
 * <AnimatedCard enableHover>
 *   <CardContent />
 * </AnimatedCard>
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  enableHover = true,
  ...props
}) => (
  <motion.div
    initial="rest"
    whileHover={enableHover ? 'hover' : undefined}
    variants={cardHover}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Button with press animation
 *
 * @example
 * <AnimatedButton onClick={handleClick}>
 *   Click me
 * </AnimatedButton>
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  ...props
}) => (
  <motion.button
    initial="rest"
    whileHover="hover"
    whileTap="tap"
    variants={buttonPress}
    {...props}
  >
    {children}
  </motion.button>
);

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

interface DelayedProps {
  /** Delay in milliseconds before children render */
  delay: number;
  children: React.ReactNode;
}

/**
 * Delay rendering of children
 *
 * @example
 * <Delayed delay={300}>
 *   <ExpensiveComponent />
 * </Delayed>
 */
export const Delayed: React.FC<DelayedProps> = ({ delay, children }) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return show ? <>{children}</> : null;
};

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

interface AnimatedListProps extends AnimatedDivProps {
  /** Array of items to render */
  items: any[];
  /** Render function for each item */
  renderItem: (item: any, index: number) => React.ReactNode;
  /** Stagger delay between items (seconds) */
  staggerDelay?: number;
}

/**
 * List with staggered item animations
 *
 * @example
 * <AnimatedList
 *   items={projects}
 *   renderItem={(project) => <ProjectCard {...project} />}
 *   staggerDelay={0.05}
 * />
 */
export const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  renderItem,
  staggerDelay = 0.05,
  ...props
}) => (
  <StaggerContainer staggerDelay={staggerDelay} {...props}>
    {items.map((item, index) => (
      <StaggerItem key={index}>{renderItem(item, index)}</StaggerItem>
    ))}
  </StaggerContainer>
);

// =============================================================================
// SECTION WRAPPERS
// =============================================================================

/**
 * Section with scroll animation
 */
export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  ...props
}) => (
  <ScrollFadeIn as="section" {...props}>
    {children}
  </ScrollFadeIn>
);

// =============================================================================
// CONDITIONAL ANIMATIONS
// =============================================================================

interface ConditionalAnimationProps extends AnimatedDivProps {
  /** Condition to determine if animation should play */
  condition: boolean;
  /** Animation to apply when condition is true */
  animation?: MotionProps;
}

/**
 * Conditionally apply animation based on prop
 *
 * @example
 * <ConditionalAnimation condition={isActive} animation={scaleUp}>
 *   <Content />
 * </ConditionalAnimation>
 */
export const ConditionalAnimation: React.FC<ConditionalAnimationProps> = ({
  children,
  condition,
  animation,
  ...props
}) => {
  if (!condition) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div {...animation} {...props}>
      {children}
    </motion.div>
  );
};

// =============================================================================
// SPECIAL EFFECTS
// =============================================================================

interface TypewriterProps {
  /** Text to display with typewriter effect */
  text: string;
  /** Speed in characters per second */
  speed?: number;
  /** Delay before starting (ms) */
  delay?: number;
  /** Callback when typing completes */
  onComplete?: () => void;
  /** Additional styling */
  style?: React.CSSProperties;
}

/**
 * Typewriter text effect
 *
 * @example
 * <Typewriter
 *   text="Hello, world!"
 *   speed={50}
 *   onComplete={() => console.log('Done!')}
 * />
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  delay = 0,
  onComplete,
  style,
}) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (delay > 0) {
      const delayTimer = setTimeout(() => {
        setCurrentIndex(0);
        setDisplayText('');
      }, delay);
      return () => clearTimeout(delayTimer);
    }
  }, [delay]);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 1000 / speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span style={style}>{displayText}</span>;
};

// =============================================================================
// COUNTER ANIMATION
// =============================================================================

interface AnimatedCounterProps {
  /** Target number to count to */
  value: number;
  /** Duration of animation (ms) */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix (e.g., "$") */
  prefix?: string;
  /** Suffix (e.g., "%") */
  suffix?: string;
  /** Additional styling */
  style?: React.CSSProperties;
}

/**
 * Animated number counter
 *
 * @example
 * <AnimatedCounter value={42} duration={1000} suffix="%" />
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  style,
}) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;

      setCount(current);

      if (now < endTime) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(value);
      }
    };

    updateCount();
  }, [value, duration]);

  return (
    <span style={style}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};

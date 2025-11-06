/**
 * Animation Presets Library
 *
 * Centralized animation variants for Framer Motion.
 * Designed for academic elegance: subtle, purposeful, performance-optimized.
 *
 * Usage:
 * import { fadeIn, slideUp } from '@/lib/animations';
 * <motion.div {...fadeIn}>Content</motion.div>
 */

import { Variants, Transition } from 'framer-motion';

// =============================================================================
// TIMING & EASING
// =============================================================================

/**
 * Standard timing values (in seconds)
 */
export const timing = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.4,
  slower: 0.6,
} as const;

/**
 * Easing curves - optimized for academic elegance
 */
export const easing = {
  // Standard eases
  ease: [0.4, 0, 0.2, 1], // Material Design standard
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],

  // Custom curves
  smooth: [0.45, 0, 0.55, 1], // Very smooth
  snappy: [0.25, 0.1, 0.25, 1], // Quick response
  elastic: [0.68, -0.55, 0.265, 1.55], // Slight bounce (use sparingly)
} as const;

/**
 * Default transition configuration
 */
export const defaultTransition: Transition = {
  duration: timing.normal,
  ease: easing.ease,
};

// =============================================================================
// BASIC ANIMATIONS
// =============================================================================

/**
 * Simple fade in/out
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Fade with custom duration
 */
export const fade = (duration: number = timing.normal): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration, ease: easing.ease },
  },
  exit: { opacity: 0, transition: { duration: duration * 0.7 } },
});

// =============================================================================
// SLIDE ANIMATIONS
// =============================================================================

/**
 * Slide up with fade
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

/**
 * Slide down with fade
 */
export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

/**
 * Slide from left
 */
export const slideLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

/**
 * Slide from right
 */
export const slideRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

// =============================================================================
// SCALE ANIMATIONS
// =============================================================================

/**
 * Scale up with fade (great for modals)
 */
export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

/**
 * Scale down (for click feedback)
 */
export const scaleDown: Variants = {
  initial: { scale: 1 },
  animate: { scale: 0.95 },
  exit: { scale: 1 },
};

/**
 * Subtle scale on hover
 */
export const scaleOnHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: timing.fast, ease: easing.ease },
  },
  tap: {
    scale: 0.98,
    transition: { duration: timing.instant, ease: easing.ease },
  },
};

// =============================================================================
// COMBINED ANIMATIONS
// =============================================================================

/**
 * Fade + scale + slide up (premium entrance)
 */
export const premiumEntrance: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: timing.slow,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

/**
 * Blur + fade (glassmorphism effect)
 */
export const blurFade: Variants = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: timing.slow, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

/**
 * Standard page transition (fade + scale)
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: timing.normal,
      ease: easing.ease,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: {
      duration: timing.fast,
      ease: easing.ease,
      when: 'afterChildren',
    },
  },
};

/**
 * Slide page transition (for onboarding flows)
 */
export const pageSlideLeft: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

export const pageSlideRight: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

// =============================================================================
// STAGGER ANIMATIONS
// =============================================================================

/**
 * Container for staggered children
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05, // 50ms delay between children
      delayChildren: 0.1, // Wait 100ms before starting
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1, // Reverse order on exit
    },
  },
};

/**
 * Fast stagger (for lists)
 */
export const staggerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0,
    },
  },
};

/**
 * Slow stagger (for features/cards)
 */
export const staggerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Child item for stagger container
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.normal, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: timing.fast },
  },
};

// =============================================================================
// MODAL/DIALOG ANIMATIONS
// =============================================================================

/**
 * Modal backdrop (overlay)
 */
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: timing.fast, ease: easing.ease },
  },
  exit: {
    opacity: 0,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

/**
 * Modal content (dialog box)
 */
export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: timing.normal,
      ease: easing.ease,
      delay: 0.05, // Slight delay after backdrop
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

// =============================================================================
// MICRO-INTERACTIONS
// =============================================================================

/**
 * Button press feedback
 */
export const buttonPress = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: timing.instant, ease: easing.ease },
  },
  tap: {
    scale: 0.98,
    transition: { duration: timing.instant, ease: easing.snappy },
  },
};

/**
 * Card hover lift
 */
export const cardHover = {
  rest: { y: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  hover: {
    y: -4,
    boxShadow: '0 8px 24px rgba(96, 122, 148, 0.12)',
    transition: { duration: timing.fast, ease: easing.ease },
  },
};

/**
 * Shake animation (for errors)
 */
export const shake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4, ease: easing.ease },
  },
};

/**
 * Pulse animation (for notifications)
 */
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      ease: easing.ease,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

/**
 * Spin animation (for loading)
 */
export const spin: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// =============================================================================
// SCROLL ANIMATIONS
// =============================================================================

/**
 * Fade in when scrolled into view
 */
export const scrollFadeIn: Variants = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.slow, ease: easing.ease },
  },
  viewport: { once: true, margin: '-50px' }, // Trigger 50px before entering viewport
};

/**
 * Scale in when scrolled into view
 */
export const scrollScaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: {
    opacity: 1,
    scale: 1,
    transition: { duration: timing.slow, ease: easing.ease },
  },
  viewport: { once: true, margin: '-100px' },
};

// =============================================================================
// SPECIAL EFFECTS
// =============================================================================

/**
 * Typewriter cursor blink
 */
export const cursorBlink: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 1, 0, 0],
    transition: {
      duration: 1,
      ease: 'steps(1)',
      repeat: Infinity,
    },
  },
};

/**
 * Success checkmark animation
 */
export const checkmarkReveal: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: easing.ease,
    },
  },
};

/**
 * Progress bar fill
 */
export const progressFill = (duration: number = 1): Variants => ({
  initial: { scaleX: 0, originX: 0 },
  animate: {
    scaleX: 1,
    transition: { duration, ease: easing.ease },
  },
});

// =============================================================================
// LAYOUT ANIMATIONS
// =============================================================================

/**
 * Shared layout transition (for morphing elements)
 */
export const layoutTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
};

/**
 * Collapse/expand animation
 */
export const collapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: timing.normal, ease: easing.ease },
      opacity: { duration: timing.fast, delay: 0.1 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: timing.normal, ease: easing.ease },
      opacity: { duration: timing.fast },
    },
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Preset library for quick access
 */
export const presets = {
  // Basic
  fadeIn,
  fade,

  // Slides
  slideUp,
  slideDown,
  slideLeft,
  slideRight,

  // Scale
  scaleUp,
  scaleDown,
  scaleOnHover,

  // Combined
  premiumEntrance,
  blurFade,

  // Pages
  pageTransition,
  pageSlideLeft,
  pageSlideRight,

  // Stagger
  staggerContainer,
  staggerFast,
  staggerSlow,
  staggerItem,

  // Modals
  modalBackdrop,
  modalContent,

  // Micro-interactions
  buttonPress,
  cardHover,
  shake,
  pulse,
  spin,

  // Scroll
  scrollFadeIn,
  scrollScaleIn,

  // Special
  cursorBlink,
  checkmarkReveal,
  progressFill,

  // Layout
  collapse,
} as const;

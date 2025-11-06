/**
 * Thesis Copilot Animation System
 *
 * A comprehensive animation library built on Framer Motion.
 * Designed for academic elegance: subtle, purposeful, performance-optimized.
 *
 * @example
 * // Import presets
 * import { fadeIn, slideUp, staggerContainer } from '@/lib/animations';
 *
 * @example
 * // Import components
 * import { FadeIn, SlideUp, StaggerContainer } from '@/lib/animations';
 *
 * @example
 * // Import hooks
 * import { useScrollAnimation, useMountAnimation } from '@/lib/animations';
 *
 * @example
 * // Import utilities
 * import { createStaggerVariants, calculateStaggerDuration } from '@/lib/animations';
 */

// =============================================================================
// PRESETS & VARIANTS
// =============================================================================

export {
  // Timing & Easing
  timing,
  easing,
  defaultTransition,

  // Basic animations
  fadeIn,
  fade,

  // Slide animations
  slideUp,
  slideDown,
  slideLeft,
  slideRight,

  // Scale animations
  scaleUp,
  scaleDown,
  scaleOnHover,

  // Combined animations
  premiumEntrance,
  blurFade,

  // Page transitions
  pageTransition,
  pageSlideLeft,
  pageSlideRight,

  // Stagger animations
  staggerContainer,
  staggerFast,
  staggerSlow,
  staggerItem,

  // Modal animations
  modalBackdrop,
  modalContent,

  // Micro-interactions
  buttonPress,
  cardHover,
  shake,
  pulse,
  spin,

  // Scroll animations
  scrollFadeIn,
  scrollScaleIn,

  // Special effects
  cursorBlink,
  checkmarkReveal,
  progressFill,

  // Layout animations
  layoutTransition,
  collapse,

  // Preset library
  presets,
} from './presets';

// =============================================================================
// COMPONENTS
// =============================================================================

export {
  // Basic animated elements
  FadeIn,
  SlideUp,
  SlideDown,
  SlideLeft,
  SlideRight,
  ScaleUp,
  PremiumEntrance,
  BlurFade,

  // Page transitions
  AnimatedPage,

  // Stagger components
  StaggerContainer,
  StaggerItem,

  // Scroll animations
  ScrollFadeIn,
  ScrollScaleIn,

  // Modal components
  ModalBackdrop,
  ModalContent,

  // Interactive components
  AnimatedCard,
  AnimatedButton,

  // Utility components
  Delayed,

  // Layout components
  AnimatedList,
  AnimatedSection,

  // Conditional animations
  ConditionalAnimation,

  // Special effects
  Typewriter,
  AnimatedCounter,
} from './components';

// =============================================================================
// HOOKS
// =============================================================================

export {
  // Scroll animations
  useScrollAnimation,
  useScrollAnimationControls,

  // Stagger animations
  useStaggerAnimation,

  // Animation sequences
  useAnimationSequence,
  useAnimationChain,

  // Hover & interaction
  useHover,

  // Delay & timing
  useDelayedRender,
  useDebounce,

  // Mount animations
  useMountAnimation,
  useChangeAnimation,

  // Page transitions
  usePageTransition,

  // Reduced motion
  usePrefersReducedMotion,
  useAccessibleAnimation,

  // Loading states
  useLoadingAnimation,
} from './hooks';

// =============================================================================
// UTILITIES
// =============================================================================

export {
  // Variant generators
  createStaggerVariants,
  createFadeVariants,
  createSlideVariants,
  createScaleVariants,

  // Transition generators
  createSpringTransition,
  createTweenTransition,

  // Animation orchestration
  calculateStaggerDuration,
  getAnimationDuration,

  // Scroll calculations
  calculateScrollProgress,
  interpolateScroll,

  // Delay calculations
  generateStaggerDelays,
  generateExponentialDelays,

  // Performance helpers
  shouldReduceMotion,
  getSafeAnimation,
  throttleAnimation,

  // Value transformers
  pxToRem,
  remToPx,
  clamp,
  lerp,

  // Easing functions
  easeOutCubic,
  easeInCubic,
  easeInOutCubic,
  easeOutElastic,

  // Random animations
  randomDelay,
  randomDuration,

  // Animation state helpers
  mergeVariants,
  isInViewport,

  // Sequence builders
  buildSequence,

  // Debug helpers
  logAnimationPerformance,
} from './utils';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { Variants, Transition } from 'framer-motion';

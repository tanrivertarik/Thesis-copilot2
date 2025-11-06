/**
 * Animation Utilities
 *
 * Helper functions for animation calculations and orchestration.
 *
 * Usage:
 * import { createStaggerVariants, getAnimationDuration } from '@/lib/animations';
 */

import { Variants, Transition } from 'framer-motion';
import { timing, easing } from './presets';

// =============================================================================
// VARIANT GENERATORS
// =============================================================================

/**
 * Create custom stagger variants
 *
 * @param staggerDelay - Delay between each child (seconds)
 * @param delayChildren - Initial delay before first child (seconds)
 * @returns Variants object for container
 *
 * @example
 * const variants = createStaggerVariants(0.1, 0.2);
 * <motion.div variants={variants}>
 */
export function createStaggerVariants(
  staggerDelay: number = 0.05,
  delayChildren: number = 0
): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
    exit: {
      transition: {
        staggerChildren: staggerDelay * 0.5,
        staggerDirection: -1,
      },
    },
  };
}

/**
 * Create fade variants with custom duration
 *
 * @param duration - Animation duration (seconds)
 * @param easeCurve - Easing function
 * @returns Variants object
 */
export function createFadeVariants(
  duration: number = timing.normal,
  easeCurve: number[] = easing.ease
): Variants {
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration, ease: easeCurve },
    },
    exit: {
      opacity: 0,
      transition: { duration: duration * 0.7, ease: easeCurve },
    },
  };
}

/**
 * Create slide variants with custom direction
 *
 * @param direction - Direction to slide from ('up' | 'down' | 'left' | 'right')
 * @param distance - Distance to slide in pixels
 * @param duration - Animation duration (seconds)
 * @returns Variants object
 */
export function createSlideVariants(
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number = 20,
  duration: number = timing.normal
): Variants {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const multiplier =
    direction === 'down' || direction === 'right' ? 1 : -1;

  return {
    initial: {
      opacity: 0,
      [axis]: distance * multiplier,
    },
    animate: {
      opacity: 1,
      [axis]: 0,
      transition: { duration, ease: easing.ease },
    },
    exit: {
      opacity: 0,
      [axis]: (distance / 2) * -multiplier,
      transition: { duration: duration * 0.7, ease: easing.ease },
    },
  };
}

/**
 * Create scale variants with custom values
 *
 * @param initialScale - Starting scale value
 * @param finalScale - Ending scale value
 * @param duration - Animation duration (seconds)
 * @returns Variants object
 */
export function createScaleVariants(
  initialScale: number = 0.9,
  finalScale: number = 1,
  duration: number = timing.normal
): Variants {
  return {
    initial: { opacity: 0, scale: initialScale },
    animate: {
      opacity: 1,
      scale: finalScale,
      transition: { duration, ease: easing.ease },
    },
    exit: {
      opacity: 0,
      scale: initialScale,
      transition: { duration: duration * 0.7, ease: easing.ease },
    },
  };
}

// =============================================================================
// TRANSITION GENERATORS
// =============================================================================

/**
 * Create spring transition
 *
 * @param stiffness - Spring stiffness (higher = snappier)
 * @param damping - Spring damping (higher = less bouncy)
 * @returns Transition object
 */
export function createSpringTransition(
  stiffness: number = 300,
  damping: number = 30
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
  };
}

/**
 * Create tween transition with custom easing
 *
 * @param duration - Animation duration (seconds)
 * @param easeCurve - Easing function
 * @param delay - Initial delay (seconds)
 * @returns Transition object
 */
export function createTweenTransition(
  duration: number = timing.normal,
  easeCurve: number[] = easing.ease,
  delay: number = 0
): Transition {
  return {
    type: 'tween',
    duration,
    ease: easeCurve,
    delay,
  };
}

// =============================================================================
// ANIMATION ORCHESTRATION
// =============================================================================

/**
 * Calculate total animation duration including delays
 *
 * @param itemCount - Number of items
 * @param itemDuration - Duration per item (seconds)
 * @param staggerDelay - Delay between items (seconds)
 * @param initialDelay - Initial delay before starting (seconds)
 * @returns Total duration in milliseconds
 *
 * @example
 * const duration = calculateStaggerDuration(10, 0.3, 0.05, 0.1);
 * // Returns: (10 * 0.3) + (9 * 0.05) + 0.1 = 3.55 seconds = 3550ms
 */
export function calculateStaggerDuration(
  itemCount: number,
  itemDuration: number = timing.normal,
  staggerDelay: number = 0.05,
  initialDelay: number = 0
): number {
  const totalItemDuration = itemCount * itemDuration;
  const totalStaggerDelay = (itemCount - 1) * staggerDelay;
  return (totalItemDuration + totalStaggerDelay + initialDelay) * 1000;
}

/**
 * Get animation duration from variants
 *
 * @param variants - Variants object
 * @param state - State to check ('animate' | 'exit')
 * @returns Duration in milliseconds or null if not found
 */
export function getAnimationDuration(
  variants: Variants,
  state: 'animate' | 'exit' = 'animate'
): number | null {
  const stateVariants = variants[state];
  if (!stateVariants || typeof stateVariants !== 'object') return null;

  const transition = (stateVariants as any).transition;
  if (!transition || typeof transition !== 'object') return null;

  const duration = transition.duration;
  return typeof duration === 'number' ? duration * 1000 : null;
}

// =============================================================================
// SCROLL CALCULATIONS
// =============================================================================

/**
 * Calculate scroll progress (0-1) for element
 *
 * @param element - HTML element
 * @param offset - Viewport offset to trigger animation earlier/later
 * @returns Scroll progress (0 = not in view, 1 = fully in view)
 */
export function calculateScrollProgress(
  element: HTMLElement,
  offset: number = 0
): number {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  const elementTop = rect.top - windowHeight + offset;
  const elementBottom = rect.bottom - offset;

  if (elementTop > 0) return 0; // Not yet in view
  if (elementBottom < 0) return 1; // Already past

  const totalDistance = windowHeight + rect.height - offset * 2;
  const currentDistance = windowHeight - rect.top + offset;

  return Math.max(0, Math.min(1, currentDistance / totalDistance));
}

/**
 * Interpolate value based on scroll progress
 *
 * @param progress - Scroll progress (0-1)
 * @param from - Starting value
 * @param to - Ending value
 * @returns Interpolated value
 *
 * @example
 * const opacity = interpolateScroll(scrollProgress, 0, 1);
 * const y = interpolateScroll(scrollProgress, 50, 0);
 */
export function interpolateScroll(
  progress: number,
  from: number,
  to: number
): number {
  return from + (to - from) * progress;
}

// =============================================================================
// DELAY CALCULATIONS
// =============================================================================

/**
 * Generate stagger delays for array of items
 *
 * @param count - Number of items
 * @param baseDelay - Base delay in milliseconds
 * @param increment - Increment per item in milliseconds
 * @returns Array of delays
 *
 * @example
 * const delays = generateStaggerDelays(5, 0, 100);
 * // Returns: [0, 100, 200, 300, 400]
 */
export function generateStaggerDelays(
  count: number,
  baseDelay: number = 0,
  increment: number = 50
): number[] {
  return Array.from({ length: count }, (_, i) => baseDelay + i * increment);
}

/**
 * Create exponential delay sequence
 *
 * @param count - Number of delays
 * @param baseDelay - Starting delay in milliseconds
 * @param multiplier - Exponential multiplier (e.g., 1.5)
 * @returns Array of exponentially increasing delays
 *
 * @example
 * const delays = generateExponentialDelays(5, 100, 1.5);
 * // Returns: [100, 150, 225, 337.5, 506.25]
 */
export function generateExponentialDelays(
  count: number,
  baseDelay: number = 100,
  multiplier: number = 1.5
): number[] {
  return Array.from({ length: count }, (_, i) =>
    baseDelay * Math.pow(multiplier, i)
  );
}

// =============================================================================
// PERFORMANCE HELPERS
// =============================================================================

/**
 * Check if animation should be reduced based on user preference
 *
 * @returns boolean indicating if reduced motion is preferred
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Get safe animation props respecting reduced motion preference
 *
 * @param animation - Animation props
 * @param fallback - Fallback props for reduced motion
 * @returns Animation props or fallback
 *
 * @example
 * const props = getSafeAnimation(
 *   { scale: 1.1, rotate: 45 },
 *   { opacity: 1 }
 * );
 */
export function getSafeAnimation<T extends object>(
  animation: T,
  fallback: Partial<T> = {}
): T | Partial<T> {
  return shouldReduceMotion() ? fallback : animation;
}

/**
 * Throttle animation callback
 *
 * @param callback - Function to throttle
 * @param limit - Minimum time between calls (ms)
 * @returns Throttled function
 */
export function throttleAnimation<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 16 // ~60fps
): (...args: Parameters<T>) => void {
  let waiting = false;

  return (...args: Parameters<T>) => {
    if (!waiting) {
      callback(...args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
      }, limit);
    }
  };
}

// =============================================================================
// VALUE TRANSFORMERS
// =============================================================================

/**
 * Convert pixels to rem
 *
 * @param pixels - Pixel value
 * @param baseFontSize - Base font size (default 16px)
 * @returns Rem value
 */
export function pxToRem(pixels: number, baseFontSize: number = 16): number {
  return pixels / baseFontSize;
}

/**
 * Convert rem to pixels
 *
 * @param rem - Rem value
 * @param baseFontSize - Base font size (default 16px)
 * @returns Pixel value
 */
export function remToPx(rem: number, baseFontSize: number = 16): number {
  return rem * baseFontSize;
}

/**
 * Clamp value between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 *
 * @param start - Starting value
 * @param end - Ending value
 * @param progress - Progress (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

/**
 * Ease out cubic
 */
export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Ease in cubic
 */
export function easeInCubic(x: number): number {
  return x * x * x;
}

/**
 * Ease in out cubic
 */
export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Ease out elastic (bounce effect)
 */
export function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

// =============================================================================
// RANDOM ANIMATIONS
// =============================================================================

/**
 * Generate random delay within range
 *
 * @param min - Minimum delay (ms)
 * @param max - Maximum delay (ms)
 * @returns Random delay
 */
export function randomDelay(min: number = 0, max: number = 500): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random duration within range
 *
 * @param min - Minimum duration (seconds)
 * @param max - Maximum duration (seconds)
 * @returns Random duration
 */
export function randomDuration(min: number = 0.2, max: number = 0.6): number {
  return Math.random() * (max - min) + min;
}

// =============================================================================
// ANIMATION STATE HELPERS
// =============================================================================

/**
 * Combine multiple variants into one
 *
 * @param variants - Array of variants to merge
 * @returns Combined variants
 */
export function mergeVariants(...variants: Variants[]): Variants {
  return variants.reduce((acc, variant) => {
    Object.keys(variant).forEach((key) => {
      acc[key] = {
        ...(acc[key] as any),
        ...(variant[key] as any),
      };
    });
    return acc;
  }, {} as Variants);
}

/**
 * Check if element is in viewport
 *
 * @param element - HTML element
 * @param offset - Viewport offset (pixels)
 * @returns Boolean indicating if element is visible
 */
export function isInViewport(
  element: HTMLElement,
  offset: number = 0
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= window.innerHeight + offset &&
    rect.right <= window.innerWidth + offset
  );
}

// =============================================================================
// SEQUENCE BUILDERS
// =============================================================================

/**
 * Build animation sequence object
 *
 * @param steps - Array of animation steps
 * @returns Promise that resolves when sequence completes
 *
 * @example
 * await buildSequence([
 *   { target: element, animation: { opacity: 1 }, duration: 300 },
 *   { target: element, animation: { scale: 1.1 }, duration: 200 },
 * ]);
 */
export async function buildSequence(
  steps: Array<{
    delay?: number;
    duration?: number;
  }>
): Promise<void> {
  for (const step of steps) {
    if (step.delay) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
    }
    if (step.duration) {
      await new Promise((resolve) => setTimeout(resolve, step.duration));
    }
  }
}

// =============================================================================
// DEBUG HELPERS
// =============================================================================

/**
 * Log animation performance
 *
 * @param name - Animation name
 * @param duration - Animation duration (ms)
 * @param fps - Target FPS
 */
export function logAnimationPerformance(
  name: string,
  duration: number,
  fps: number = 60
): void {
  const frameTime = 1000 / fps;
  const frameCount = Math.ceil(duration / frameTime);

  console.group(`🎬 Animation: ${name}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Target FPS: ${fps}`);
  console.log(`Expected Frames: ${frameCount}`);
  console.log(`Frame Time: ${frameTime.toFixed(2)}ms`);
  console.groupEnd();
}

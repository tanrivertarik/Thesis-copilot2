/**
 * Animation Hooks
 *
 * Custom React hooks for common animation patterns.
 *
 * Usage:
 * const controls = useAnimationSequence();
 * const { ref } = useScrollAnimation();
 */

import { useEffect, useRef, useState } from 'react';
import { useAnimation, useInView, AnimationControls } from 'framer-motion';
import { timing } from './presets';

// =============================================================================
// SCROLL ANIMATIONS
// =============================================================================

/**
 * Trigger animation when element enters viewport
 *
 * @param options - IntersectionObserver options
 * @returns ref to attach to element and inView state
 *
 * @example
 * const { ref, inView } = useScrollAnimation();
 * <motion.div ref={ref} animate={inView ? 'visible' : 'hidden'}>
 */
export function useScrollAnimation(options?: {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: options?.triggerOnce ?? true,
    margin: options?.rootMargin ?? '-50px',
    amount: options?.threshold ?? 0.3,
  });

  return { ref, inView };
}

/**
 * Scroll-triggered animation with controls
 *
 * @example
 * const { ref, controls } = useScrollAnimationControls();
 * <motion.div ref={ref} animate={controls}>
 */
export function useScrollAnimationControls(
  animateOnView: object = { opacity: 1, y: 0 },
  initialState: object = { opacity: 0, y: 30 }
) {
  const controls = useAnimation();
  const { ref, inView } = useScrollAnimation();

  useEffect(() => {
    if (inView) {
      controls.start(animateOnView);
    } else {
      controls.start(initialState);
    }
  }, [inView, controls, animateOnView, initialState]);

  return { ref, controls, inView };
}

// =============================================================================
// STAGGER ANIMATIONS
// =============================================================================

/**
 * Stagger children animations with delay
 *
 * @param childCount - Number of children to animate
 * @param staggerDelay - Delay between each child (seconds)
 * @returns Array of animation states for each child
 *
 * @example
 * const items = useStaggerAnimation(5, 0.1);
 * items.map((animated, i) => (
 *   <motion.div key={i} animate={animated ? 'visible' : 'hidden'}>
 * ))
 */
export function useStaggerAnimation(childCount: number, staggerDelay: number = 0.05) {
  const [animatedItems, setAnimatedItems] = useState<boolean[]>(
    Array(childCount).fill(false)
  );

  useEffect(() => {
    childCount > 0 &&
      Array.from({ length: childCount }).forEach((_, i) => {
        setTimeout(() => {
          setAnimatedItems((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * staggerDelay * 1000);
      });
  }, [childCount, staggerDelay]);

  return animatedItems;
}

// =============================================================================
// ANIMATION SEQUENCES
// =============================================================================

/**
 * Run animation sequence with controls
 *
 * @example
 * const controls = useAnimationSequence();
 * useEffect(() => {
 *   controls.start({ scale: 1.1 }).then(() => controls.start({ scale: 1 }));
 * }, []);
 */
export function useAnimationSequence(): AnimationControls {
  return useAnimation();
}

/**
 * Auto-run animation sequence on mount
 *
 * @param sequence - Array of animation states to run in order
 * @param delays - Optional delays between animations (ms)
 *
 * @example
 * const controls = useAnimationChain([
 *   { opacity: 1 },
 *   { scale: 1.1 },
 *   { scale: 1 }
 * ], [0, 300, 500]);
 */
export function useAnimationChain(
  sequence: object[],
  delays: number[] = []
): AnimationControls {
  const controls = useAnimation();

  useEffect(() => {
    const runSequence = async () => {
      for (let i = 0; i < sequence.length; i++) {
        if (delays[i]) {
          await new Promise((resolve) => setTimeout(resolve, delays[i]));
        }
        await controls.start(sequence[i]);
      }
    };
    runSequence();
  }, [controls, sequence, delays]);

  return controls;
}

// =============================================================================
// HOVER & INTERACTION
// =============================================================================

/**
 * Track hover state for custom animations
 *
 * @example
 * const [ref, isHovered] = useHover<HTMLDivElement>();
 * <div ref={ref}>{isHovered ? '🎉' : '👋'}</div>
 */
export function useHover<T extends HTMLElement>(): [React.RefObject<T>, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return [ref, isHovered];
}

// =============================================================================
// DELAY & TIMING
// =============================================================================

/**
 * Delay rendering of component for animation timing
 *
 * @param delay - Delay in milliseconds
 * @returns boolean indicating if delay has passed
 *
 * @example
 * const show = useDelayedRender(300);
 * return show ? <Component /> : null;
 */
export function useDelayedRender(delay: number = 300): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return show;
}

/**
 * Debounced animation trigger
 *
 * @param callback - Function to call after debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedAnimate = useDebounce(() => controls.start('visible'), 300);
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  };
}

// =============================================================================
// MOUNT ANIMATIONS
// =============================================================================

/**
 * Trigger animation on mount
 *
 * @param animationKey - Key to trigger re-animation
 * @returns isMounted state (starts false, becomes true after next tick)
 *
 * @example
 * const isMounted = useMountAnimation();
 * <motion.div animate={isMounted ? 'visible' : 'hidden'}>
 */
export function useMountAnimation(animationKey?: string | number): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to ensure animation runs after mount
    const raf = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [animationKey]);

  return isMounted;
}

/**
 * Trigger animation on value change
 *
 * @param value - Value to watch for changes
 * @param duration - How long to keep 'hasChanged' true (ms)
 * @returns hasChanged state
 *
 * @example
 * const hasChanged = useChangeAnimation(count, 500);
 * <motion.div animate={{ scale: hasChanged ? 1.1 : 1 }}>
 */
export function useChangeAnimation<T>(value: T, duration: number = 500): boolean {
  const [hasChanged, setHasChanged] = useState(false);
  const prevValueRef = useRef<T>(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setHasChanged(true);
      prevValueRef.current = value;

      const timer = setTimeout(() => setHasChanged(false), duration);
      return () => clearTimeout(timer);
    }
  }, [value, duration]);

  return hasChanged;
}

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

/**
 * Handle page transition state
 *
 * @param pathname - Current route pathname
 * @returns isTransitioning state
 *
 * @example
 * const isTransitioning = usePageTransition(location.pathname);
 */
export function usePageTransition(pathname: string): boolean {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsTransitioning(true);
      prevPathnameRef.current = pathname;

      const timer = setTimeout(() => setIsTransitioning(false), timing.normal * 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return isTransitioning;
}

// =============================================================================
// REDUCED MOTION
// =============================================================================

/**
 * Detect if user prefers reduced motion
 *
 * @returns boolean indicating reduced motion preference
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 * <motion.div animate={prefersReducedMotion ? {} : { scale: 1.1 }}>
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation props that respect reduced motion preference
 *
 * @param animation - Animation object to conditionally apply
 * @returns Animation object or empty object if reduced motion preferred
 *
 * @example
 * const animation = useAccessibleAnimation({ scale: 1.1, rotate: 45 });
 * <motion.div animate={animation}>
 */
export function useAccessibleAnimation<T extends object>(animation: T): T | object {
  const prefersReducedMotion = usePrefersReducedMotion();
  return prefersReducedMotion ? {} : animation;
}

// =============================================================================
// LOADING STATES
// =============================================================================

/**
 * Manage loading animation state
 *
 * @param isLoading - Loading state from parent
 * @param minDuration - Minimum loading duration to prevent flashing (ms)
 * @returns Smoothed loading state
 *
 * @example
 * const smoothLoading = useLoadingAnimation(isLoading, 300);
 * return smoothLoading ? <Spinner /> : <Content />;
 */
export function useLoadingAnimation(
  isLoading: boolean,
  minDuration: number = 300
): boolean {
  const [smoothLoading, setSmoothLoading] = useState(isLoading);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setSmoothLoading(true);
    } else if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      const timer = setTimeout(() => {
        setSmoothLoading(false);
        startTimeRef.current = null;
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minDuration]);

  return smoothLoading;
}

import { useEffect, useRef, useState } from 'react';

interface ScrollAnimationOptions {
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Animation duration for intro (ms) */
  duration?: number;
  /** Starting Y offset for intro */
  offsetY?: number;
  /** How far from bottom of viewport to start fading out (0-1) */
  fadeOutThreshold?: number;
  /** How far from top of viewport to complete fade in (0-1) */
  fadeInThreshold?: number;
  /** Minimum opacity - never go below this (0-1) */
  minOpacity?: number;
}

interface ScrollAnimationState {
  /** Whether the intro animation has completed */
  hasAnimatedIn: boolean;
  /** Current opacity based on scroll position (0-1) */
  scrollOpacity: number;
  /** Current Y transform based on scroll */
  scrollY: number;
  /** Combined style object for the element */
  style: React.CSSProperties;
}

/**
 * Scroll animation hook that works reliably on mobile.
 * 
 * Key fixes for mobile:
 * 1. Uses IntersectionObserver for initial visibility detection
 * 2. Content is ALWAYS rendered (never display:none)
 * 3. Animation triggers ONCE when element enters viewport - never re-triggers
 * 4. No scroll-based opacity changes on mobile to prevent flickering
 * 5. Uses hasTriggeredRef to ensure single load - prevents re-animation on scroll
 * 6. Mobile starts fully visible (opacity: 1) to prevent any flicker
 * 7. After first animate-in on desktop, the element becomes fully inert (no scroll-driven updates)
 */
export function useScrollAnimation(
  options: ScrollAnimationOptions = {}
): [React.RefObject<HTMLDivElement>, ScrollAnimationState] {
  // Only these options are used for the strict “run once then inert” behavior.
  // (Other options remain in the type for compatibility.)
  const { delay = 0, duration = 800, offsetY = 40 } = options;

  const ref = useRef<HTMLDivElement>(null);
  
  // Detect if user prefers reduced motion
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false
  );

  // Check if mobile (disable ALL animations on mobile for performance - no flicker)
  const isMobile = useRef(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  
  // On mobile, start fully visible. On desktop, start hidden for animation.
  const [hasAnimatedIn, setHasAnimatedIn] = useState(() => isMobile.current || prefersReducedMotion.current);
  // Keep these values stable forever after load to prevent any direction/re-entry flicker.
  const scrollOpacity = 1;
  const scrollY = 0;
  
  // CRITICAL: This ref ensures element only animates ONCE, ever.
  // On mobile, it's true from the start to skip all animation logic.
  const hasTriggeredRef = useRef(isMobile.current || prefersReducedMotion.current);

  // Use IntersectionObserver for reliable viewport detection - triggers ONCE only
  // On mobile, this effect does nothing since hasTriggeredRef is already true
  useEffect(() => {
    if (!ref.current) return;

    // If already triggered (mobile or reduced motion), do nothing - element stays visible forever
    if (hasTriggeredRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger if entering viewport AND not already triggered
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true; // Mark as permanently loaded
            
            // Trigger animation after delay
            setTimeout(() => {
              setHasAnimatedIn(true);
            }, delay);
            
            // Disconnect observer - no need to watch anymore
            observer.disconnect();
          }
        });
      },
      {
        // Trigger when any part of element is visible
        threshold: 0,
        // Trigger slightly before element enters viewport for smoother experience
        rootMargin: '50px 0px 50px 0px',
      }
    );

    observer.observe(ref.current);

    // Also check if already in viewport on mount
    const rect = ref.current.getBoundingClientRect();
    const isAlreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isAlreadyVisible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setTimeout(() => {
        setHasAnimatedIn(true);
      }, delay);
      observer.disconnect();
    }

    return () => observer.disconnect();
  }, [delay]);

  // Build style object - ALWAYS renders content, just animates opacity/transform
  // On mobile/tablet: no animation at all, content is always fully visible
  // On desktop: fade-in animation on first visibility
  const style: React.CSSProperties = (prefersReducedMotion.current || isMobile.current)
    ? { opacity: 1, transform: 'none' } // Mobile/reduced motion: always fully visible, no animation
    : {
        // Desktop only: animate in
        opacity: hasAnimatedIn ? 1 : 0,
        transform: hasAnimatedIn ? 'translateY(0px)' : `translateY(${offsetY}px)`,
        transition: hasAnimatedIn 
          ? 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          : `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: hasAnimatedIn ? 'auto' : 'opacity, transform',
      };

  return [ref, { hasAnimatedIn, scrollOpacity, scrollY, style }];
}

// Simplified version for elements that don't need scroll tracking
export function useIntroAnimation(delay: number = 0, duration: number = 800) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
  };

  return { isVisible, style };
}

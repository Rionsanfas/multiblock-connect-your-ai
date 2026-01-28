import { useEffect, useRef, useState, useCallback } from 'react';

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
 */
export function useScrollAnimation({
  delay = 0,
  duration = 800,
  offsetY = 40,
  fadeOutThreshold = 0.95,
  fadeInThreshold = 0.05,
  minOpacity = 0.85,
}: ScrollAnimationOptions = {}): [React.RefObject<HTMLDivElement>, ScrollAnimationState] {
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(1); // Start at 1 - content always visible
  const [scrollY, setScrollY] = useState(0); // Start at 0 - no offset
  const animationFrameRef = useRef<number>();
  
  // CRITICAL: This ref ensures element only animates ONCE, ever.
  // Once set to true, the element stays loaded regardless of scroll position.
  const hasTriggeredRef = useRef(false);

  // Detect if user prefers reduced motion
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false
  );

  // Check if mobile (disable scroll-based opacity on mobile for performance)
  const isMobile = useRef(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Use IntersectionObserver for reliable viewport detection - triggers ONCE only
  useEffect(() => {
    if (!ref.current) return;

    // If already triggered, do nothing - element stays loaded forever
    if (hasTriggeredRef.current) return;

    // If reduced motion, skip animations entirely
    if (prefersReducedMotion.current) {
      hasTriggeredRef.current = true;
      setHasAnimatedIn(true);
      setScrollOpacity(1);
      setScrollY(0);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger if entering viewport AND not already triggered
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true; // Mark as permanently loaded
            
            // Trigger animation after delay
            setTimeout(() => {
              setHasAnimatedIn(true);
              setScrollOpacity(1);
              setScrollY(0);
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
        setScrollOpacity(1);
        setScrollY(0);
      }, delay);
      observer.disconnect();
    }

    return () => observer.disconnect();
  }, [delay]);

  // Scroll-based opacity and position (DESKTOP ONLY for performance)
  // This only affects elements AFTER they've loaded - never re-triggers load
  const handleScroll = useCallback(() => {
    if (!ref.current || !hasAnimatedIn) return;
    
    // Skip scroll effects on mobile - causes flickering and poor performance
    if (isMobile.current) return;

    const rect = ref.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate visibility based on element position in viewport
    const elementCenter = rect.top + rect.height / 2;
    
    // Element is in the "safe zone" - fully visible
    const safeTop = windowHeight * fadeInThreshold;
    const safeBottom = windowHeight * fadeOutThreshold;
    
    let opacity = 1;
    let yOffset = 0;

    if (elementCenter < safeTop) {
      // Element is near the top - fade out slightly as it leaves
      const progress = Math.max(0, elementCenter / safeTop);
      opacity = minOpacity + progress * (1 - minOpacity);
      yOffset = (1 - progress) * -10;
    } else if (elementCenter > safeBottom) {
      // Element is near the bottom - slight fade as it approaches edge
      const distanceFromBottom = windowHeight - elementCenter;
      const fadeZone = windowHeight - safeBottom;
      const progress = Math.max(0, Math.min(1, distanceFromBottom / fadeZone));
      opacity = minOpacity + progress * (1 - minOpacity);
      yOffset = (1 - progress) * 15;
    }

    setScrollOpacity(opacity);
    setScrollY(yOffset);
  }, [hasAnimatedIn, fadeInThreshold, fadeOutThreshold, minOpacity]);

  useEffect(() => {
    // Skip scroll tracking on mobile
    if (isMobile.current || prefersReducedMotion.current) return;

    const onScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleScroll]);

  // Build style object - ALWAYS renders content, just animates opacity/transform
  const style: React.CSSProperties = prefersReducedMotion.current
    ? { opacity: 1, transform: 'none' }
    : {
        // Start visible on mobile, animated on desktop
        opacity: hasAnimatedIn ? scrollOpacity : (isMobile.current ? 0.99 : 0),
        transform: hasAnimatedIn 
          ? `translateY(${scrollY}px)` 
          : `translateY(${isMobile.current ? 0 : offsetY}px)`,
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

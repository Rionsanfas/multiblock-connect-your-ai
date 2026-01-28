import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

/**
 * AnimatedSection wrapper that NEVER blocks pointer events.
 * On mobile: no animation, content fully visible, touch works immediately.
 * On desktop: fade-in animation on scroll.
 */
export function AnimatedSection({ 
  children, 
  delay = 0, 
  className = '',
  id,
  style: customStyle = {}
}: AnimatedSectionProps) {
  const [ref, { style }] = useScrollAnimation({ delay, offsetY: 50 });

  return (
    <div 
      ref={ref} 
      className={className} 
      style={{ ...style, ...customStyle }}
      id={id}
    >
      {children}
    </div>
  );
}

interface AnimatedElementProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AnimatedElement wrapper that NEVER blocks pointer events.
 * On mobile: no animation, content fully visible, touch works immediately.
 * On desktop: fade-in animation on scroll.
 */
export function AnimatedElement({ 
  children, 
  delay = 0, 
  className = '',
  style: customStyle = {}
}: AnimatedElementProps) {
  const [ref, { style }] = useScrollAnimation({ delay, offsetY: 30 });

  return (
    <div 
      ref={ref} 
      className={className} 
      style={{ ...style, ...customStyle }}
    >
      {children}
    </div>
  );
}

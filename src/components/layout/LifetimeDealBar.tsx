/**
 * LifetimeDealBar - Minimal top notification bar for Lifetime Deal promotion
 * 
 * Thin, dismissible bar that appears above the navigation.
 * Persists dismissal state in localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'lifetime-deal-bar-dismissed';

export function LifetimeDealBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === 'true') {
        return;
      }
      // Slight delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFading(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setTimeout(() => setIsVisible(false), 200);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "w-full bg-primary/10 border-b border-primary/20",
        "transition-all duration-300 ease-out",
        isFading 
          ? "opacity-0 h-0 overflow-hidden" 
          : "opacity-100 animate-in slide-in-from-top-1"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-4">
        <p className="text-sm text-foreground/90">
          <span className="text-muted-foreground">Lifetime deal available</span>
          <span className="mx-2 text-border">—</span>
          <span className="text-muted-foreground">limited time</span>
        </p>
        <Link
          to="/pricing#lifetime"
          className="text-sm font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
        >
          View plans
        </Link>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded-md hover:bg-primary/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}

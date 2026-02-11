/**
 * ConnectionGuideTip - One-time contextual guidance for connection UX
 * 
 * Appears when user first interacts with blocks to help them understand
 * how to create connections. Dismissible and persisted to localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'connection-guide-tip-dismissed';

export function ConnectionGuideTip() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === 'true') {
        return;
      }
      // Small delay for entrance animation
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleDismiss = useCallback(() => {
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
        "fixed bottom-4 left-4 z-50 max-w-xs",
        "bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl",
        "shadow-lg shadow-black/10",
        "transition-all duration-300 ease-out",
        isFading 
          ? "opacity-0 translate-y-2" 
          : "opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-2"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Tip
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Drag from a block node and release on the block you want to connect — even if the line isn't visible yet.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-secondary/80 transition-colors"
            aria-label="Dismiss tip"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

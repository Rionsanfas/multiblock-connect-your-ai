/**
 * ChatError - Non-blocking, auto-dismissing error display for chat
 * 
 * Features:
 * - Renders inside chat container with proper word wrapping
 * - Non-blocking: user can continue interacting
 * - Auto-dismisses after 10 seconds with smooth fade animation
 * - Manual dismiss option available
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatErrorProps {
  message: string;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms (default: 10000) */
  autoDismissMs?: number;
}

export function ChatError({ message, onDismiss, autoDismissMs = 10000 }: ChatErrorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  const handleDismiss = useCallback(() => {
    // Start fade animation
    setIsFading(true);
    // Wait for animation to complete before calling onDismiss
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300); // Match animation duration
  }, [onDismiss]);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [message, autoDismissMs, handleDismiss]);

  if (!isVisible || !message) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20",
        "max-w-[95%] sm:max-w-[85%] w-full",
        "transition-all duration-300 ease-out",
        isFading ? "opacity-0 translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
      <p
        className={cn(
          "flex-1 text-sm text-destructive",
          // Proper word wrapping to prevent overflow
          "break-words overflow-wrap-anywhere whitespace-pre-wrap",
          // Ensure it doesn't exceed container
          "min-w-0"
        )}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {message}
      </p>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md hover:bg-destructive/20 transition-colors flex-shrink-0"
        aria-label="Dismiss error"
      >
        <X className="h-3.5 w-3.5 text-destructive" />
      </button>
    </div>
  );
}

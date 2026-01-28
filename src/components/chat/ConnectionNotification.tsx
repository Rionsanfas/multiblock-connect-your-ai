/**
 * ConnectionNotification - One-time dismissible connection notification
 * 
 * Features:
 * - Shows once when a new connection is created
 * - Dismissible by user
 * - Once dismissed, never reappears for that connection
 * - Uses localStorage to persist dismissed state
 */

import { useState, useEffect, useCallback } from 'react';
import { Link2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionNotificationProps {
  /** Unique identifier for this block's connections (e.g., blockId + connectionIds) */
  blockId: string;
  /** List of source block titles connected to this block */
  sourceBlockTitles: string[];
  /** Optional: callback when notification is dismissed */
  onDismiss?: () => void;
}

const DISMISSED_CONNECTIONS_KEY = 'dismissed-connection-notifications';

/**
 * Get the set of dismissed connection hashes from localStorage
 */
function getDismissedConnections(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_CONNECTIONS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

/**
 * Mark a connection notification as dismissed
 */
function markConnectionDismissed(hash: string): void {
  try {
    const dismissed = getDismissedConnections();
    dismissed.add(hash);
    localStorage.setItem(DISMISSED_CONNECTIONS_KEY, JSON.stringify([...dismissed]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generate a unique hash for a block's current connections
 */
function generateConnectionHash(blockId: string, sourceBlockTitles: string[]): string {
  // Create a deterministic hash based on block ID and sorted source titles
  const sortedTitles = [...sourceBlockTitles].sort().join('|');
  return `${blockId}:${sortedTitles}`;
}

export function ConnectionNotification({
  blockId,
  sourceBlockTitles,
  onDismiss,
}: ConnectionNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Generate hash for current connections
  const connectionHash = generateConnectionHash(blockId, sourceBlockTitles);

  // Check if this notification should be shown
  useEffect(() => {
    if (sourceBlockTitles.length === 0) {
      setIsVisible(false);
      return;
    }

    const dismissed = getDismissedConnections();
    if (!dismissed.has(connectionHash)) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [connectionHash, sourceBlockTitles.length]);

  const handleDismiss = useCallback(() => {
    // Start fade animation
    setIsFading(true);
    
    // Mark as dismissed in localStorage
    markConnectionDismissed(connectionHash);
    
    // Wait for animation to complete
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 200);
  }, [connectionHash, onDismiss]);

  if (!isVisible || sourceBlockTitles.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-b border-primary/10",
        "transition-all duration-200 ease-out",
        isFading ? "opacity-0 h-0 py-0 overflow-hidden" : "opacity-100"
      )}
    >
      <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 text-xs text-muted-foreground truncate">
        Context from: {sourceBlockTitles.join(', ')}
      </span>
      <button
        onClick={handleDismiss}
        className="p-0.5 rounded hover:bg-primary/10 transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  );
}

/**
 * TextSelectionMenu - Floating menu for text selection actions
 * 
 * Appears when user selects text in chat messages.
 * Provides "Reference" and "Branch" actions.
 */

import { useState } from 'react';
import { Quote, GitBranch, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextSelectionMenuProps {
  selectedText: string;
  messageId: string;
  messageRole: 'user' | 'assistant';
  blockId: string;
  selectionRect: DOMRect;
  onReference: () => void;
  onBranch: () => void;
  onClose: () => void;
}

export function TextSelectionMenu({
  selectedText,
  messageId,
  messageRole,
  blockId,
  selectionRect,
  onReference,
  onBranch,
  onClose,
}: TextSelectionMenuProps) {
  const [isHovered, setIsHovered] = useState<'reference' | 'branch' | null>(null);

  if (!selectedText || selectedText.length < 3) return null;

  return (
    <div
      className={cn(
        "fixed z-[9999] flex items-center gap-1 p-1.5 rounded-lg pointer-events-auto",
        "bg-card border border-border/50",
        "shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6)]",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
      style={{
        left: selectionRect.left + selectionRect.width / 2,
        top: selectionRect.bottom + 8,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Reference button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onReference();
        }}
        onMouseEnter={() => setIsHovered('reference')}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
          "hover:bg-primary/10 hover:text-primary",
          isHovered === 'reference' && "bg-primary/10 text-primary"
        )}
        title="Quote this text in your next message"
      >
        <Quote className="h-3.5 w-3.5" />
        <span>Reference</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border/30" />

      {/* Branch button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBranch();
        }}
        onMouseEnter={() => setIsHovered('branch')}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
          "hover:bg-[hsl(var(--accent))/0.15] hover:text-[hsl(var(--accent))]",
          isHovered === 'branch' && "bg-[hsl(var(--accent))/0.15] text-[hsl(var(--accent))]"
        )}
        title="Create a new block from this text"
      >
        <GitBranch className="h-3.5 w-3.5" />
        <span>Branch</span>
      </button>

      {/* Close button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground ml-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

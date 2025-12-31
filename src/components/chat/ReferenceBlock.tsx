/**
 * ReferenceBlock - Displays a quoted reference in chat input
 * 
 * Shows the referenced text with source info and remove button.
 */

import { Quote, X, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatReference } from '@/types/chat-references';

interface ReferenceBlockProps {
  reference: ChatReference;
  onRemove: (id: string) => void;
  compact?: boolean;
}

export function ReferenceBlock({ reference, onRemove, compact = false }: ReferenceBlockProps) {
  const RoleIcon = reference.source_role === 'user' ? User : Bot;
  const roleLabel = reference.source_role === 'user' ? 'User' : 'Assistant';
  
  // Truncate long text for display
  const displayText = reference.selected_text.length > 150
    ? reference.selected_text.substring(0, 147) + '...'
    : reference.selected_text;

  return (
    <div
      className={cn(
        "group relative flex gap-2 rounded-lg border transition-all",
        "bg-primary/5 border-primary/20 hover:border-primary/30",
        compact ? "p-2" : "p-3"
      )}
    >
      {/* Quote indicator */}
      <div className="flex-shrink-0">
        <Quote className={cn(
          "text-primary/60",
          compact ? "h-3 w-3" : "h-4 w-4"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Source label */}
        <div className="flex items-center gap-1.5 mb-1">
          <RoleIcon className={cn(
            "text-muted-foreground",
            compact ? "h-2.5 w-2.5" : "h-3 w-3"
          )} />
          <span className={cn(
            "text-muted-foreground font-medium",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {roleLabel} said:
          </span>
        </div>

        {/* Quoted text */}
        <p className={cn(
          "text-foreground leading-relaxed",
          compact ? "text-xs" : "text-sm"
        )}>
          "{displayText}"
        </p>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(reference.id);
        }}
        className={cn(
          "flex-shrink-0 p-1 rounded-md transition-all",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-destructive/10 hover:text-destructive"
        )}
        title="Remove reference"
      >
        <X className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      </button>
    </div>
  );
}

/**
 * ReferenceList - Displays multiple references
 */
interface ReferenceListProps {
  references: ChatReference[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
}

export function ReferenceList({ references, onRemove, onClearAll }: ReferenceListProps) {
  if (references.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground font-medium">
          {references.length} reference{references.length > 1 ? 's' : ''} attached
        </span>
        {onClearAll && references.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Reference blocks */}
      <div className="space-y-1.5">
        {references.map((ref) => (
          <ReferenceBlock
            key={ref.id}
            reference={ref}
            onRemove={onRemove}
            compact={references.length > 2}
          />
        ))}
      </div>
    </div>
  );
}

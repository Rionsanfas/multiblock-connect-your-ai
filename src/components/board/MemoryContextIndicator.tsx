import { Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MemoryContextIndicatorProps {
  itemCount: number;
  charCount: number;
  wasTruncated: boolean;
  className?: string;
}

/**
 * Visual indicator showing memory is being injected into block context
 */
export function MemoryContextIndicator({ 
  itemCount, 
  charCount, 
  wasTruncated,
  className 
}: MemoryContextIndicatorProps) {
  if (itemCount === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] px-1.5 py-0 gap-1 cursor-help",
            "bg-primary/10 text-primary border-primary/30",
            className
          )}
        >
          <Brain className="h-2.5 w-2.5" />
          {itemCount} {wasTruncated && '(+)'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="text-xs">
          <strong>{itemCount} memory item{itemCount !== 1 ? 's' : ''}</strong> injected into context
          {wasTruncated && <span className="text-muted-foreground"> (some excluded due to limits)</span>}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          ~{Math.round(charCount / 4)} tokens used
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

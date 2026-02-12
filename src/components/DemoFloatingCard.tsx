import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const DEMO_URL = 'https://www.youtube.com/watch?v=IovzpNyw88A';
const DISMISS_KEY = 'multiblock_demo_dismissed';

export function DemoFloatingCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed !== 'true') {
      setVisible(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 animate-fade-in">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group">
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full border border-border/40 bg-card/90 backdrop-blur-md text-foreground/90 hover:bg-card hover:border-border/70 transition-all duration-200 shadow-[0_4px_16px_hsl(0_0%_0%/0.3)]"
            >
              <Play className="h-3 w-3" />
              Watch Demo
            </a>
            <button
              onClick={handleDismiss}
              className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-secondary/90 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          See how Multiblock memory and blocks work.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

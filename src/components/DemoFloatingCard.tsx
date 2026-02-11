import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

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

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[260px] sm:w-[280px] rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-[0_8px_32px_hsl(0_0%_0%/0.4)] animate-fade-in">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Dismiss demo notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="p-4 pr-8">
        <p className="text-sm font-semibold text-foreground mb-1">Watch 2-minute Demo</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          See how Multiblock memory and blocks work.
        </p>
        <a
          href={DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border/40 bg-secondary/60 text-foreground hover:bg-secondary hover:border-border/80 transition-all duration-200"
        >
          <Play className="h-3 w-3" />
          Watch Demo
        </a>
      </div>
    </div>
  );
}

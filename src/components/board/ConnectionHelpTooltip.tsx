import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";

const STORAGE_KEY = "multiblock-connection-help-dismissed";

export function ConnectionHelpTooltip() {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Only show on desktop/laptop
  const shouldShow = !isMobile && !isTablet;

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!shouldShow || isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 z-40",
        "max-w-[280px] p-3 rounded-xl",
        "bg-card/95 backdrop-blur-md border border-border/40",
        "shadow-lg",
        "animate-in fade-in slide-in-from-left-4 duration-300"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss tip"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-2.5 pr-5">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Pro tip:</span> Drag from one block and drop on another to create connections, even if the line isn't visible.
        </p>
      </div>
    </div>
  );
}

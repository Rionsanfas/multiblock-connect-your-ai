import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "multiblock-ltd-banner-dismissed";

export function LifetimeDealBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60]",
        "h-9 sm:h-10",
        "bg-gradient-to-r from-primary/90 via-accent/80 to-primary/90",
        "border-b border-primary/20",
        "flex items-center justify-center",
        "animate-in fade-in slide-in-from-top-2 duration-300"
      )}
    >
      <Link
        to="/pricing#lifetime"
        className="flex items-center gap-1.5 sm:gap-2 text-primary-foreground hover:opacity-90 transition-opacity px-4"
      >
        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="text-[11px] sm:text-xs font-medium truncate">
          <span className="hidden xs:inline">🚀 </span>
          Limited Time: Get Multiblock for life
          <span className="hidden sm:inline"> — one payment, forever access</span>
          <span className="ml-1 underline underline-offset-2">See Deals →</span>
        </span>
      </Link>

      <button
        onClick={handleDismiss}
        className="absolute right-2 sm:right-3 p-1.5 rounded-md hover:bg-white/10 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}

import { Plus, Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  onCenterView?: () => void;
  className?: string;
  compact?: boolean;
}

export function ZoomControls({ onCenterView, className, compact = false }: ZoomControlsProps) {
  const { zoom, setZoom } = useAppStore();

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.25, 3);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.25, 0.25);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    onCenterView?.();
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div 
      className={cn(
        "flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-card/90 backdrop-blur-xl border border-border/30 shadow-lg",
        compact && "p-0.5 gap-0",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-md sm:rounded-lg hover:bg-secondary/60",
          compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9"
        )}
        onClick={handleZoomOut}
        disabled={zoom <= 0.25}
      >
        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
      
      <span className={cn(
        "text-center font-medium text-muted-foreground",
        compact ? "min-w-[2rem] text-[10px]" : "min-w-[2.5rem] sm:min-w-[3rem] text-[10px] sm:text-xs"
      )}>
        {zoomPercent}%
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-md sm:rounded-lg hover:bg-secondary/60",
          compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9"
        )}
        onClick={handleZoomIn}
        disabled={zoom >= 3}
      >
        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
      
      <div className={cn(
        "bg-border/30",
        compact ? "w-px h-4 mx-0" : "w-px h-4 sm:h-5 mx-0.5"
      )} />
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-md sm:rounded-lg hover:bg-secondary/60",
          compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9"
        )}
        onClick={handleResetZoom}
        title="Reset zoom and center"
      >
        <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
}

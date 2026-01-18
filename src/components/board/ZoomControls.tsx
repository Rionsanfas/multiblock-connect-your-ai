import { Plus, Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  onCenterView?: () => void;
  className?: string;
}

export function ZoomControls({ onCenterView, className }: ZoomControlsProps) {
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
        "flex items-center gap-1 p-1.5 rounded-xl bg-card/90 backdrop-blur-xl border border-border/30 shadow-lg",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg hover:bg-secondary/60"
        onClick={handleZoomOut}
        disabled={zoom <= 0.25}
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <span className="min-w-[3rem] text-center text-xs font-medium text-muted-foreground">
        {zoomPercent}%
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg hover:bg-secondary/60"
        onClick={handleZoomIn}
        disabled={zoom >= 3}
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-5 bg-border/30 mx-0.5" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg hover:bg-secondary/60"
        onClick={handleResetZoom}
        title="Reset zoom and center"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

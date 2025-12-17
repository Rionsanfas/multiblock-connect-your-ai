import { HardDrive, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StorageUsageCardProps {
  usedMb: number;
  limitMb: number;
}

// Helper to format storage
const formatStorage = (mb: number): string => {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
};

export function StorageUsageCard({ usedMb, limitMb }: StorageUsageCardProps) {
  const percentage = Math.min((usedMb / limitMb) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;

  return (
    <TooltipProvider>
      <div className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-secondary/60">
              <HardDrive className="h-4 w-4" />
            </div>
            <span className="font-semibold">Storage</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <div className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">
              <p className="max-w-xs text-xs">
                Storage covers messages, blocks, and uploaded files
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Progress 
          value={percentage} 
          className={`h-2 mb-3 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}`}
        />

        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{formatStorage(usedMb)} used</span>
          <span className="font-semibold tabular-nums">{formatStorage(limitMb)} total</span>
        </div>

        {isNearLimit && !isAtLimit && (
          <p className="text-xs text-warning mt-3 p-2 rounded-lg bg-warning/10">
            Approaching storage limit
          </p>
        )}
        {isAtLimit && (
          <p className="text-xs text-destructive mt-3 p-2 rounded-lg bg-destructive/10">
            Storage almost full - consider upgrading
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

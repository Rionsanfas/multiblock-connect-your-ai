import { HardDrive, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/glass-card";
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
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Storage</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Storage covers messages, blocks, and uploaded files
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Progress 
          value={percentage} 
          className={`h-2 mb-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}`}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatStorage(usedMb)} used</span>
          <span>{formatStorage(limitMb)} total</span>
        </div>

        {isNearLimit && !isAtLimit && (
          <p className="text-xs text-warning mt-2">
            Approaching storage limit
          </p>
        )}
        {isAtLimit && (
          <p className="text-xs text-destructive mt-2">
            Storage almost full - consider upgrading
          </p>
        )}
      </GlassCard>
    </TooltipProvider>
  );
}

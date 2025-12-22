import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  variant?: "board" | "block" | "usage";
}

export function SkeletonCard({ className, variant = "board" }: SkeletonCardProps) {
  if (variant === "usage") {
    return (
      <div className={cn("rounded-xl border border-border/20 bg-card/50 p-6 animate-pulse", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-muted/50" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted/50" />
            <div className="h-3 w-16 rounded bg-muted/50" />
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/30" />
      </div>
    );
  }

  if (variant === "block") {
    return (
      <div className={cn("rounded-xl border border-border/20 bg-card/50 p-4 animate-pulse", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-3 rounded-full bg-muted/50" />
          <div className="h-4 w-32 rounded bg-muted/50" />
        </div>
        <div className="h-3 w-20 rounded bg-muted/50" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/20 bg-card/50 p-5 animate-pulse", className)}>
      <div className="h-5 w-40 rounded bg-muted/50 mb-3" />
      <div className="flex items-center gap-3">
        <div className="h-3 w-16 rounded bg-muted/30" />
        <div className="h-3 w-20 rounded bg-muted/30" />
        <div className="h-3 w-24 rounded bg-muted/30" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, variant = "board" as const, className }: { count?: number; variant?: "board" | "block"; className?: string }) {
  return (
    <div className={cn(
      variant === "board" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-3",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "solid" | "premium" | "soft";
  glow?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow = false, children, ...props }, ref) => {
    if (variant === "premium") {
      return (
        <div
          ref={ref}
          className={cn(
            "premium-card-wrapper",
            className
          )}
          {...props}
        >
          <div className="premium-card-gradient" />
          <div className="premium-card-content">
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl border backdrop-blur-xl transition-all duration-300",
          variant === "default" && "bg-card/40 border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
          variant === "hover" && "bg-card/40 border-border/20 hover:bg-card/60 hover:border-border/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
          variant === "solid" && "bg-card/70 border-border/30 shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
          variant === "soft" && "bg-secondary/40 border-border/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
          glow && "shadow-[0_0_40px_-10px_hsl(var(--primary)/0.2)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };

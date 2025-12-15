import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "solid" | "premium";
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
          "relative rounded-xl border backdrop-blur-xl transition-all duration-300",
          variant === "default" && "bg-card/30 border-border/30",
          variant === "hover" && "bg-card/30 border-border/30 hover:bg-card/50 hover:border-border/50",
          variant === "solid" && "bg-card/60 border-border/50",
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

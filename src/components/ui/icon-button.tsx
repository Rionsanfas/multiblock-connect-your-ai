import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "glass" | "soft";
  size?: "sm" | "md" | "lg";
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "default", size = "md", tooltip, children, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-secondary hover:bg-secondary/80 text-foreground shadow-sm",
          variant === "ghost" && "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
          variant === "glass" && "bg-card/30 backdrop-blur-sm border border-border/30 hover:bg-card/50 hover:border-border/50",
          variant === "soft" && "bg-secondary/50 hover:bg-secondary/70 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
          size === "sm" && "h-8 w-8 text-sm",
          size === "md" && "h-10 w-10",
          size === "lg" && "h-12 w-12",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent className="rounded-xl">{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }
);
IconButton.displayName = "IconButton";

export { IconButton };

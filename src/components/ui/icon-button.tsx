import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "default", size = "md", tooltip, children, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-secondary hover:bg-secondary/80 text-foreground",
          variant === "ghost" && "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
          variant === "glass" && "bg-card/30 backdrop-blur-sm border border-border/30 hover:bg-card/50 hover:border-border/50",
          size === "sm" && "h-7 w-7 text-sm",
          size === "md" && "h-9 w-9",
          size === "lg" && "h-11 w-11",
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
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }
);
IconButton.displayName = "IconButton";

export { IconButton };

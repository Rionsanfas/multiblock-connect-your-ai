import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.2)] hover:translate-y-[-1px]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl shadow-[0_4px_14px_0_hsl(var(--destructive)/0.25)]",
        outline: "border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border rounded-xl backdrop-blur-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "hover:bg-secondary/50 hover:text-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        // New soft UI variants
        soft: "bg-secondary/60 text-foreground hover:bg-secondary/80 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        "soft-primary": "bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.25)] hover:translate-y-[-1px]",
        // Pill variants
        pill: "bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.2)] hover:translate-y-[-1px]",
        "pill-outline": "border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border rounded-full backdrop-blur-sm hover:translate-y-[-1px]",
        "pill-accent": "bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_4px_14px_0_hsl(var(--accent)/0.3)] hover:shadow-[0_6px_20px_0_hsl(var(--accent)/0.4)] hover:translate-y-[-1px]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

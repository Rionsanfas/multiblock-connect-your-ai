import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-[0_4px_14px_0_hsl(var(--primary)/0.25)] hover:shadow-[0_6px_20px_0_hsl(var(--primary)/0.35)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline: "border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border rounded-xl backdrop-blur-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        pill: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_4px_14px_0_hsl(var(--primary)/0.25)] hover:shadow-[0_6px_20px_0_hsl(var(--primary)/0.35)] hover:translate-y-[-1px]",
        "pill-outline": "border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border rounded-full backdrop-blur-sm hover:translate-y-[-1px]",
        "pill-accent": "bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_4px_14px_0_hsl(var(--accent)/0.3)] hover:shadow-[0_6px_20px_0_hsl(var(--accent)/0.4)] hover:translate-y-[-1px]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
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

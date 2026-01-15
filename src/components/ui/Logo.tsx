import { Link } from "react-router-dom";
import { memo } from "react";
import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  iconOnly?: boolean;
  href?: string;
}

// Memoized to prevent re-renders on route changes
export const Logo = memo(function Logo({ 
  className, 
  size = "md", 
  showText = true, 
  iconOnly = false,
  href = "/"
}: LogoProps) {
  
  // Increased sizes for better visibility
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <Link 
      to={href} 
      className={cn(
        "flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className
      )}
    >
      <img 
        src={logoImage} 
        alt="Multiblock Logo" 
        className={cn(
          sizeClasses[size],
          "object-contain flex-shrink-0"
        )}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
      {showText && !iconOnly && (
        <span className={cn(
          "font-semibold text-foreground tracking-tight",
          textSizeClasses[size]
        )}>
          MultiBlock
        </span>
      )}
    </Link>
  );
});

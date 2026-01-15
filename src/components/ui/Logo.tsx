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
  
  // Much larger sizes for strong brand presence
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
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

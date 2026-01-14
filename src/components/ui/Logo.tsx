import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  iconOnly?: boolean;
}

export function Logo({ className, size = "md", showText = true, iconOnly = false }: LogoProps) {
  const { user } = useAuth();
  
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const destination = user ? "/dashboard" : "/";

  return (
    <Link 
      to={destination} 
      className={cn(
        "flex items-center gap-2 transition-opacity hover:opacity-90",
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
        decoding="async"
      />
      {showText && !iconOnly && (
        <span className={cn(
          "font-semibold text-foreground",
          textSizeClasses[size]
        )}>
          MultiBlock
        </span>
      )}
    </Link>
  );
}

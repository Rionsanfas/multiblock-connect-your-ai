import { Bot, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const blocks = [
  { icon: Bot, label: "AI Models" },
  { icon: Zap, label: "Connect" },
  { icon: Sparkles, label: "Automate" },
];

export function HeroBlocks() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* SVG Connection Lines with Glow Animation */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Animated gradient for flowing effect */}
          <linearGradient id="flowGradient1" gradientUnits="userSpaceOnUse" x1="100" y1="80" x2="100" y2="160">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-1;1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="1">
              <animate attributeName="offset" values="-0.7;1.3" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.4;1.6" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          
          <linearGradient id="flowGradient2" gradientUnits="userSpaceOnUse" x1="100" y1="240" x2="100" y2="320">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-1;1" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="1">
              <animate attributeName="offset" values="-0.7;1.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.4;1.6" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        
        {/* Static line base */}
        <path
          d="M 100 80 C 100 120, 100 120, 100 160"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 100 240 C 100 280, 100 280, 100 320"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Animated glow lines */}
        <path
          d="M 100 80 C 100 120, 100 120, 100 160"
          fill="none"
          stroke="url(#flowGradient1)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          className="motion-reduce:hidden"
        />
        <path
          d="M 100 240 C 100 280, 100 280, 100 320"
          fill="none"
          stroke="url(#flowGradient2)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          className="motion-reduce:hidden"
        />
        
        {/* Static glow for reduced motion */}
        <path
          d="M 100 80 C 100 120, 100 120, 100 160"
          fill="none"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          className="hidden motion-reduce:block"
        />
        <path
          d="M 100 240 C 100 280, 100 280, 100 320"
          fill="none"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          className="hidden motion-reduce:block"
        />
      </svg>
      
      {/* Blocks Container */}
      <div className="relative z-10 flex flex-col items-center gap-20">
        {blocks.map((block, index) => (
          <div
            key={block.label}
            className={cn(
              "relative group",
              "w-20 h-20 md:w-24 md:h-24",
              "rounded-2xl",
              "bg-gradient-to-br from-secondary/80 to-secondary/40",
              "border border-border/50",
              "shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.15)]",
              "backdrop-blur-sm",
              "flex flex-col items-center justify-center gap-1.5",
              "transition-all duration-300",
              "hover:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.25)]",
              "hover:border-primary/30"
            )}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <block.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" strokeWidth={1.5} />
            <span className="text-[10px] md:text-xs text-muted-foreground font-medium">
              {block.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

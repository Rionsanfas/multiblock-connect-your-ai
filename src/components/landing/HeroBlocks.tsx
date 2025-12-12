import { Bot, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const blocks = [
  { icon: Bot, label: "AI Models", offsetX: -20 },
  { icon: Zap, label: "Connect", offsetX: 30 },
  { icon: Sparkles, label: "Automate", offsetX: -10 },
];

export function HeroBlocks() {
  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      {/* SVG Connection Lines with Glow Animation */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter - soft outer blur */}
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Animated gradient for line 1 - shooting down effect */}
          <linearGradient id="flowGradient1" gradientUnits="userSpaceOnUse" x1="80" y1="60" x2="130" y2="140">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.3;1.3" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="15%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="-0.15;1.45" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="1">
              <animate attributeName="offset" values="0;1.6" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="45%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="0.15;1.75" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="0.3;1.9" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          
          {/* Animated gradient for line 2 - shooting down effect with delay */}
          <linearGradient id="flowGradient2" gradientUnits="userSpaceOnUse" x1="130" y1="220" x2="90" y2="300">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.3;1.3" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="15%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="-0.15;1.45" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="1">
              <animate attributeName="offset" values="0;1.6" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="45%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="0.15;1.75" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="0.3;1.9" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        
        {/* Static line base - curved paths connecting staggered blocks */}
        {/* Line 1: Block 1 (left) to Block 2 (right) */}
        <path
          d="M 80 75 C 80 110, 130 130, 130 165"
          fill="none"
          stroke="hsl(var(--primary) / 0.12)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Line 2: Block 2 (right) to Block 3 (left) */}
        <path
          d="M 130 235 C 130 270, 90 290, 90 325"
          fill="none"
          stroke="hsl(var(--primary) / 0.12)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Animated glow lines */}
        <path
          d="M 80 75 C 80 110, 130 130, 130 165"
          fill="none"
          stroke="url(#flowGradient1)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          className="motion-reduce:hidden"
        />
        <path
          d="M 130 235 C 130 270, 90 290, 90 325"
          fill="none"
          stroke="url(#flowGradient2)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          className="motion-reduce:hidden"
        />
        
        {/* Static glow for reduced motion */}
        <path
          d="M 80 75 C 80 110, 130 130, 130 165"
          fill="none"
          stroke="hsl(var(--primary) / 0.25)"
          strokeWidth="2"
          strokeLinecap="round"
          className="hidden motion-reduce:block"
        />
        <path
          d="M 130 235 C 130 270, 90 290, 90 325"
          fill="none"
          stroke="hsl(var(--primary) / 0.25)"
          strokeWidth="2"
          strokeLinecap="round"
          className="hidden motion-reduce:block"
        />
      </svg>
      
      {/* Blocks Container - staggered layout */}
      <div className="relative z-10 flex flex-col items-center gap-16 md:gap-20">
        {blocks.map((block, index) => (
          <div
            key={block.label}
            style={{ transform: `translateX(${block.offsetX}px)` }}
            className={cn(
              "relative group",
              "w-16 h-16 md:w-20 md:h-20",
              "rounded-xl md:rounded-2xl",
              "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
              "border border-border/40",
              "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.2)]",
              "backdrop-blur-md",
              "flex flex-col items-center justify-center gap-1",
              "transition-all duration-300 ease-out",
              "hover:shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.35)]",
              "hover:border-primary/40",
              "hover:scale-105"
            )}
          >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/8 via-transparent to-transparent opacity-60" />
            <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <block.icon className="w-5 h-5 md:w-6 md:h-6 text-primary relative z-10" strokeWidth={1.5} />
            <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium relative z-10">
              {block.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

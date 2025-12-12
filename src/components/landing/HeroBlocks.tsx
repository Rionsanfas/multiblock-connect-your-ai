import { cn } from "@/lib/utils";

export function HeroBlocks() {
  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[420px]">
      {/* SVG Connection Lines with Glow Animation */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 240 420"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter for dots and lines */}
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Animated dash for line 1 */}
          <linearGradient id="lineGradient1" gradientUnits="userSpaceOnUse" x1="70" y1="95" x2="140" y2="185">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </linearGradient>
          
          {/* Animated dash for line 2 */}
          <linearGradient id="lineGradient2" gradientUnits="userSpaceOnUse" x1="140" y1="255" x2="90" y2="345">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Dashed curved line 1: Block 1 to Block 2 */}
        <path
          d="M 70 95 C 70 140, 140 150, 140 185"
          fill="none"
          stroke="url(#lineGradient1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 4"
          className="motion-reduce:stroke-[hsl(var(--primary)/0.3)]"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-30"
            dur="1.5s"
            repeatCount="indefinite"
            className="motion-reduce:hidden"
          />
        </path>
        
        {/* Dashed curved line 2: Block 2 to Block 3 */}
        <path
          d="M 140 255 C 140 300, 90 310, 90 345"
          fill="none"
          stroke="url(#lineGradient2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 4"
          className="motion-reduce:stroke-[hsl(var(--primary)/0.3)]"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-30"
            dur="1.5s"
            begin="0.5s"
            repeatCount="indefinite"
            className="motion-reduce:hidden"
          />
        </path>
        
        {/* Glowing connection dots */}
        <circle cx="70" cy="95" r="6" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
        <circle cx="140" cy="185" r="6" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
        <circle cx="140" cy="255" r="6" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
        <circle cx="90" cy="345" r="6" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
      </svg>
      
      {/* Chat Blocks Container - staggered layout */}
      <div className="relative z-10 flex flex-col items-center gap-8 md:gap-10">
        {/* Block 1 - Left offset */}
        <div
          style={{ transform: "translateX(-30px)" }}
          className={cn(
            "relative",
            "w-32 h-20 md:w-40 md:h-24",
            "rounded-xl",
            "bg-gradient-to-br from-secondary/80 via-secondary/50 to-secondary/20",
            "border border-border/30",
            "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.15)]",
            "backdrop-blur-md",
            "p-3 md:p-4",
            "flex flex-col gap-2"
          )}
        >
          {/* Placeholder text lines */}
          <div className="w-full h-2 bg-muted-foreground/20 rounded-full" />
          <div className="w-3/4 h-2 bg-muted-foreground/15 rounded-full" />
          <div className="w-1/2 h-2 bg-muted-foreground/10 rounded-full" />
        </div>
        
        {/* Block 2 - Right offset */}
        <div
          style={{ transform: "translateX(40px)" }}
          className={cn(
            "relative",
            "w-36 h-24 md:w-44 md:h-28",
            "rounded-xl",
            "bg-gradient-to-br from-secondary/80 via-secondary/50 to-secondary/20",
            "border border-border/30",
            "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.15)]",
            "backdrop-blur-md",
            "p-3 md:p-4",
            "flex flex-col gap-2"
          )}
        >
          {/* Placeholder text lines */}
          <div className="w-full h-2 bg-muted-foreground/20 rounded-full" />
          <div className="w-5/6 h-2 bg-muted-foreground/15 rounded-full" />
          <div className="w-2/3 h-2 bg-muted-foreground/12 rounded-full" />
          <div className="w-1/3 h-2 bg-muted-foreground/10 rounded-full" />
        </div>
        
        {/* Block 3 - Left offset */}
        <div
          style={{ transform: "translateX(-10px)" }}
          className={cn(
            "relative",
            "w-28 h-18 md:w-36 md:h-22",
            "rounded-xl",
            "bg-gradient-to-br from-secondary/80 via-secondary/50 to-secondary/20",
            "border border-border/30",
            "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.15)]",
            "backdrop-blur-md",
            "p-3 md:p-4",
            "flex flex-col gap-2"
          )}
        >
          {/* Placeholder text lines */}
          <div className="w-full h-2 bg-muted-foreground/20 rounded-full" />
          <div className="w-2/3 h-2 bg-muted-foreground/15 rounded-full" />
        </div>
      </div>
    </div>
  );
}

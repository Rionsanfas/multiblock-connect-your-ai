import { MessageSquare, Zap, MoreHorizontal } from "lucide-react";

type IconType = "chat" | "connect" | "canvas";

interface Feature3DIconProps {
  type: IconType;
}

/* OpenAI Logo SVG */
const OpenAILogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

/* Gemini Logo SVG */
const GeminiLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
    <path d="M12 24C12 24 12 12 24 12C12 12 12 0 12 0C12 0 12 12 0 12C12 12 12 24 12 24Z" fill="url(#gemini-gradient)"/>
    <defs>
      <linearGradient id="gemini-gradient" x1="0" y1="12" x2="24" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4"/>
        <stop offset="0.5" stopColor="#9B72CB"/>
        <stop offset="1" stopColor="#D96570"/>
      </linearGradient>
    </defs>
  </svg>
);

/* xAI Logo SVG */
const XAILogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
    <path d="M2 4L9.5 12L2 20H5.5L11 14L14 17.5L9.5 23H13.5L22 12L13.5 1H9.5L14 6.5L11 10L5.5 4H2Z"/>
  </svg>
);

/* Claude/Anthropic Logo SVG */
const ClaudeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9.5c0 .83-.67 1.5-1.5 1.5S7 11.33 7 10.5 7.67 9 8.5 9s1.5.67 1.5 1.5zm7 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM12 17c-2.21 0-4-1.34-4-3h8c0 1.66-1.79 3-4 3z"/>
  </svg>
);

/* AI Block Component - matches HeroBlocks style */
const AIBlock = ({ 
  label = "GPT-5", 
  color = "primary",
  size = "md" 
}: { 
  label?: string; 
  color?: "primary" | "accent" | "emerald";
  size?: "sm" | "md";
}) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    emerald: "bg-emerald-500/10 text-emerald-400"
  };
  
  const sizeClasses = {
    sm: "w-20 px-2 py-2",
    md: "w-24 px-3 py-3"
  };
  
  return (
    <div 
      className={`
        ${sizeClasses[size]}
        rounded-xl
        bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/40
        border border-border/50
        shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.2)]
        backdrop-blur-xl
        flex flex-col gap-1.5
      `}
    >
      <div className="flex items-center justify-between">
        <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
        <MoreHorizontal className="w-3 h-3 text-muted-foreground/40" />
      </div>
      <div className="h-1.5 bg-muted/40 rounded-full w-full" />
      <div className="h-1.5 bg-muted/30 rounded-full w-3/4" />
      <div className="mt-auto pt-1 border-t border-border/30">
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${colorClasses[color]}`}>
          {label}
        </span>
      </div>
    </div>
  );
};

const Feature3DIcon = ({ type }: Feature3DIconProps) => {
  if (type === "chat") {
    return (
      <div className="feature-3d-container">
        {/* Main floating platform with 3D chat icon */}
        <div className="feature-3d-platform">
          {/* Glow effect */}
          <div className="feature-3d-glow" />
          
          {/* 3D Main Chat Icon */}
          <div className="feature-3d-main-icon-3d">
            <div className="feature-3d-cube">
              <div className="feature-3d-cube-face feature-3d-cube-front">
                <MessageSquare className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="feature-3d-cube-face feature-3d-cube-back" />
              <div className="feature-3d-cube-face feature-3d-cube-top" />
              <div className="feature-3d-cube-face feature-3d-cube-bottom" />
              <div className="feature-3d-cube-face feature-3d-cube-left" />
              <div className="feature-3d-cube-face feature-3d-cube-right" />
            </div>
          </div>
          
          {/* Orbiting AI Logos */}
          <div className="feature-3d-orbit feature-3d-orbit-logo-1">
            <div className="feature-3d-logo-satellite bg-foreground/10 border border-border/40">
              <div className="w-5 h-5 text-foreground">
                <OpenAILogo />
              </div>
            </div>
          </div>
          <div className="feature-3d-orbit feature-3d-orbit-logo-2">
            <div className="feature-3d-logo-satellite bg-foreground/10 border border-border/40">
              <div className="w-5 h-5">
                <GeminiLogo />
              </div>
            </div>
          </div>
          <div className="feature-3d-orbit feature-3d-orbit-logo-3">
            <div className="feature-3d-logo-satellite bg-foreground/10 border border-border/40">
              <div className="w-5 h-5 text-foreground">
                <XAILogo />
              </div>
            </div>
          </div>
          <div className="feature-3d-orbit feature-3d-orbit-logo-4">
            <div className="feature-3d-logo-satellite bg-foreground/10 border border-border/40">
              <div className="w-5 h-5 text-accent">
                <ClaudeLogo />
              </div>
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="feature-3d-particle feature-3d-particle-1" />
          <div className="feature-3d-particle feature-3d-particle-2" />
        </div>
        
        {/* Shadow/reflection */}
        <div className="feature-3d-shadow" />
      </div>
    );
  }

  if (type === "connect") {
    return (
      <div className="feature-3d-container">
        {/* Connected Blocks Platform */}
        <div className="feature-3d-platform feature-3d-platform-connect">
          {/* Glow effect */}
          <div className="feature-3d-glow feature-3d-glow-accent" />
          
          {/* Two AI Blocks with Connection Line */}
          <div className="feature-3d-blocks-container">
            {/* Block 1 */}
            <div className="feature-3d-block-wrapper feature-3d-block-left">
              <AIBlock label="GPT-5" color="primary" size="sm" />
            </div>
            
            {/* Connection Line SVG */}
            <svg className="feature-3d-block-connection" viewBox="0 0 60 30">
              <defs>
                <linearGradient id="block-connect-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                </linearGradient>
                <filter id="block-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Base line */}
              <path 
                d="M 0 15 Q 30 5, 60 15" 
                fill="none" 
                stroke="hsl(var(--border))" 
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              
              {/* Animated flow line */}
              <path 
                d="M 0 15 Q 30 5, 60 15" 
                fill="none" 
                stroke="url(#block-connect-gradient)" 
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#block-glow)"
                className="feature-3d-flow-line"
              />
              
              {/* Zap icon in middle */}
              <g transform="translate(25, 5)">
                <circle cx="5" cy="5" r="6" fill="hsl(var(--accent))" className="feature-3d-zap-pulse" />
                <path d="M5 2 L3.5 5.5 H5.5 L4 9 L6.5 5 H4.5 L5.5 2 Z" fill="hsl(var(--background))" />
              </g>
            </svg>
            
            {/* Block 2 */}
            <div className="feature-3d-block-wrapper feature-3d-block-right">
              <AIBlock label="Claude" color="emerald" size="sm" />
            </div>
          </div>
        </div>
        
        {/* Shadow/reflection */}
        <div className="feature-3d-shadow" />
      </div>
    );
  }

  if (type === "canvas") {
    return (
      <div className="feature-3d-container">
        {/* Single Block Platform */}
        <div className="feature-3d-platform feature-3d-platform-canvas">
          {/* Glow effect */}
          <div className="feature-3d-glow feature-3d-glow-primary" />
          
          {/* Grid background */}
          <div className="feature-3d-grid">
            <div className="feature-3d-grid-line feature-3d-grid-h1" />
            <div className="feature-3d-grid-line feature-3d-grid-h2" />
            <div className="feature-3d-grid-line feature-3d-grid-v1" />
            <div className="feature-3d-grid-line feature-3d-grid-v2" />
          </div>
          
          {/* Single AI Block - centered and floating */}
          <div className="feature-3d-single-block">
            <AIBlock label="Gemini" color="accent" size="md" />
          </div>
          
          {/* Floating dots around */}
          <div className="feature-3d-canvas-dot feature-3d-canvas-dot-1" />
          <div className="feature-3d-canvas-dot feature-3d-canvas-dot-2" />
          <div className="feature-3d-canvas-dot feature-3d-canvas-dot-3" />
        </div>
        
        {/* Shadow/reflection */}
        <div className="feature-3d-shadow" />
      </div>
    );
  }

  return null;
};

export default Feature3DIcon;

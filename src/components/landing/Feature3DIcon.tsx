import { MessageSquare, GitBranch, Layout, Zap, Bot, Sparkles } from "lucide-react";

type IconType = "chat" | "connect" | "canvas";

interface Feature3DIconProps {
  type: IconType;
}

const Feature3DIcon = ({ type }: Feature3DIconProps) => {
  if (type === "chat") {
    return (
      <div className="feature-3d-container">
        {/* Main floating platform */}
        <div className="feature-3d-platform">
          {/* Glow effect */}
          <div className="feature-3d-glow" />
          
          {/* Main icon */}
          <div className="feature-3d-main-icon">
            <MessageSquare className="w-8 h-8 text-foreground" strokeWidth={1.5} />
          </div>
          
          {/* Orbiting elements */}
          <div className="feature-3d-orbit feature-3d-orbit-1">
            <div className="feature-3d-satellite">
              <Bot className="w-4 h-4 text-accent" strokeWidth={2} />
            </div>
          </div>
          <div className="feature-3d-orbit feature-3d-orbit-2">
            <div className="feature-3d-satellite-sm">
              <Sparkles className="w-3 h-3 text-primary" strokeWidth={2} />
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="feature-3d-particle feature-3d-particle-1" />
          <div className="feature-3d-particle feature-3d-particle-2" />
          <div className="feature-3d-particle feature-3d-particle-3" />
        </div>
        
        {/* Shadow/reflection */}
        <div className="feature-3d-shadow" />
      </div>
    );
  }

  if (type === "connect") {
    return (
      <div className="feature-3d-container">
        {/* Main floating platform */}
        <div className="feature-3d-platform feature-3d-platform-connect">
          {/* Glow effect */}
          <div className="feature-3d-glow feature-3d-glow-accent" />
          
          {/* Connection nodes */}
          <div className="feature-3d-node feature-3d-node-1">
            <div className="w-3 h-3 rounded-full bg-accent/80" />
          </div>
          <div className="feature-3d-node feature-3d-node-2">
            <div className="w-3 h-3 rounded-full bg-primary/80" />
          </div>
          <div className="feature-3d-node feature-3d-node-3">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/60" />
          </div>
          
          {/* Connection lines (SVG) */}
          <svg className="feature-3d-connections" viewBox="0 0 100 100">
            <path 
              d="M50 50 L25 30" 
              stroke="url(#connect-gradient)" 
              strokeWidth="1.5" 
              fill="none"
              strokeLinecap="round"
              className="feature-3d-line"
            />
            <path 
              d="M50 50 L75 35" 
              stroke="url(#connect-gradient)" 
              strokeWidth="1.5" 
              fill="none"
              strokeLinecap="round"
              className="feature-3d-line feature-3d-line-delay"
            />
            <path 
              d="M50 50 L60 75" 
              stroke="url(#connect-gradient)" 
              strokeWidth="1.5" 
              fill="none"
              strokeLinecap="round"
              className="feature-3d-line feature-3d-line-delay-2"
            />
            <defs>
              <linearGradient id="connect-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--accent))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Main icon */}
          <div className="feature-3d-main-icon">
            <GitBranch className="w-7 h-7 text-foreground" strokeWidth={1.5} />
          </div>
          
          {/* Zap effect */}
          <div className="feature-3d-zap">
            <Zap className="w-4 h-4 text-accent" fill="hsl(var(--accent))" strokeWidth={0} />
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
        {/* Main floating platform */}
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
          
          {/* Floating blocks */}
          <div className="feature-3d-block feature-3d-block-1">
            <div className="w-6 h-4 rounded-sm bg-accent/40 border border-accent/60" />
          </div>
          <div className="feature-3d-block feature-3d-block-2">
            <div className="w-5 h-5 rounded-sm bg-primary/30 border border-primary/50" />
          </div>
          <div className="feature-3d-block feature-3d-block-3">
            <div className="w-4 h-3 rounded-sm bg-foreground/20 border border-foreground/30" />
          </div>
          
          {/* Main icon */}
          <div className="feature-3d-main-icon">
            <Layout className="w-8 h-8 text-foreground" strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Shadow/reflection */}
        <div className="feature-3d-shadow" />
      </div>
    );
  }

  return null;
};

export default Feature3DIcon;

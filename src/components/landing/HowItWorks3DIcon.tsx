import { MoreHorizontal } from "lucide-react";

type HowItWorksIconType = "add" | "chat" | "connect";

interface HowItWorks3DIconProps {
  type: HowItWorksIconType;
}

/* AI Block Component */
const AIBlock = ({ 
  label = "GPT-5", 
  color = "primary",
  size = "sm" 
}: { 
  label?: string; 
  color?: "primary" | "accent" | "emerald";
  size?: "xs" | "sm" | "md";
}) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    emerald: "bg-emerald-500/10 text-emerald-400"
  };
  
  const sizeClasses = {
    xs: "w-16 px-2 py-2",
    sm: "w-20 px-2.5 py-2.5",
    md: "w-24 px-3 py-3"
  };
  
  return (
    <div 
      className={`
        ${sizeClasses[size]}
        rounded-lg
        bg-gradient-to-br from-secondary/90 via-secondary/70 to-secondary/50
        border border-border/50
        shadow-[0_6px_24px_-6px_hsl(var(--primary)/0.25)]
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
      <div className="mt-auto pt-1.5 border-t border-border/30">
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${colorClasses[color]}`}>
          {label}
        </span>
      </div>
    </div>
  );
};

const HowItWorks3DIcon = ({ type }: HowItWorks3DIconProps) => {
  if (type === "add") {
    return (
      <div className="hiw-3d-container">
        <div className="hiw-3d-platform">
          {/* Glow */}
          <div className="hiw-3d-glow" />
          
          {/* 3D Plus Icon */}
          <div className="hiw-3d-plus-wrapper">
            <div className="hiw-3d-plus">
              <div className="hiw-3d-plus-h" />
              <div className="hiw-3d-plus-v" />
            </div>
          </div>
          
          {/* AI Block being added - animated */}
          <div className="hiw-3d-block-adding">
            <AIBlock label="New" color="accent" size="xs" />
          </div>
          
          {/* Particles */}
          <div className="hiw-3d-particle hiw-3d-particle-1" />
          <div className="hiw-3d-particle hiw-3d-particle-2" />
        </div>
        <div className="hiw-3d-shadow" />
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className="hiw-3d-container">
        <div className="hiw-3d-platform hiw-3d-platform-chat">
          {/* Glow */}
          <div className="hiw-3d-glow hiw-3d-glow-accent" />
          
          {/* Big text that overflows */}
          <div className="hiw-3d-text-overflow">
            <span className="hiw-3d-big-text">
              <span className="hiw-3d-text-highlight">AI</span>
            </span>
          </div>
          
          {/* Response text lines with highlight animation */}
          <div className="hiw-3d-response-lines">
            <div className="hiw-3d-response-line hiw-3d-response-line-1" />
            <div className="hiw-3d-response-line hiw-3d-response-line-2" />
            <div className="hiw-3d-response-line hiw-3d-response-line-3" />
          </div>
        </div>
        <div className="hiw-3d-shadow" />
      </div>
    );
  }

  if (type === "connect") {
    return (
      <div className="hiw-3d-container">
        <div className="hiw-3d-platform hiw-3d-platform-connect">
          {/* Glow */}
          <div className="hiw-3d-glow hiw-3d-glow-emerald" />
          
          {/* 3D Chain Links */}
          <div className="hiw-3d-chain">
            <div className="hiw-3d-chain-link hiw-3d-chain-link-1">
              <div className="hiw-3d-chain-inner" />
            </div>
            <div className="hiw-3d-chain-link hiw-3d-chain-link-2">
              <div className="hiw-3d-chain-inner" />
            </div>
            <div className="hiw-3d-chain-link hiw-3d-chain-link-3">
              <div className="hiw-3d-chain-inner" />
            </div>
          </div>
          
          {/* Flow particles */}
          <div className="hiw-3d-flow-particle hiw-3d-flow-particle-1" />
          <div className="hiw-3d-flow-particle hiw-3d-flow-particle-2" />
          <div className="hiw-3d-flow-particle hiw-3d-flow-particle-3" />
        </div>
        <div className="hiw-3d-shadow" />
      </div>
    );
  }

  return null;
};

export default HowItWorks3DIcon;

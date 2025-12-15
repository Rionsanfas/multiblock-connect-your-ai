import { Plus, Link } from "lucide-react";

type IconType = "add" | "chat" | "connect";

interface HowItWorks3DIconProps {
  type: IconType;
}

// AI Block component matching the software's design
const AIBlock = ({ 
  label, 
  color, 
  size = "sm",
  className = ""
}: { 
  label: string; 
  color: string; 
  size?: "xs" | "sm" | "md";
  className?: string;
}) => {
  const sizeClasses = {
    xs: "w-12 h-8 text-[6px]",
    sm: "w-16 h-10 text-[8px]",
    md: "w-20 h-12 text-[10px]",
  };

  return (
    <div 
      className={`rounded-lg border border-border/40 flex items-center justify-center font-medium shadow-lg ${sizeClasses[size]} ${className}`}
      style={{ 
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        borderColor: `${color}40`,
        boxShadow: `0 4px 12px ${color}20, inset 0 1px 0 ${color}30`
      }}
    >
      <span style={{ color }}>{label}</span>
    </div>
  );
};

const HowItWorks3DIcon = ({ type }: HowItWorks3DIconProps) => {
  if (type === "add") {
    return (
      <div className="hiw-3d-container">
        {/* Animated Plus Icon */}
        <div className="hiw-plus-icon-wrapper">
          <Plus className="hiw-plus-icon" strokeWidth={2.5} />
        </div>
        
        {/* AI Block being added */}
        <div className="hiw-block-appearing">
          <AIBlock label="GPT-4" color="#10a37f" size="sm" />
        </div>
        
        {/* Floating particles */}
        <div className="hiw-particle hiw-particle-1" />
        <div className="hiw-particle hiw-particle-2" />
        <div className="hiw-particle hiw-particle-3" />
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className="hiw-3d-container-chat">
        {/* Chat text animation */}
        <div className="hiw-chat-text-wrapper">
          <div className="hiw-chat-line hiw-chat-line-1">
            <span className="hiw-highlight-text">Compare responses</span>
          </div>
          <div className="hiw-chat-line hiw-chat-line-2">
            <span className="hiw-highlight-text">from multiple models</span>
          </div>
          <div className="hiw-chat-line hiw-chat-line-3">
            <span className="hiw-highlight-text">in real-time</span>
          </div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="hiw-chat-glow" />
      </div>
    );
  }

  if (type === "connect") {
    return (
      <div className="hiw-3d-container-connect">
        {/* Animated chain/link icon */}
        <div className="hiw-chain-wrapper">
          <Link className="hiw-chain-icon" strokeWidth={2} />
          <div className="hiw-chain-glow" />
        </div>
        
        {/* Connection lines */}
        <svg className="hiw-connection-lines" viewBox="0 0 120 80">
          <path
            d="M10 40 Q30 20 60 40 Q90 60 110 40"
            className="hiw-connection-path"
            fill="none"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  return null;
};

export default HowItWorks3DIcon;

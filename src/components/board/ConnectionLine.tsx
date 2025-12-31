import { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  connectionId?: string;
  isDrawing?: boolean;
  boardId?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function ConnectionLine({ from, to, connectionId, isDrawing, boardId, onContextMenu }: ConnectionLineProps) {
  const { deleteConnection, selectConnection, selectedConnectionId } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const uniqueId = useId();
  
  const isSelected = connectionId === selectedConnectionId;

  // Calculate control points for a smooth S-curve (like the reference image)
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // More pronounced curve for shorter distances, smoother for longer
  const controlOffset = Math.max(Math.min(distance * 0.4, 200), 80);

  // Create smooth bezier curve path
  const path = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;

  // Unique IDs for filters/gradients
  const glowFilterId = `glow-${uniqueId}`;
  const coreGradientId = `core-${uniqueId}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectionId && !isDrawing) {
      selectConnection(isSelected ? null : connectionId);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectionId) {
      deleteConnection(connectionId);
    }
  };

  // Calculate midpoint for delete button
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e);
  };

  // Colors - soft white glow for main line
  const coreColor = isSelected ? "hsl(0, 70%, 60%)" : "hsl(0, 0%, 95%)";
  const glowColor = isSelected ? "hsl(0, 70%, 50%)" : "hsl(0, 0%, 80%)";
  const softGlowColor = isSelected ? "hsl(0, 60%, 40%)" : "hsl(0, 0%, 60%)";

  return (
    <g 
      className={cn("group", !isDrawing && "cursor-pointer")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Definitions */}
      <defs>
        {/* Soft glow filter */}
        <filter id={glowFilterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur1" />
          <feGaussianBlur stdDeviation="16" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Core gradient for the bright center */}
        <linearGradient id={coreGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={coreColor} stopOpacity="0.9" />
          <stop offset="50%" stopColor={coreColor} stopOpacity="1" />
          <stop offset="100%" stopColor={coreColor} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Invisible wider path for easier clicking */}
      {!isDrawing && (
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth="30"
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        />
      )}

      {/* Selection highlight ring */}
      {isSelected && !isDrawing && (
        <path
          d={path}
          fill="none"
          stroke="hsl(0, 70%, 55%)"
          strokeWidth="10"
          strokeOpacity="0.3"
          strokeLinecap="round"
          className="animate-pulse"
        />
      )}

      {/* Outermost soft glow - creates the hazy atmosphere */}
      <path
        d={path}
        fill="none"
        stroke={softGlowColor}
        strokeWidth={isDrawing ? "12" : "20"}
        strokeOpacity="0.15"
        strokeLinecap="round"
        filter={`url(#${glowFilterId})`}
      />

      {/* Middle glow layer */}
      <path
        d={path}
        fill="none"
        stroke={glowColor}
        strokeWidth={isDrawing ? "6" : "10"}
        strokeOpacity="0.3"
        strokeLinecap="round"
      />

      {/* Main visible path - bright core */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${coreGradientId})`}
        strokeWidth={isDrawing ? "2" : "3"}
        strokeDasharray={isDrawing ? "8 6" : "none"}
        strokeLinecap="round"
      />

      {/* Inner bright highlight - creates the bright center line effect */}
      <path
        d={path}
        fill="none"
        stroke="hsl(0, 0%, 100%)"
        strokeWidth="1"
        strokeOpacity={isDrawing ? "0.6" : "0.8"}
        strokeLinecap="round"
        strokeDasharray={isDrawing ? "8 6" : "none"}
      />
      
      {/* Animated flowing particles - only for established connections */}
      {!isDrawing && (
        <>
          {/* Primary flowing particle */}
          <circle r="3" fill="hsl(0, 0%, 100%)" opacity="0.9">
            <animateMotion dur="3s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="6" fill="hsl(0, 0%, 80%)" opacity="0.3" filter={`url(#${glowFilterId})`}>
            <animateMotion dur="3s" repeatCount="indefinite" path={path} />
          </circle>
          
          {/* Secondary particle - offset timing */}
          <circle r="2" fill="hsl(0, 0%, 100%)" opacity="0.7">
            <animateMotion dur="3s" repeatCount="indefinite" path={path} begin="1s" />
          </circle>
          <circle r="4" fill="hsl(0, 0%, 80%)" opacity="0.2" filter={`url(#${glowFilterId})`}>
            <animateMotion dur="3s" repeatCount="indefinite" path={path} begin="1s" />
          </circle>

          {/* Third particle */}
          <circle r="2" fill="hsl(0, 0%, 100%)" opacity="0.6">
            <animateMotion dur="3s" repeatCount="indefinite" path={path} begin="2s" />
          </circle>
          <circle r="4" fill="hsl(0, 0%, 80%)" opacity="0.15" filter={`url(#${glowFilterId})`}>
            <animateMotion dur="3s" repeatCount="indefinite" path={path} begin="2s" />
          </circle>
        </>
      )}

      {/* Delete button - appears when selected or hovered */}
      {!isDrawing && (isSelected || isHovered) && (
        <g 
          onClick={handleDelete}
          style={{ cursor: 'pointer' }}
          className="transition-opacity"
        >
          {/* Button background with glow */}
          <circle
            cx={midX}
            cy={midY}
            r="14"
            fill="hsl(0, 60%, 45%)"
            className="drop-shadow-lg"
          />
          <circle
            cx={midX}
            cy={midY}
            r="12"
            fill="hsl(0, 65%, 55%)"
          />
          {/* X icon */}
          <line
            x1={midX - 4}
            y1={midY - 4}
            x2={midX + 4}
            y2={midY + 4}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1={midX + 4}
            y1={midY - 4}
            x2={midX - 4}
            y2={midY + 4}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}
      
      {/* End point indicator - subtle glow */}
      <g>
        <circle
          cx={to.x}
          cy={to.y}
          r="8"
          fill={softGlowColor}
          fillOpacity="0.2"
          filter={`url(#${glowFilterId})`}
        />
        <circle
          cx={to.x}
          cy={to.y}
          r="4"
          fill={coreColor}
        />
        <circle
          cx={to.x - 1}
          cy={to.y - 1}
          r="1.5"
          fill="hsl(0, 0%, 100%)"
          fillOpacity="0.8"
        />
      </g>

      {/* Start point indicator */}
      <g>
        <circle
          cx={from.x}
          cy={from.y}
          r="6"
          fill={softGlowColor}
          fillOpacity="0.15"
          filter={`url(#${glowFilterId})`}
        />
        <circle
          cx={from.x}
          cy={from.y}
          r="3"
          fill={coreColor}
        />
        <circle
          cx={from.x - 0.5}
          cy={from.y - 0.5}
          r="1"
          fill="hsl(0, 0%, 100%)"
          fillOpacity="0.7"
        />
      </g>
    </g>
  );
}

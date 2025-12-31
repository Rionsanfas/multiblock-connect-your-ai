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

  // Calculate control points for a smooth S-curve
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const controlOffset = Math.max(Math.min(distance * 0.4, 200), 80);

  // Create smooth bezier curve path
  const path = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;

  // Create parallel offset paths for the flowing lines effect
  const createOffsetPath = (offset: number) => {
    const perpX = -dy / distance || 0;
    const perpY = dx / distance || 0;
    const ox = perpX * offset;
    const oy = perpY * offset;
    return `M ${from.x + ox} ${from.y + oy} C ${from.x + controlOffset + ox} ${from.y + oy}, ${to.x - controlOffset + ox} ${to.y + oy}, ${to.x + ox} ${to.y + oy}`;
  };

  // Unique IDs for filters/gradients
  const glowFilterId = `glow-${uniqueId}`;
  const endGlowId = `end-glow-${uniqueId}`;
  const lineGradientId = `line-grad-${uniqueId}`;

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

  // Colors
  const coreColor = isSelected ? "hsl(0, 70%, 60%)" : "hsl(0, 0%, 85%)";

  return (
    <g 
      className={cn("group", !isDrawing && "cursor-pointer")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Definitions */}
      <defs>
        {/* Soft blur for line glow */}
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Strong glow for endpoints - focused power effect */}
        <filter id={endGlowId} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="8" result="blur1" />
          <feGaussianBlur stdDeviation="16" result="blur2" />
          <feGaussianBlur stdDeviation="24" result="blur3" />
          <feMerge>
            <feMergeNode in="blur3" />
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient that fades at edges - bright in center of line */}
        <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={coreColor} stopOpacity="0.3" />
          <stop offset="15%" stopColor={coreColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={coreColor} stopOpacity="0.5" />
          <stop offset="85%" stopColor={coreColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={coreColor} stopOpacity="0.3" />
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

      {/* Selection highlight */}
      {isSelected && !isDrawing && (
        <path
          d={path}
          fill="none"
          stroke="hsl(0, 70%, 55%)"
          strokeWidth="12"
          strokeOpacity="0.25"
          strokeLinecap="round"
        />
      )}

      {/* Multiple flowing lines that move together */}
      {!isDrawing && (
        <>
          {/* Outer glow layer */}
          <path
            d={path}
            fill="none"
            stroke="hsl(0, 0%, 60%)"
            strokeWidth="16"
            strokeOpacity="0.08"
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
          />
          
          {/* Line 1 - top offset, organic movement */}
          <path
            d={createOffsetPath(3)}
            fill="none"
            stroke="hsl(0, 0%, 75%)"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values={`${createOffsetPath(3)};${createOffsetPath(4.5)};${createOffsetPath(2)};${createOffsetPath(5)};${createOffsetPath(3)}`}
              dur="4s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.5;0.7;0.4;0.6;0.5"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </path>

          {/* Line 2 - center main line */}
          <path
            d={path}
            fill="none"
            stroke="hsl(0, 0%, 90%)"
            strokeWidth="2"
            strokeOpacity="0.8"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values={`${createOffsetPath(0)};${createOffsetPath(1.5)};${createOffsetPath(-1)};${createOffsetPath(0.5)};${createOffsetPath(0)}`}
              dur="3.5s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.8;0.95;0.7;0.85;0.8"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </path>

          {/* Line 3 - bottom offset */}
          <path
            d={createOffsetPath(-3)}
            fill="none"
            stroke="hsl(0, 0%, 75%)"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values={`${createOffsetPath(-3)};${createOffsetPath(-5)};${createOffsetPath(-2)};${createOffsetPath(-4)};${createOffsetPath(-3)}`}
              dur="4.5s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.5;0.6;0.4;0.7;0.5"
              dur="3.8s"
              repeatCount="indefinite"
            />
          </path>

          {/* Line 4 - subtle inner line */}
          <path
            d={createOffsetPath(1)}
            fill="none"
            stroke="hsl(0, 0%, 100%)"
            strokeWidth="1"
            strokeOpacity="0.4"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values={`${createOffsetPath(1)};${createOffsetPath(2.5)};${createOffsetPath(-0.5)};${createOffsetPath(1.5)};${createOffsetPath(1)}`}
              dur="3s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </path>
        </>
      )}

      {/* Drawing state - dashed line */}
      {isDrawing && (
        <>
          <path
            d={path}
            fill="none"
            stroke="hsl(0, 0%, 70%)"
            strokeWidth="8"
            strokeOpacity="0.1"
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
          />
          <path
            d={path}
            fill="none"
            stroke="hsl(0, 0%, 85%)"
            strokeWidth="2"
            strokeDasharray="10 6"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        </>
      )}

      {/* Delete button - appears when selected or hovered */}
      {!isDrawing && (isSelected || isHovered) && (
        <g 
          onClick={handleDelete}
          style={{ cursor: 'pointer' }}
        >
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
      
      {/* End point - focused power glow effect */}
      <g>
        {/* Outer glow halo */}
        <circle
          cx={to.x}
          cy={to.y}
          r="20"
          fill="hsl(0, 0%, 70%)"
          fillOpacity="0.15"
          filter={`url(#${endGlowId})`}
        >
          <animate
            attributeName="r"
            values="18;22;20;24;18"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="fill-opacity"
            values="0.15;0.25;0.12;0.2;0.15"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Medium glow ring */}
        <circle
          cx={to.x}
          cy={to.y}
          r="12"
          fill="hsl(0, 0%, 80%)"
          fillOpacity="0.3"
        >
          <animate
            attributeName="r"
            values="10;14;11;13;10"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Bright core */}
        <circle
          cx={to.x}
          cy={to.y}
          r="5"
          fill="hsl(0, 0%, 95%)"
        />
        {/* Highlight spot */}
        <circle
          cx={to.x - 1}
          cy={to.y - 1}
          r="2"
          fill="hsl(0, 0%, 100%)"
        />
      </g>

      {/* Start point - focused power glow effect */}
      <g>
        {/* Outer glow halo */}
        <circle
          cx={from.x}
          cy={from.y}
          r="18"
          fill="hsl(0, 0%, 70%)"
          fillOpacity="0.12"
          filter={`url(#${endGlowId})`}
        >
          <animate
            attributeName="r"
            values="16;20;18;22;16"
            dur="3.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="fill-opacity"
            values="0.12;0.2;0.1;0.18;0.12"
            dur="2.7s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Medium glow ring */}
        <circle
          cx={from.x}
          cy={from.y}
          r="10"
          fill="hsl(0, 0%, 80%)"
          fillOpacity="0.25"
        >
          <animate
            attributeName="r"
            values="8;12;9;11;8"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Bright core */}
        <circle
          cx={from.x}
          cy={from.y}
          r="4"
          fill="hsl(0, 0%, 95%)"
        />
        {/* Highlight spot */}
        <circle
          cx={from.x - 0.5}
          cy={from.y - 0.5}
          r="1.5"
          fill="hsl(0, 0%, 100%)"
        />
      </g>
    </g>
  );
}

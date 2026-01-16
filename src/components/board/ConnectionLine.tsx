import { useState, useId, useRef, useEffect } from "react";
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
  const [isSplit, setIsSplit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uniqueId = useId();
  
  const isSelected = connectionId === selectedConnectionId;

  // Calculate smooth organic curve with horizontal bias for natural flow
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Use horizontal-biased control points for smoother, more organic curves
  const controlOffset = Math.max(Math.min(distance * 0.5, 250), 60);
  
  // Horizontal bias creates flowing, ribbon-like curves
  const horizontalBias = Math.abs(dx) > Math.abs(dy) ? 0.9 : 0.6;
  
  // Control points curve outward horizontally, creating elegant S-curves
  const cp1x = from.x + controlOffset * horizontalBias * Math.sign(dx || 1);
  const cp1y = from.y + controlOffset * (1 - horizontalBias) * Math.sign(dy || 0.1);
  const cp2x = to.x - controlOffset * horizontalBias * Math.sign(dx || 1);
  const cp2y = to.y - controlOffset * (1 - horizontalBias) * Math.sign(dy || 0.1);

  // Smooth cubic bezier path
  const path = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;

  // Filter IDs
  const glowFilterId = `glow-${uniqueId}`;

  const handleMouseEnter = () => {
    if (isDrawing) return;
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsSplit(true);
    }, 1500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (!isDeleting) {
      setIsSplit(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSplit && connectionId && !isDrawing) {
      setIsDeleting(true);
      setTimeout(() => {
        deleteConnection(connectionId);
      }, 300);
    } else if (connectionId && !isDrawing) {
      selectConnection(isSelected ? null : connectionId);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e);
  };

  // Softer, more elegant colors
  const lineColor = isSelected ? "hsl(45, 70%, 60%)" : "hsl(0, 0%, 75%)";
  const shadowColor = isSelected ? "hsl(45, 60%, 35%)" : "hsl(0, 0%, 50%)";

  return (
    <g 
      className={cn("group", !isDrawing && "cursor-pointer")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Definitions - softer glow */}
      <defs>
        <filter id={glowFilterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="30"
        style={{ cursor: 'pointer' }}
      />

      {/* Selection highlight */}
      {isSelected && !isDrawing && (
        <path
          d={path}
          fill="none"
          stroke="hsl(45, 80%, 55%)"
          strokeWidth="10"
          strokeOpacity="0.25"
          strokeLinecap="round"
        />
      )}

      {/* Soft, elegant line with subtle depth */}
      {!isDeleting && (
        <>
          {/* Soft shadow for subtle depth */}
          <path
            d={path}
            fill="none"
            stroke={shadowColor}
            strokeWidth="6"
            strokeOpacity="0.15"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0, 2)"
          />
          
          {/* Main soft line */}
          <path
            d={path}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeOpacity="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={isHovered ? `url(#${glowFilterId})` : undefined}
            // IMPORTANT: do NOT transition geometry ("d") during drags; only transition visual style.
            className="transition-[stroke,stroke-opacity,filter] duration-200"
          />
          
          {/* Subtle highlight */}
          <path
            d={path}
            fill="none"
            stroke="hsl(0, 0%, 100%)"
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(-0.3, -0.3)"
          />
        </>
      )}

      {/* Deleting animation */}
      {isDeleting && (
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeOpacity="0.8"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-opacity"
            from="0.8"
            to="0"
            dur="0.3s"
            fill="freeze"
          />
        </path>
      )}

      {/* Split indicator */}
      {isSplit && !isDeleting && (
        <text
          x={(from.x + to.x) / 2}
          y={(from.y + to.y) / 2 - 20}
          textAnchor="middle"
          fill="hsl(0, 0%, 60%)"
          fontSize="11"
          fontFamily="system-ui"
          opacity="0.8"
        >
          click to remove
        </text>
      )}
      
      {/* Soft end point dot */}
      {!isDeleting && (
        <g className="transition-all duration-200">
          <circle
            cx={to.x}
            cy={to.y}
            r="5"
            fill={shadowColor}
            fillOpacity="0.2"
            transform="translate(0, 1)"
          />
          <circle
            cx={to.x}
            cy={to.y}
            r="4"
            fill={lineColor}
            fillOpacity="0.9"
          />
          <circle
            cx={to.x - 0.5}
            cy={to.y - 0.5}
            r="1.5"
            fill="hsl(0, 0%, 100%)"
            fillOpacity="0.5"
          />
        </g>
      )}

      {/* Soft start point dot */}
      {!isDeleting && (
        <g className="transition-all duration-200">
          <circle
            cx={from.x}
            cy={from.y}
            r="4"
            fill={shadowColor}
            fillOpacity="0.2"
            transform="translate(0, 1)"
          />
          <circle
            cx={from.x}
            cy={from.y}
            r="3"
            fill={lineColor}
            fillOpacity="0.9"
          />
          <circle
            cx={from.x - 0.3}
            cy={from.y - 0.3}
            r="1"
            fill="hsl(0, 0%, 100%)"
            fillOpacity="0.5"
          />
        </g>
      )}
    </g>
  );
}

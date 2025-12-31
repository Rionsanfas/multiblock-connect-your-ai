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

  // Calculate control points for smooth curve
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const dirX = distance > 0 ? dx / distance : 1;
  const dirY = distance > 0 ? dy / distance : 0;
  
  const controlOffset = Math.max(Math.min(distance * 0.4, 200), 80);

  // Simple bezier curve path
  const path = `M ${from.x} ${from.y} C ${from.x + dirX * controlOffset} ${from.y + dirY * controlOffset}, ${to.x - dirX * controlOffset} ${to.y - dirY * controlOffset}, ${to.x} ${to.y}`;

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

  // Colors
  const lineColor = isSelected ? "hsl(45, 80%, 55%)" : "hsl(0, 0%, 90%)";
  const shadowColor = isSelected ? "hsl(45, 80%, 40%)" : "hsl(0, 0%, 40%)";

  return (
    <g 
      className={cn("group", !isDrawing && "cursor-pointer")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Definitions */}
      <defs>
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
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

      {/* 3D Line effect - shadow layer (creates depth) */}
      {!isDeleting && (
        <>
          {/* Bottom shadow for 3D depth */}
          <path
            d={path}
            fill="none"
            stroke={shadowColor}
            strokeWidth="4"
            strokeOpacity="0.4"
            strokeLinecap="round"
            transform="translate(1, 2)"
          />
          
          {/* Main white line */}
          <path
            d={path}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeOpacity="1"
            strokeLinecap="round"
            filter={isHovered ? `url(#${glowFilterId})` : undefined}
          />
          
          {/* Highlight for 3D effect */}
          <path
            d={path}
            fill="none"
            stroke="hsl(0, 0%, 100%)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            strokeLinecap="round"
            transform="translate(-0.5, -0.5)"
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
      
      {/* End point dot */}
      {!isDeleting && (
        <g>
          <circle
            cx={to.x}
            cy={to.y}
            r="6"
            fill={shadowColor}
            fillOpacity="0.3"
            transform="translate(1, 1)"
          />
          <circle
            cx={to.x}
            cy={to.y}
            r="5"
            fill={lineColor}
          />
          <circle
            cx={to.x - 1}
            cy={to.y - 1}
            r="2"
            fill="hsl(0, 0%, 100%)"
            fillOpacity="0.8"
          />
        </g>
      )}

      {/* Start point dot */}
      {!isDeleting && (
        <g>
          <circle
            cx={from.x}
            cy={from.y}
            r="5"
            fill={shadowColor}
            fillOpacity="0.3"
            transform="translate(1, 1)"
          />
          <circle
            cx={from.x}
            cy={from.y}
            r="4"
            fill={lineColor}
          />
          <circle
            cx={from.x - 0.5}
            cy={from.y - 0.5}
            r="1.5"
            fill="hsl(0, 0%, 100%)"
            fillOpacity="0.8"
          />
        </g>
      )}
    </g>
  );
}

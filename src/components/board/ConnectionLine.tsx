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

  // Calculate control points for a smooth S-curve
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const controlOffset = Math.max(Math.min(distance * 0.4, 200), 80);

  // Create smooth bezier curve path
  const path = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;

  // Create parallel offset paths for the flowing lines effect
  const createOffsetPath = (offset: number, splitAmount: number = 0) => {
    const perpX = -dy / distance || 0;
    const perpY = dx / distance || 0;
    const totalOffset = offset + splitAmount;
    const ox = perpX * totalOffset;
    const oy = perpY * totalOffset;
    return `M ${from.x + ox} ${from.y + oy} C ${from.x + controlOffset + ox} ${from.y + oy}, ${to.x - controlOffset + ox} ${to.y + oy}, ${to.x + ox} ${to.y + oy}`;
  };

  // Create a path that retracts to the source
  const createRetractPath = (progress: number) => {
    const endX = from.x + (to.x - from.x) * (1 - progress);
    const endY = from.y + (to.y - from.y) * (1 - progress);
    const cp1x = from.x + controlOffset * (1 - progress);
    const cp2x = endX - controlOffset * (1 - progress) * 0.5;
    return `M ${from.x} ${from.y} C ${cp1x} ${from.y}, ${cp2x} ${endY}, ${endX} ${endY}`;
  };

  // Unique IDs for filters
  const glowFilterId = `glow-${uniqueId}`;
  const endGlowId = `end-glow-${uniqueId}`;

  const handleMouseEnter = () => {
    if (isDrawing) return;
    setIsHovered(true);
    // Start 1.5s timer to split
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
      // Trigger delete animation
      setIsDeleting(true);
      // After animation, delete
      setTimeout(() => {
        deleteConnection(connectionId);
      }, 400);
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

  // Split amount for the delete preview
  const splitOffset = isSplit ? 25 : 0;

  // Colors
  const lineColor = isSelected ? "hsl(0, 70%, 60%)" : "hsl(0, 0%, 85%)";
  const glowColor = isSelected ? "hsl(0, 60%, 50%)" : "hsl(0, 0%, 70%)";

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
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

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
      </defs>

      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="40"
        style={{ cursor: 'pointer' }}
      />

      {/* Selection highlight */}
      {isSelected && !isDrawing && (
        <path
          d={path}
          fill="none"
          stroke="hsl(0, 70%, 55%)"
          strokeWidth="14"
          strokeOpacity="0.2"
          strokeLinecap="round"
        />
      )}

      {/* Main flowing lines - same style for drawing and established */}
      {!isDeleting && (
        <>
          {/* Outer glow layer */}
          <path
            d={path}
            fill="none"
            stroke={glowColor}
            strokeWidth="18"
            strokeOpacity="0.1"
            strokeLinecap="round"
            filter={`url(#${glowFilterId})`}
          />
          
          {/* Line 1 - top offset, dramatic organic movement */}
          <path
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
            strokeOpacity={isSplit ? "0.8" : "0.6"}
            strokeLinecap="round"
            style={{ transition: isSplit ? 'none' : 'stroke-opacity 0.3s' }}
          >
            {!isDrawing ? (
              <>
                <animate
                  attributeName="d"
                  values={`${createOffsetPath(4, splitOffset)};${createOffsetPath(8, splitOffset)};${createOffsetPath(2, splitOffset)};${createOffsetPath(10, splitOffset)};${createOffsetPath(5, splitOffset)};${createOffsetPath(4, splitOffset)}`}
                  dur="2.5s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.6;0.8;0.4;0.7;0.5;0.6"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </>
            ) : (
              <set attributeName="d" to={createOffsetPath(4, 0)} />
            )}
          </path>

          {/* Line 2 - center main line */}
          <path
            fill="none"
            stroke="hsl(0, 0%, 95%)"
            strokeWidth="2.5"
            strokeOpacity="0.9"
            strokeLinecap="round"
          >
            {!isDrawing ? (
              <>
                <animate
                  attributeName="d"
                  values={`${createOffsetPath(0, 0)};${createOffsetPath(3, 0)};${createOffsetPath(-2, 0)};${createOffsetPath(4, 0)};${createOffsetPath(-1, 0)};${createOffsetPath(0, 0)}`}
                  dur="2s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.9;1;0.7;0.95;0.8;0.9"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </>
            ) : (
              <set attributeName="d" to={path} />
            )}
          </path>

          {/* Line 3 - bottom offset */}
          <path
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
            strokeOpacity={isSplit ? "0.8" : "0.6"}
            strokeLinecap="round"
            style={{ transition: isSplit ? 'none' : 'stroke-opacity 0.3s' }}
          >
            {!isDrawing ? (
              <>
                <animate
                  attributeName="d"
                  values={`${createOffsetPath(-4, -splitOffset)};${createOffsetPath(-9, -splitOffset)};${createOffsetPath(-3, -splitOffset)};${createOffsetPath(-7, -splitOffset)};${createOffsetPath(-5, -splitOffset)};${createOffsetPath(-4, -splitOffset)}`}
                  dur="2.8s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.6;0.7;0.4;0.8;0.5;0.6"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              </>
            ) : (
              <set attributeName="d" to={createOffsetPath(-4, 0)} />
            )}
          </path>

          {/* Line 4 - subtle inner top */}
          <path
            fill="none"
            stroke="hsl(0, 0%, 100%)"
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeLinecap="round"
          >
            {!isDrawing ? (
              <animate
                attributeName="d"
                values={`${createOffsetPath(2, splitOffset * 0.5)};${createOffsetPath(5, splitOffset * 0.5)};${createOffsetPath(0, splitOffset * 0.5)};${createOffsetPath(6, splitOffset * 0.5)};${createOffsetPath(2, splitOffset * 0.5)}`}
                dur="2.2s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
              />
            ) : (
              <set attributeName="d" to={createOffsetPath(2, 0)} />
            )}
          </path>

          {/* Line 5 - subtle inner bottom */}
          <path
            fill="none"
            stroke="hsl(0, 0%, 100%)"
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeLinecap="round"
          >
            {!isDrawing ? (
              <animate
                attributeName="d"
                values={`${createOffsetPath(-2, -splitOffset * 0.5)};${createOffsetPath(-6, -splitOffset * 0.5)};${createOffsetPath(-1, -splitOffset * 0.5)};${createOffsetPath(-5, -splitOffset * 0.5)};${createOffsetPath(-2, -splitOffset * 0.5)}`}
                dur="2.4s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
              />
            ) : (
              <set attributeName="d" to={createOffsetPath(-2, 0)} />
            )}
          </path>
        </>
      )}

      {/* Deleting animation - lines retract to source */}
      {isDeleting && (
        <>
          <path
            d={path}
            fill="none"
            stroke="hsl(0, 0%, 85%)"
            strokeWidth="2"
            strokeOpacity="0.8"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              from={path}
              to={`M ${from.x} ${from.y} C ${from.x} ${from.y}, ${from.x} ${from.y}, ${from.x} ${from.y}`}
              dur="0.4s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
            />
            <animate
              attributeName="stroke-opacity"
              from="0.8"
              to="0"
              dur="0.4s"
              fill="freeze"
            />
          </path>
        </>
      )}

      {/* Split indicator - subtle hint when split */}
      {isSplit && !isDeleting && (
        <text
          x={(from.x + to.x) / 2}
          y={(from.y + to.y) / 2 - 25}
          textAnchor="middle"
          fill="hsl(0, 0%, 60%)"
          fontSize="11"
          fontFamily="system-ui"
          opacity="0.8"
        >
          click to remove
        </text>
      )}
      
      {/* End point - focused power glow effect */}
      {!isDeleting && (
        <g>
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
              values="18;24;20;26;18"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="fill-opacity"
              values="0.15;0.28;0.12;0.22;0.15"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={to.x}
            cy={to.y}
            r="12"
            fill="hsl(0, 0%, 80%)"
            fillOpacity="0.35"
          >
            <animate
              attributeName="r"
              values="10;15;11;14;10"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={to.x}
            cy={to.y}
            r="5"
            fill="hsl(0, 0%, 95%)"
          />
          <circle
            cx={to.x - 1}
            cy={to.y - 1}
            r="2"
            fill="hsl(0, 0%, 100%)"
          />
        </g>
      )}

      {/* Start point - focused power glow effect */}
      {!isDeleting && (
        <g>
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
              values="16;22;18;24;16"
              dur="2.7s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="fill-opacity"
              values="0.12;0.22;0.1;0.2;0.12"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={from.x}
            cy={from.y}
            r="10"
            fill="hsl(0, 0%, 80%)"
            fillOpacity="0.28"
          >
            <animate
              attributeName="r"
              values="8;13;9;12;8"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={from.x}
            cy={from.y}
            r="4"
            fill="hsl(0, 0%, 95%)"
          />
          <circle
            cx={from.x - 0.5}
            cy={from.y - 0.5}
            r="1.5"
            fill="hsl(0, 0%, 100%)"
          />
        </g>
      )}
    </g>
  );
}
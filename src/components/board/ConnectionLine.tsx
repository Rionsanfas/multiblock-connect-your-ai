import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  connectionId?: string;
  isDrawing?: boolean;
}

export function ConnectionLine({ from, to, connectionId, isDrawing }: ConnectionLineProps) {
  const { deleteConnection } = useAppStore();

  // Calculate control points for a smooth curve
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);

  const path = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;

  // Unique ID for gradients
  const gradientId = connectionId ? `gradient-${connectionId}` : 'gradient-drawing';
  const glowId = connectionId ? `glow-${connectionId}` : 'glow-drawing';
  const shadowId = connectionId ? `shadow-${connectionId}` : 'shadow-drawing';

  return (
    <g className={cn("group", !isDrawing && "cursor-pointer")}>
      {/* Definitions for gradients and filters */}
      <defs>
        {/* Main gradient for the line */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(35, 60%, 55%)" />
          <stop offset="50%" stopColor="hsl(40, 70%, 65%)" />
          <stop offset="100%" stopColor="hsl(35, 60%, 55%)" />
        </linearGradient>
        
        {/* Glow filter for 3D effect */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Drop shadow filter */}
        <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(35, 60%, 30%)" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Invisible wider path for easier clicking */}
      {!isDrawing && (
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth="24"
          onClick={() => connectionId && deleteConnection(connectionId)}
        />
      )}

      {/* Outer glow layer - 3D depth */}
      <path
        d={path}
        fill="none"
        stroke={isDrawing ? "hsl(40, 70%, 50%)" : "hsl(35, 60%, 45%)"}
        strokeWidth="8"
        strokeOpacity="0.15"
        strokeLinecap="round"
        className="transition-all duration-300"
        filter={`url(#${glowId})`}
      />

      {/* Middle glow layer */}
      <path
        d={path}
        fill="none"
        stroke={isDrawing ? "hsl(40, 70%, 55%)" : "hsl(35, 60%, 50%)"}
        strokeWidth="5"
        strokeOpacity="0.3"
        strokeLinecap="round"
        className="transition-all duration-300"
      />

      {/* Main visible path with gradient */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeDasharray={isDrawing ? "8 4" : "none"}
        strokeLinecap="round"
        filter={`url(#${shadowId})`}
        className={cn(
          "transition-all duration-300",
          !isDrawing && "group-hover:stroke-[hsl(var(--destructive))]"
        )}
      />

      {/* Inner highlight - creates 3D tube effect */}
      <path
        d={path}
        fill="none"
        stroke="hsl(40, 80%, 80%)"
        strokeWidth="1"
        strokeOpacity="0.6"
        strokeLinecap="round"
        strokeDasharray={isDrawing ? "8 4" : "none"}
        style={{ transform: 'translateY(-1px)' }}
      />
      
      {/* Animated energy particles flowing along the path */}
      {!isDrawing && (
        <>
          {/* Primary energy orb */}
          <circle r="6" fill="hsl(40, 70%, 60%)" filter={`url(#${glowId})`}>
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="3" fill="hsl(40, 90%, 85%)">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
          </circle>
          
          {/* Secondary energy orb */}
          <circle r="5" fill="hsl(35, 60%, 55%)" filter={`url(#${glowId})`}>
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="0.8s" />
          </circle>
          <circle r="2" fill="hsl(40, 90%, 90%)">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="0.8s" />
          </circle>

          {/* Third energy orb */}
          <circle r="4" fill="hsl(35, 50%, 50%)" filter={`url(#${glowId})`}>
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="1.6s" />
          </circle>
          <circle r="1.5" fill="hsl(40, 85%, 85%)">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="1.6s" />
          </circle>
        </>
      )}
      
      {/* End point - 3D orb */}
      <g className={cn(!isDrawing && "group-hover:opacity-80 transition-opacity")}>
        {/* Outer glow */}
        <circle
          cx={to.x}
          cy={to.y}
          r="12"
          fill="hsl(35, 60%, 45%)"
          fillOpacity="0.2"
          filter={`url(#${glowId})`}
        />
        {/* Main orb */}
        <circle
          cx={to.x}
          cy={to.y}
          r="8"
          fill={`url(#${gradientId})`}
          filter={`url(#${shadowId})`}
          className={cn(!isDrawing && "group-hover:fill-[hsl(var(--destructive))]")}
        />
        {/* Inner highlight */}
        <circle
          cx={to.x - 2}
          cy={to.y - 2}
          r="3"
          fill="hsl(40, 90%, 85%)"
          fillOpacity="0.7"
        />
      </g>

      {/* Start point - smaller 3D orb */}
      <g>
        <circle
          cx={from.x}
          cy={from.y}
          r="6"
          fill={`url(#${gradientId})`}
          filter={`url(#${shadowId})`}
        />
        <circle
          cx={from.x - 1}
          cy={from.y - 1}
          r="2"
          fill="hsl(40, 90%, 85%)"
          fillOpacity="0.6"
        />
      </g>
    </g>
  );
}

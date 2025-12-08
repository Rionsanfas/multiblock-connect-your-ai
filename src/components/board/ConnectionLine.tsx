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

  return (
    <g className={cn("group", !isDrawing && "cursor-pointer")}>
      {/* Invisible wider path for easier clicking */}
      {!isDrawing && (
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          onClick={() => connectionId && deleteConnection(connectionId)}
        />
      )}
      
      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={isDrawing ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"}
        strokeWidth="2"
        strokeDasharray={isDrawing ? "8 4" : "none"}
        className={cn(
          "transition-all",
          !isDrawing && "group-hover:stroke-[hsl(var(--destructive))]"
        )}
      />
      
      {/* Animated dots flowing along the path */}
      {!isDrawing && (
        <>
          <circle r="4" fill="hsl(var(--primary))">
            <animateMotion dur="3s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="3" fill="hsl(var(--primary) / 0.5)">
            <animateMotion dur="3s" repeatCount="indefinite" path={path} begin="1s" />
          </circle>
        </>
      )}
      
      {/* Arrow at the end */}
      <circle
        cx={to.x}
        cy={to.y}
        r="6"
        fill="hsl(var(--primary))"
        className={cn(!isDrawing && "group-hover:fill-[hsl(var(--destructive))]")}
      />
    </g>
  );
}

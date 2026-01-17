import { AlertTriangle, Flame } from 'lucide-react';
import { useLtdInventory } from '@/hooks/useLtdInventory';

interface LtdScarcityBadgeProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LtdScarcityBadge({ variant = 'full', className = '' }: LtdScarcityBadgeProps) {
  const { totalSeats, remainingSeats, soldOut, isLoading } = useLtdInventory();
  
  const percentRemaining = (remainingSeats / totalSeats) * 100;
  const isLow = percentRemaining < 30;
  const isCritical = percentRemaining < 15;

  if (variant === 'compact') {
    return (
      <div 
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
          ${soldOut 
            ? 'bg-muted/50 text-muted-foreground' 
            : isCritical 
              ? 'bg-destructive/20 text-destructive animate-pulse' 
              : isLow 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-accent/20 text-accent'
          }
          ${className}
        `}
      >
        {soldOut ? (
          <span>Sold Out</span>
        ) : (
          <>
            <Flame className="h-3 w-3" />
            <span>{remainingSeats} left</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 3D floating container */}
      <div 
        className={`
          relative overflow-hidden rounded-2xl p-[1px]
          ${soldOut 
            ? 'bg-gradient-to-r from-muted/30 to-muted/20' 
            : isCritical
              ? 'bg-gradient-to-r from-destructive/60 via-destructive/40 to-destructive/60 animate-pulse'
              : 'bg-gradient-to-r from-accent/40 via-accent/20 to-accent/40'
          }
        `}
        style={{
          boxShadow: soldOut 
            ? 'none' 
            : isCritical
              ? '0 0 40px -10px hsl(var(--destructive) / 0.5), 0 10px 30px -10px hsl(0 0% 0% / 0.4)'
              : '0 0 40px -10px hsl(var(--accent) / 0.4), 0 10px 30px -10px hsl(0 0% 0% / 0.4)',
          transform: 'perspective(1000px) rotateX(2deg)',
        }}
      >
        {/* Inner content */}
        <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl px-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className={`text-sm font-semibold ${soldOut ? 'text-muted-foreground' : 'text-accent'}`}>
              Limited Lifetime Deals
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden mb-3">
            <div 
              className={`
                absolute inset-y-0 left-0 rounded-full transition-all duration-1000
                ${soldOut 
                  ? 'bg-muted' 
                  : isCritical 
                    ? 'bg-gradient-to-r from-destructive to-destructive/70' 
                    : 'bg-gradient-to-r from-accent to-accent/70'
                }
              `}
              style={{ width: `${100 - percentRemaining}%` }}
            />
            {!soldOut && (
              <div 
                className="absolute inset-y-0 right-0 animate-pulse"
                style={{ 
                  left: `${100 - percentRemaining}%`,
                  background: isCritical 
                    ? 'linear-gradient(90deg, transparent, hsl(var(--destructive) / 0.5))' 
                    : 'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.5))',
                }}
              />
            )}
          </div>

          {/* Count display */}
          <div className="flex items-center justify-center gap-2">
            {soldOut ? (
              <span className="text-muted-foreground font-medium">All seats claimed</span>
            ) : (
              <>
                <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-destructive' : 'text-amber-400'}`} />
                <span className={`font-bold ${isCritical ? 'text-destructive' : 'text-foreground'}`}>
                  {isLoading ? '...' : remainingSeats}
                </span>
                <span className="text-muted-foreground">of</span>
                <span className="text-foreground font-medium">{totalSeats}</span>
                <span className="text-muted-foreground">remaining</span>
              </>
            )}
          </div>

          {/* Urgency message */}
          {!soldOut && isCritical && (
            <p className="text-center text-xs text-destructive mt-2 animate-pulse">
              Almost gone — don't miss out!
            </p>
          )}
        </div>
      </div>

      {/* Ambient glow */}
      {!soldOut && (
        <div 
          className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl pointer-events-none -z-10"
          style={{
            background: isCritical
              ? 'radial-gradient(circle, hsl(var(--destructive) / 0.4), transparent 70%)'
              : 'radial-gradient(circle, hsl(var(--accent) / 0.3), transparent 70%)',
          }}
        />
      )}
    </div>
  );
}

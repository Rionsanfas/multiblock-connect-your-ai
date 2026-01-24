import { Flame } from 'lucide-react';
import { useLtdInventory } from '@/hooks/useLtdInventory';
interface LtdScarcityBadgeProps {
  variant?: 'compact' | 'full';
  className?: string;
}
export function LtdScarcityBadge({
  variant = 'full',
  className = ''
}: LtdScarcityBadgeProps) {
  const {
    totalSeats,
    remainingSeats,
    soldOut,
    isLoading
  } = useLtdInventory();
  const percentRemaining = remainingSeats / totalSeats * 100;
  const isLow = percentRemaining < 30;
  const isCritical = percentRemaining < 15;
  if (variant === 'compact') {
    return <div className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
          ${soldOut ? 'bg-muted/50 text-muted-foreground' : isCritical ? 'bg-destructive/20 text-destructive animate-pulse' : isLow ? 'bg-amber-500/20 text-amber-400' : 'bg-accent/20 text-accent'}
          ${className}
        `}>
        {soldOut ? <span>Sold Out</span> : <>
            <Flame className="h-3 w-3" />
            <span>{remainingSeats} left</span>
          </>}
      </div>;
  }
  return <div className={`relative ${className}`}>
      {/* 3D floating container */}
      <div className={`
          relative overflow-hidden rounded-2xl p-[1px]
          ${soldOut ? 'bg-gradient-to-r from-muted/30 to-muted/20' : isCritical ? 'bg-gradient-to-r from-destructive/60 via-destructive/40 to-destructive/60 animate-pulse' : 'bg-gradient-to-r from-accent/40 via-accent/20 to-accent/40'}
        `} style={{
      boxShadow: soldOut ? 'none' : isCritical ? '0 0 40px -10px hsl(var(--destructive) / 0.5), 0 10px 30px -10px hsl(0 0% 0% / 0.4)' : '0 0 40px -10px hsl(var(--accent) / 0.4), 0 10px 30px -10px hsl(0 0% 0% / 0.4)',
      transform: 'perspective(1000px) rotateX(2deg)'
    }}>
        {/* Inner content */}
        
      </div>

      {/* Ambient glow */}
      {!soldOut && <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl pointer-events-none -z-10" style={{
      background: isCritical ? 'radial-gradient(circle, hsl(var(--destructive) / 0.4), transparent 70%)' : 'radial-gradient(circle, hsl(var(--accent) / 0.3), transparent 70%)'
    }} />}
    </div>;
}
import { useMemo } from 'react';

interface FloatingBlock {
  id: number;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface FloatingBlocksBackgroundProps {
  showLightBeam?: boolean;
}

export function FloatingBlocksBackground({ showLightBeam = false }: FloatingBlocksBackgroundProps) {
  // Generate blocks positioned vertically with decreasing light intensity
  const blocks = useMemo<FloatingBlock[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      size: 80 + Math.random() * 60,
      x: 30 + Math.random() * 40, // Keep blocks centered horizontally
      y: 10 + (i * 11) + Math.random() * 5, // Distribute vertically
      delay: Math.random() * 2,
      duration: 12 + Math.random() * 8,
      opacity: 1 - (i * 0.12), // Decreasing opacity from top to bottom
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Vertical Light Beam - inspired by Huly */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 top-0 transition-all duration-[2500ms] ease-out"
        style={{
          width: showLightBeam ? '2px' : '0px',
          height: showLightBeam ? '70%' : '0%',
          background: 'linear-gradient(180deg, hsl(210 100% 70% / 0.9) 0%, hsl(210 100% 60% / 0.5) 30%, hsl(210 80% 50% / 0.2) 60%, transparent 100%)',
          boxShadow: showLightBeam 
            ? '0 0 60px 20px hsl(210 100% 60% / 0.4), 0 0 120px 40px hsl(210 100% 50% / 0.2), 0 0 200px 60px hsl(210 80% 40% / 0.1)'
            : 'none',
          opacity: showLightBeam ? 1 : 0,
        }}
      />
      
      {/* Light beam glow expanding outward */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 top-0 transition-all duration-[3000ms] ease-out"
        style={{
          width: showLightBeam ? '400px' : '0px',
          height: showLightBeam ? '60%' : '0%',
          background: 'radial-gradient(ellipse 50% 100% at 50% 0%, hsl(210 100% 60% / 0.15) 0%, hsl(210 80% 50% / 0.05) 40%, transparent 70%)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Floating blocks with light beam illumination */}
      {blocks.map((block) => {
        // Calculate light intensity based on Y position (top = bright, bottom = dark)
        const lightIntensity = Math.max(0, 1 - (block.y / 100));
        const glowIntensity = lightIntensity * 0.6;
        
        return (
          <div
            key={block.id}
            className="absolute rounded-2xl animate-floating-block"
            style={{
              width: block.size,
              height: block.size,
              left: `${block.x}%`,
              top: `${block.y}%`,
              background: `linear-gradient(135deg, hsl(210 60% 50% / ${block.opacity * lightIntensity * 0.15}) 0%, hsl(210 40% 40% / ${block.opacity * lightIntensity * 0.08}) 100%)`,
              border: `1px solid hsl(210 60% 60% / ${block.opacity * lightIntensity * 0.2})`,
              filter: `blur(${30 + (1 - lightIntensity) * 20}px)`,
              boxShadow: showLightBeam 
                ? `0 0 ${40 * glowIntensity}px ${15 * glowIntensity}px hsl(210 100% 60% / ${glowIntensity * 0.3}), inset 0 0 ${20 * glowIntensity}px hsl(210 80% 70% / ${glowIntensity * 0.2})`
                : 'none',
              animationDelay: `${block.delay}s`,
              animationDuration: `${block.duration}s`,
              transform: 'translate(-50%, -50%)',
              opacity: showLightBeam ? block.opacity * lightIntensity : 0,
              transition: 'opacity 2s ease-out, box-shadow 2s ease-out',
            }}
          />
        );
      })}
      
      {/* Bottom fade to black */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}

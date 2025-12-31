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
  // Generate blocks positioned around the center for beam interaction
  const blocks = useMemo<FloatingBlock[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      size: 80 + Math.random() * 60,
      x: 40 + Math.random() * 20, // Center-ish position
      y: 20 + (i * 10) + Math.random() * 5,
      delay: Math.random() * 2,
      duration: 14 + Math.random() * 8,
      opacity: Math.max(0.2, 1 - (i * 0.12)),
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* ============================================
          FUTURISTIC CENTERED LIGHT BEAM
          Sci-fi laser beam / vertical glow streak
          ============================================ */}
      
      {/* Core beam - intense bright center */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 transition-all duration-[2000ms] ease-out animate-beam-pulse"
        style={{
          top: '-10%',
          width: showLightBeam ? '4px' : '0px',
          height: showLightBeam ? '70%' : '0%',
          background: 'linear-gradient(180deg, hsl(190 100% 95% / 1) 0%, hsl(200 100% 80% / 0.9) 20%, hsl(200 90% 70% / 0.6) 50%, hsl(210 80% 60% / 0.3) 75%, transparent 100%)',
          boxShadow: showLightBeam 
            ? '0 0 20px 5px hsl(190 100% 80% / 0.8), 0 0 60px 15px hsl(200 100% 70% / 0.5), 0 0 120px 30px hsl(210 90% 60% / 0.3)'
            : 'none',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Secondary glow layer - creates soft halo */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 transition-all duration-[2500ms] ease-out"
        style={{
          top: '-5%',
          width: showLightBeam ? '80px' : '0px',
          height: showLightBeam ? '75%' : '0%',
          background: 'linear-gradient(180deg, hsl(190 100% 90% / 0.6) 0%, hsl(200 100% 75% / 0.3) 25%, hsl(210 80% 65% / 0.15) 50%, transparent 80%)',
          filter: 'blur(20px)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Wide atmospheric glow - foggy spread */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 transition-all duration-[3000ms] ease-out animate-beam-flow"
        style={{
          top: '0%',
          width: showLightBeam ? '300px' : '0px',
          height: showLightBeam ? '80%' : '0%',
          background: 'radial-gradient(ellipse 100% 60% at 50% 20%, hsl(200 100% 80% / 0.15) 0%, hsl(210 90% 70% / 0.08) 40%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Conic spread - beam widening effect */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 transition-all duration-[2500ms] ease-out"
        style={{
          top: 0,
          width: showLightBeam ? '500px' : '0px',
          height: showLightBeam ? '100%' : '0%',
          background: 'conic-gradient(from 180deg at 50% 0%, transparent 42%, hsl(200 100% 80% / 0.08) 48%, hsl(190 100% 85% / 0.12) 50%, hsl(200 100% 80% / 0.08) 52%, transparent 58%)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Floating blocks illuminated by beam */}
      {blocks.map((block) => {
        // Calculate intensity based on distance from center (beam position)
        const distanceFromCenter = Math.abs(block.x - 50);
        const horizontalIntensity = Math.max(0, 1 - (distanceFromCenter / 20));
        const verticalIntensity = Math.max(0.1, 1 - (block.y / 100));
        const combinedIntensity = horizontalIntensity * verticalIntensity;
        
        return (
          <div
            key={block.id}
            className="absolute rounded-2xl animate-floating-block"
            style={{
              width: block.size,
              height: block.size,
              left: `${block.x}%`,
              top: `${block.y}%`,
              // Cyan-tinted gradient matching beam
              background: `linear-gradient(135deg, hsl(200 80% 90% / ${block.opacity * combinedIntensity * 0.15}) 0%, hsl(210 70% 80% / ${block.opacity * combinedIntensity * 0.08}) 100%)`,
              border: `1px solid hsl(200 90% 85% / ${block.opacity * combinedIntensity * 0.2})`,
              filter: `blur(${20 + (1 - verticalIntensity) * 30}px)`,
              // Glow effect from beam illumination
              boxShadow: showLightBeam && combinedIntensity > 0.3
                ? `
                  0 0 ${30 * combinedIntensity}px hsl(200 100% 80% / ${combinedIntensity * 0.3}),
                  0 0 ${60 * combinedIntensity}px hsl(210 90% 70% / ${combinedIntensity * 0.2}),
                  inset 0 0 ${20 * combinedIntensity}px hsl(190 100% 90% / ${combinedIntensity * 0.15})
                `
                : 'none',
              animationDelay: `${block.delay}s`,
              animationDuration: `${block.duration}s`,
              transform: 'translate(-50%, -50%)',
              opacity: showLightBeam ? block.opacity * (0.3 + combinedIntensity * 0.7) : 0,
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
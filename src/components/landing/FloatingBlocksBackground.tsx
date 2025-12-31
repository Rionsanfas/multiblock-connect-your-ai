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
  // Generate blocks positioned on the right side for waterfall interaction
  const blocks = useMemo<FloatingBlock[]>(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: 100 + Math.random() * 80,
      x: 55 + Math.random() * 25, // Position on the right side
      y: 15 + (i * 14) + Math.random() * 5,
      delay: Math.random() * 2,
      duration: 14 + Math.random() * 8,
      opacity: Math.max(0.15, 1 - (i * 0.15)),
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Waterfall Light Effect - Right Side Only */}
      {/* Main waterfall beam */}
      <div 
        className="absolute transition-all duration-[2000ms] ease-out"
        style={{
          right: '15%',
          top: '-5%',
          width: showLightBeam ? '3px' : '0px',
          height: showLightBeam ? '85%' : '0%',
          background: 'linear-gradient(180deg, hsl(0 0% 100% / 1) 0%, hsl(0 0% 100% / 0.8) 15%, hsl(0 0% 95% / 0.5) 40%, hsl(0 0% 90% / 0.2) 70%, transparent 100%)',
          boxShadow: showLightBeam 
            ? '0 0 80px 25px hsl(0 0% 100% / 0.5), 0 0 150px 50px hsl(0 0% 100% / 0.3), 0 0 250px 80px hsl(0 0% 100% / 0.15)'
            : 'none',
          opacity: showLightBeam ? 1 : 0,
        }}
      />
      
      {/* Waterfall glow cone spreading downward */}
      <div 
        className="absolute transition-all duration-[2500ms] ease-out"
        style={{
          right: '10%',
          top: 0,
          width: showLightBeam ? '350px' : '0px',
          height: showLightBeam ? '100%' : '0%',
          background: 'conic-gradient(from 180deg at 50% 0%, transparent 40%, hsl(0 0% 100% / 0.08) 48%, hsl(0 0% 100% / 0.12) 50%, hsl(0 0% 100% / 0.08) 52%, transparent 60%)',
          opacity: showLightBeam ? 1 : 0,
          transform: 'translateX(50%)',
        }}
      />

      {/* Secondary ambient glow */}
      <div 
        className="absolute transition-all duration-[3000ms] ease-out"
        style={{
          right: '5%',
          top: '5%',
          width: showLightBeam ? '500px' : '0px',
          height: showLightBeam ? '70%' : '0%',
          background: 'radial-gradient(ellipse 60% 100% at 70% 0%, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.03) 40%, transparent 70%)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Floating blocks that interact with waterfall */}
      {blocks.map((block) => {
        // Calculate light intensity - blocks higher up get more light
        const verticalIntensity = Math.max(0.1, 1 - (block.y / 100));
        // Blocks closer to the right get more light from the waterfall
        const horizontalIntensity = Math.max(0, (block.x - 50) / 50);
        const combinedIntensity = verticalIntensity * horizontalIntensity;
        
        // Create the "water hitting rock" glow effect
        const isInWaterfallPath = block.x > 55 && block.x < 90;
        const glowMultiplier = isInWaterfallPath ? 1.5 : 0.5;
        
        return (
          <div
            key={block.id}
            className="absolute rounded-2xl animate-floating-block"
            style={{
              width: block.size,
              height: block.size,
              left: `${block.x}%`,
              top: `${block.y}%`,
              // White/neutral gradient for blocks
              background: `linear-gradient(135deg, hsl(0 0% 100% / ${block.opacity * combinedIntensity * 0.12}) 0%, hsl(0 0% 80% / ${block.opacity * combinedIntensity * 0.06}) 100%)`,
              border: `1px solid hsl(0 0% 100% / ${block.opacity * combinedIntensity * 0.15})`,
              filter: `blur(${25 + (1 - verticalIntensity) * 25}px)`,
              // Glowing edge effect where "water hits"
              boxShadow: showLightBeam && isInWaterfallPath
                ? `
                  0 -${15 * combinedIntensity * glowMultiplier}px ${40 * combinedIntensity}px hsl(0 0% 100% / ${combinedIntensity * 0.4}),
                  ${-20 * combinedIntensity}px 0 ${30 * combinedIntensity}px hsl(0 0% 100% / ${combinedIntensity * 0.2}),
                  ${20 * combinedIntensity}px 0 ${30 * combinedIntensity}px hsl(0 0% 100% / ${combinedIntensity * 0.2}),
                  inset 0 ${10 * combinedIntensity}px ${20 * combinedIntensity}px hsl(0 0% 100% / ${combinedIntensity * 0.15})
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

      {/* Light splash effect at block edges - simulates water cascading */}
      {showLightBeam && blocks.slice(0, 4).map((block) => {
        const intensity = Math.max(0, 1 - (block.y / 80));
        const isInPath = block.x > 55 && block.x < 90;
        if (!isInPath || intensity < 0.3) return null;
        
        return (
          <div
            key={`splash-${block.id}`}
            className="absolute transition-all duration-[2000ms]"
            style={{
              left: `${block.x}%`,
              top: `${block.y}%`,
              width: block.size * 1.5,
              height: block.size * 0.4,
              background: `radial-gradient(ellipse 100% 50% at 50% 0%, hsl(0 0% 100% / ${intensity * 0.25}) 0%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(15px)',
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
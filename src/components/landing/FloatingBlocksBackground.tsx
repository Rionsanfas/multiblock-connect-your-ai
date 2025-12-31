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
  // Generate blocks positioned on the right side
  const blocks = useMemo<FloatingBlock[]>(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      size: 100 + Math.random() * 40,
      x: 70 + Math.random() * 15,
      y: 25 + (i * 14) + Math.random() * 5,
      delay: Math.random() * 2,
      duration: 16 + Math.random() * 8,
      opacity: Math.max(0.3, 1 - (i * 0.15)),
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* ============================================
          GRID DOTS PATTERN
          ============================================ */}
      <div 
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{
          backgroundImage: `radial-gradient(circle at center, hsl(0 0% 50%) 0.8px, transparent 0.8px)`,
          backgroundSize: '20px 20px',
          opacity: showLightBeam ? 0.35 : 0,
        }}
      />

      {/* ============================================
          SOFT CINEMATIC AMBIENT LIGHTS (B&W)
          4K quality gradient orbs
          ============================================ */}
      
      {/* Large soft ambient light - top left */}
      <div 
        className="absolute transition-opacity duration-[2000ms]"
        style={{
          top: '-20%',
          left: '-10%',
          width: '70%',
          height: '70%',
          background: 'radial-gradient(ellipse at center, hsl(0 0% 25% / 0.4) 0%, hsl(0 0% 15% / 0.2) 30%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: showLightBeam ? 0.8 : 0,
        }}
      />

      {/* Soft glow - top center */}
      <div 
        className="absolute transition-opacity duration-[2500ms]"
        style={{
          top: '-15%',
          left: '30%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(ellipse at center, hsl(0 0% 100% / 0.06) 0%, hsl(0 0% 90% / 0.03) 40%, transparent 70%)',
          filter: 'blur(60px)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Subtle gray accent - right side */}
      <div 
        className="absolute transition-opacity duration-[3000ms]"
        style={{
          top: '10%',
          right: '-5%',
          width: '45%',
          height: '60%',
          background: 'radial-gradient(ellipse at center, hsl(0 0% 30% / 0.15) 0%, hsl(0 0% 20% / 0.08) 40%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: showLightBeam ? 0.7 : 0,
        }}
      />

      {/* Cool gray accent - bottom left */}
      <div 
        className="absolute transition-opacity duration-[2800ms]"
        style={{
          bottom: '5%',
          left: '5%',
          width: '40%',
          height: '45%',
          background: 'radial-gradient(ellipse at center, hsl(0 0% 25% / 0.2) 0%, hsl(0 0% 15% / 0.1) 40%, transparent 70%)',
          filter: 'blur(90px)',
          opacity: showLightBeam ? 0.6 : 0,
        }}
      />

      {/* Soft highlight - center right for hero blocks area */}
      <div 
        className="absolute transition-opacity duration-[2200ms]"
        style={{
          top: '20%',
          right: '10%',
          width: '35%',
          height: '50%',
          background: 'radial-gradient(ellipse at center, hsl(0 0% 100% / 0.04) 0%, hsl(0 0% 95% / 0.02) 50%, transparent 70%)',
          filter: 'blur(50px)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Subtle vignette enhancement at top */}
      <div 
        className="absolute top-0 left-0 right-0 transition-opacity duration-[2000ms]"
        style={{
          height: '40%',
          background: 'linear-gradient(180deg, hsl(0 0% 8% / 0.3) 0%, transparent 100%)',
          opacity: showLightBeam ? 0.5 : 0,
        }}
      />

      {/* AI Blocks - subtle floating effect */}
      {blocks.map((block) => (
        <div
          key={block.id}
          className="absolute rounded-2xl animate-floating-block"
          style={{
            width: block.size,
            height: block.size,
            left: `${block.x}%`,
            top: `${block.y}%`,
            background: `linear-gradient(145deg, 
              hsl(0 0% 18% / 0.6) 0%, 
              hsl(0 0% 12% / 0.7) 50%,
              hsl(0 0% 8% / 0.8) 100%)`,
            border: '1px solid hsl(0 0% 30% / 0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px -8px hsl(0 0% 0% / 0.5), inset 0 1px 0 0 hsl(0 0% 100% / 0.05)',
            animationDelay: `${block.delay}s`,
            animationDuration: `${block.duration}s`,
            transform: 'translate(-50%, -50%)',
            opacity: showLightBeam ? block.opacity : 0,
            transition: 'opacity 1.5s ease-out',
          }}
        >
          {/* Inner content hint */}
          <div 
            className="absolute inset-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.02) 0%, transparent 50%)',
              border: '1px solid hsl(0 0% 100% / 0.03)',
            }}
          />
        </div>
      ))}
      
      {/* Bottom fade to background */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}

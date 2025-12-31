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
          Ultra-smooth gradients with high blur
          ============================================ */}
      
      {/* Primary soft ambient light - top left - ultra smooth */}
      <div 
        className="absolute transition-opacity duration-[2500ms]"
        style={{
          top: '-25%',
          left: '-15%',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(ellipse 70% 60% at center, hsl(0 0% 30% / 0.35) 0%, hsl(0 0% 20% / 0.15) 35%, hsl(0 0% 15% / 0.05) 60%, transparent 80%)',
          filter: 'blur(120px)',
          opacity: showLightBeam ? 0.9 : 0,
        }}
      />

      {/* Soft center glow - very diffused */}
      <div 
        className="absolute transition-opacity duration-[3000ms]"
        style={{
          top: '-10%',
          left: '25%',
          width: '55%',
          height: '55%',
          background: 'radial-gradient(ellipse 80% 70% at center, hsl(0 0% 100% / 0.08) 0%, hsl(0 0% 90% / 0.04) 30%, hsl(0 0% 80% / 0.02) 50%, transparent 75%)',
          filter: 'blur(100px)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Flowing light accent - right side - super smooth */}
      <div 
        className="absolute transition-opacity duration-[3500ms]"
        style={{
          top: '5%',
          right: '-10%',
          width: '55%',
          height: '70%',
          background: 'radial-gradient(ellipse 60% 80% at 70% 40%, hsl(0 0% 35% / 0.12) 0%, hsl(0 0% 25% / 0.06) 40%, hsl(0 0% 20% / 0.02) 60%, transparent 80%)',
          filter: 'blur(140px)',
          opacity: showLightBeam ? 0.8 : 0,
        }}
      />

      {/* Soft bottom left accent - ultra diffused */}
      <div 
        className="absolute transition-opacity duration-[3200ms]"
        style={{
          bottom: '0%',
          left: '0%',
          width: '50%',
          height: '55%',
          background: 'radial-gradient(ellipse 70% 60% at 30% 70%, hsl(0 0% 28% / 0.18) 0%, hsl(0 0% 18% / 0.08) 40%, hsl(0 0% 12% / 0.03) 65%, transparent 85%)',
          filter: 'blur(130px)',
          opacity: showLightBeam ? 0.7 : 0,
        }}
      />

      {/* Hero blocks area highlight - subtle and smooth */}
      <div 
        className="absolute transition-opacity duration-[2800ms]"
        style={{
          top: '15%',
          right: '5%',
          width: '40%',
          height: '55%',
          background: 'radial-gradient(ellipse 60% 70% at center, hsl(0 0% 100% / 0.05) 0%, hsl(0 0% 95% / 0.025) 40%, hsl(0 0% 90% / 0.01) 60%, transparent 80%)',
          filter: 'blur(80px)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />

      {/* Subtle vignette enhancement at top */}
      <div 
        className="absolute top-0 left-0 right-0 transition-opacity duration-[2000ms]"
        style={{
          height: '45%',
          background: 'linear-gradient(180deg, hsl(0 0% 8% / 0.25) 0%, hsl(0 0% 8% / 0.1) 50%, transparent 100%)',
          opacity: showLightBeam ? 0.6 : 0,
        }}
      />

      {/* ============================================
          GRAINY TEXTURE OVERLAY
          Subtle film grain effect ~20% visible
          ============================================ */}
      <div 
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: showLightBeam ? 0.18 : 0,
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Secondary grain layer for depth */}
      <div 
        className="absolute inset-0 transition-opacity duration-[2500ms]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2)'/%3E%3C/svg%3E")`,
          opacity: showLightBeam ? 0.08 : 0,
          mixBlendMode: 'soft-light',
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
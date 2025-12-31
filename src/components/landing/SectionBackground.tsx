/**
 * SectionBackground - Reusable grid and noise background for sections
 * Intensity levels: 'subtle' | 'normal' | 'strong'
 */

interface SectionBackgroundProps {
  intensity?: 'subtle' | 'normal' | 'strong';
  showAmbientLights?: boolean;
}

export function SectionBackground({ 
  intensity = 'normal',
  showAmbientLights = true 
}: SectionBackgroundProps) {
  const opacityScale = {
    subtle: { grid: 0.15, grain: 0.08, lights: 0.4 },
    normal: { grid: 0.25, grain: 0.12, lights: 0.6 },
    strong: { grid: 0.4, grain: 0.18, lights: 0.85 },
  };

  const { grid, grain, lights } = opacityScale[intensity];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Grid dots pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at center, hsl(0 0% 50%) 0.8px, transparent 0.8px)`,
          backgroundSize: '20px 20px',
          opacity: grid,
        }}
      />

      {/* Ambient lights */}
      {showAmbientLights && (
        <>
          {/* Top left glow */}
          <div 
            className="absolute"
            style={{
              top: '-20%',
              left: '-10%',
              width: '60%',
              height: '60%',
              background: 'radial-gradient(ellipse 70% 60% at center, hsl(0 0% 30% / 0.25) 0%, hsl(0 0% 20% / 0.1) 40%, transparent 70%)',
              filter: 'blur(100px)',
              opacity: lights,
            }}
          />

          {/* Center subtle glow */}
          <div 
            className="absolute"
            style={{
              top: '20%',
              left: '30%',
              width: '40%',
              height: '40%',
              background: 'radial-gradient(ellipse at center, hsl(0 0% 100% / 0.04) 0%, transparent 60%)',
              filter: 'blur(80px)',
              opacity: lights,
            }}
          />

          {/* Bottom right accent */}
          <div 
            className="absolute"
            style={{
              bottom: '-10%',
              right: '-5%',
              width: '50%',
              height: '50%',
              background: 'radial-gradient(ellipse 60% 70% at center, hsl(0 0% 25% / 0.15) 0%, transparent 65%)',
              filter: 'blur(120px)',
              opacity: lights,
            }}
          />
        </>
      )}

      {/* Grain texture overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: grain,
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Secondary grain for depth */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2)'/%3E%3C/svg%3E")`,
          opacity: grain * 0.5,
          mixBlendMode: 'soft-light',
        }}
      />
    </div>
  );
}

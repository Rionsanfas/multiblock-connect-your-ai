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
  // Generate blocks positioned on the right side for laser interaction
  const blocks = useMemo<FloatingBlock[]>(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      size: 100 + Math.random() * 40,
      x: 70 + Math.random() * 15, // Right side positioning
      y: 25 + (i * 14) + Math.random() * 5,
      delay: Math.random() * 2,
      duration: 16 + Math.random() * 8,
      opacity: Math.max(0.3, 1 - (i * 0.15)),
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* ============================================
          RIGHT SIDE LASER BEAM SYSTEM
          Reactive laser that flows around AI blocks
          ============================================ */}
      
      {/* Main laser generator source - top right */}
      <div 
        className="absolute transition-all duration-1000 ease-out"
        style={{
          top: '-5%',
          right: '18%',
          width: showLightBeam ? '6px' : '0px',
          height: showLightBeam ? '25%' : '0%',
          background: 'linear-gradient(180deg, hsl(0 0% 100% / 1) 0%, hsl(0 0% 95% / 0.9) 30%, hsl(0 0% 80% / 0.7) 60%, hsl(0 0% 70% / 0.4) 100%)',
          boxShadow: showLightBeam 
            ? '0 0 15px 3px hsl(0 0% 100% / 0.9), 0 0 40px 10px hsl(0 0% 90% / 0.6), 0 0 80px 20px hsl(0 0% 80% / 0.3)'
            : 'none',
          opacity: showLightBeam ? 1 : 0,
          animation: showLightBeam ? 'beam-pulse 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Laser charging glow at source */}
      <div 
        className="absolute transition-all duration-1500 ease-out"
        style={{
          top: '-2%',
          right: '16%',
          width: showLightBeam ? '60px' : '0px',
          height: showLightBeam ? '60px' : '0%',
          background: 'radial-gradient(circle, hsl(0 0% 100% / 0.8) 0%, hsl(0 0% 90% / 0.4) 30%, transparent 70%)',
          filter: 'blur(10px)',
          opacity: showLightBeam ? 1 : 0,
          animation: showLightBeam ? 'beam-pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />

      {/* Water-like flowing laser stream - splits around blocks */}
      <svg 
        className="absolute top-0 right-0 w-1/2 h-full transition-opacity duration-1000"
        style={{ opacity: showLightBeam ? 1 : 0 }}
        viewBox="0 0 400 800"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Laser gradient - white/gray */}
          <linearGradient id="laserGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" stopOpacity="1" />
            <stop offset="30%" stopColor="hsl(0, 0%, 95%)" stopOpacity="0.9" />
            <stop offset="60%" stopColor="hsl(0, 0%, 85%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(0, 0%, 75%)" stopOpacity="0.2" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="laserGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense glow for core */}
          <filter id="laserGlowIntense" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main laser beam path - flows around blocks */}
        <path
          d="M 180 0 
             L 180 120 
             C 180 140, 120 140, 100 160 
             L 80 200 
             C 60 220, 60 260, 80 280 
             L 120 320 
             C 160 360, 200 380, 200 420 
             L 200 480 
             C 200 520, 140 540, 120 580 
             L 100 640 
             C 80 700, 120 750, 180 800"
          fill="none"
          stroke="url(#laserGradient)"
          strokeWidth="3"
          filter="url(#laserGlow)"
          style={{
            strokeDasharray: '800',
            strokeDashoffset: showLightBeam ? '0' : '800',
            transition: 'stroke-dashoffset 2s ease-out',
          }}
        >
          <animate 
            attributeName="stroke-dashoffset" 
            values="0;-50;0" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </path>

        {/* Secondary beam - parallel flow */}
        <path
          d="M 200 0 
             L 200 100 
             C 200 130, 280 150, 300 180 
             L 320 240 
             C 340 280, 320 320, 280 360 
             L 240 400 
             C 200 440, 180 500, 200 560 
             L 220 620 
             C 240 680, 280 740, 200 800"
          fill="none"
          stroke="url(#laserGradient)"
          strokeWidth="2"
          filter="url(#laserGlow)"
          strokeOpacity="0.6"
          style={{
            strokeDasharray: '900',
            strokeDashoffset: showLightBeam ? '0' : '900',
            transition: 'stroke-dashoffset 2.5s ease-out',
          }}
        >
          <animate 
            attributeName="stroke-dashoffset" 
            values="0;-80;0" 
            dur="4s" 
            repeatCount="indefinite"
          />
        </path>

        {/* Core intense beam */}
        <path
          d="M 180 0 L 180 120"
          fill="none"
          stroke="hsl(0, 0%, 100%)"
          strokeWidth="4"
          filter="url(#laserGlowIntense)"
          strokeLinecap="round"
        >
          <animate 
            attributeName="opacity" 
            values="1;0.7;1" 
            dur="1.5s" 
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {/* AI Blocks with laser interaction glow */}
      {blocks.map((block, index) => {
        const isInLaserPath = block.y > 20 && block.y < 90;
        const laserIntensity = isInLaserPath ? Math.max(0.3, 1 - Math.abs(block.y - 50) / 50) : 0;
        
        return (
          <div
            key={block.id}
            className="absolute rounded-2xl animate-floating-block"
            style={{
              width: block.size,
              height: block.size,
              left: `${block.x}%`,
              top: `${block.y}%`,
              background: `linear-gradient(145deg, 
                hsl(0 0% 20% / ${0.6 + laserIntensity * 0.2}) 0%, 
                hsl(0 0% 12% / ${0.7 + laserIntensity * 0.15}) 50%,
                hsl(0 0% 8% / 0.8) 100%)`,
              border: `1px solid hsl(0 0% ${40 + laserIntensity * 40}% / ${0.2 + laserIntensity * 0.4})`,
              backdropFilter: 'blur(10px)',
              // Laser surface glow - light reacting with block surface
              boxShadow: showLightBeam && laserIntensity > 0.2
                ? `
                  0 -${10 + laserIntensity * 15}px ${20 + laserIntensity * 30}px -5px hsl(0 0% 100% / ${laserIntensity * 0.5}),
                  -${5 + laserIntensity * 10}px 0 ${15 + laserIntensity * 20}px -5px hsl(0 0% 95% / ${laserIntensity * 0.3}),
                  ${5 + laserIntensity * 10}px 0 ${15 + laserIntensity * 20}px -5px hsl(0 0% 95% / ${laserIntensity * 0.3}),
                  inset 0 1px 0 0 hsl(0 0% 100% / ${laserIntensity * 0.2}),
                  0 ${15 + laserIntensity * 20}px ${30 + laserIntensity * 40}px -10px hsl(0 0% 80% / ${laserIntensity * 0.4})
                `
                : `0 8px 32px -8px hsl(0 0% 0% / 0.5), inset 0 1px 0 0 hsl(0 0% 100% / 0.05)`,
              animationDelay: `${block.delay}s`,
              animationDuration: `${block.duration}s`,
              transform: 'translate(-50%, -50%)',
              opacity: showLightBeam ? block.opacity : 0,
              transition: 'opacity 1.5s ease-out, box-shadow 0.5s ease-out',
            }}
          >
            {/* Inner content hint */}
            <div 
              className="absolute inset-3 rounded-xl"
              style={{
                background: `linear-gradient(135deg, hsl(0 0% 100% / ${0.02 + laserIntensity * 0.05}) 0%, transparent 50%)`,
                border: `1px solid hsl(0 0% 100% / ${0.03 + laserIntensity * 0.08})`,
              }}
            />
          </div>
        );
      })}

      {/* Ambient laser glow on right side */}
      <div 
        className="absolute top-0 right-0 w-1/3 h-full transition-opacity duration-2000"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 100% 30%, hsl(0 0% 100% / 0.06) 0%, hsl(0 0% 90% / 0.03) 30%, transparent 60%)',
          opacity: showLightBeam ? 1 : 0,
        }}
      />
      
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

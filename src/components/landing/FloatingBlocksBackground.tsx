// This component has been replaced by HeroHandsAnimation
// Keeping minimal version for backwards compatibility

interface FloatingBlocksBackgroundProps {
  showLightBeam?: boolean;
}

export function FloatingBlocksBackground({ showLightBeam = false }: FloatingBlocksBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Subtle ambient background glow */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, hsl(0 0% 15% / 0.2) 0%, transparent 70%)',
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

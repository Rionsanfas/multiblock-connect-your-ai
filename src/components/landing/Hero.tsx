import { Link } from "react-router-dom";
import { HeroBlocks } from "./HeroBlocks";
import { FloatingBlocksBackground } from "./FloatingBlocksBackground";
import { useState, useEffect } from "react";

const Hero = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 200);
    const timer2 = setTimeout(() => setPhase(2), 1400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const mainStyle = {
    opacity: phase >= 1 ? 1 : 0,
    transform: phase >= 1 ? 'translateY(0)' : 'translateY(50px)',
    transition: 'opacity 1.8s cubic-bezier(0.16, 1, 0.3, 1), transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const visualStyle = {
    opacity: phase >= 1 ? 1 : 0,
    transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
    transition: 'opacity 2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
  };

  const buttonsStyle = {
    opacity: phase >= 2 ? 1 : 0,
    transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-background dot-grid-bg pt-20 pb-8 sm:pt-24 md:pt-28 lg:pt-32 sm:pb-12 md:pb-16">
      {/* Pure black background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Floating Blocks Background with Centered Light Beam */}
      <FloatingBlocksBackground showLightBeam={phase >= 1} />
      
      {/* Container */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero grid - stacks on mobile/tablet, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] items-center gap-8 lg:gap-10">
          {/* Left: Text Content - Always on top on mobile */}
          <div className="text-center lg:text-left order-1 lg:order-1 relative z-20">
            {/* Headline with shadow effect */}
            <h1 
              className="font-bold leading-tight text-wrap-balance text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl mb-4 sm:mb-5"
              style={mainStyle}
            >
              <span 
                className="block"
                style={{
                  color: 'hsl(0 0% 100%)',
                  textShadow: '0 2px 20px hsl(0 0% 100% / 0.35), 0 4px 40px hsl(0 0% 100% / 0.25), 0 8px 80px hsl(0 0% 100% / 0.15), 0 0 120px hsl(0 0% 100% / 0.1)',
                }}
              >
                One Workspace.
              </span>
              <span 
                className="block"
                style={{
                  background: 'linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 65%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 2px 15px hsl(0 0% 100% / 0.3)) drop-shadow(0 4px 30px hsl(0 0% 100% / 0.2)) drop-shadow(0 8px 50px hsl(0 0% 100% / 0.1))',
                }}
              >
                Every AI Model.
              </span>
            </h1>

            {/* Sub-headline */}
            <p 
              className="text-muted-foreground max-w-lg mx-auto lg:mx-0 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10"
              style={{ 
                lineHeight: 1.7,
                ...mainStyle,
              }}
            >
              Create blocks for different AI models, chat with them, and connect outputs 
              to automate your workflows. Your keys, your control.
            </p>

            {/* CTA Button */}
            <div 
              className="flex items-center justify-center lg:justify-start"
              style={buttonsStyle}
            >
              <Link 
                to="/auth" 
                className="group relative inline-flex items-center justify-center overflow-hidden px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-medium rounded-full"
                style={{
                  letterSpacing: '0.02em',
                  background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.04) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid hsl(0 0% 100% / 0.15)',
                  boxShadow: `
                    inset 0 1px 0 hsl(0 0% 100% / 0.15),
                    inset 0 -1px 0 hsl(0 0% 0% / 0.1),
                    0 4px 20px hsl(0 0% 0% / 0.3),
                    0 8px 40px hsl(0 0% 0% / 0.2)
                  `,
                  color: 'hsl(0 0% 92%)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, hsl(0 0% 100% / 0.15) 0%, hsl(0 0% 100% / 0.06) 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.04) 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Animated edge shine */}
                <span 
                  className="absolute inset-0 rounded-full animate-edge-shine"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, transparent 40%, hsl(0 0% 100% / 0.4) 50%, transparent 60%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'xor',
                    WebkitMaskComposite: 'xor',
                    padding: '1px',
                    pointerEvents: 'none',
                  }}
                />
                
                {/* Top gloss */}
                <span 
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.08) 0%, transparent 50%)',
                  }}
                />
                
                <span className="relative z-10">Get Access</span>
              </Link>
            </div>
          </div>

          {/* Right: Connected Blocks Visual - Visible on all screens, scaled appropriately */}
          <div 
            className="flex order-2 lg:order-2 items-center justify-center min-h-[320px] sm:min-h-[360px] md:min-h-[400px] lg:min-h-[450px] max-h-[55vh] sm:max-h-[50vh] lg:max-h-[60vh] relative z-10 w-full overflow-hidden"
            style={visualStyle}
          >
            <HeroBlocks />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
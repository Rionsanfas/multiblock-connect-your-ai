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
    <section className="relative min-h-screen overflow-hidden bg-background" style={{ paddingTop: "clamp(80px, 12vw, 128px)", paddingBottom: "clamp(48px, 6vw, 80px)" }}>
      {/* Pure black background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Floating Blocks Background with Waterfall Light */}
      <FloatingBlocksBackground showLightBeam={phase >= 1} />
      
      {/* Container */}
      <div 
        className="relative z-10 w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Hero grid - adjusted for larger left, smaller right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] items-center" style={{ gap: "clamp(24px, 4vw, 48px)" }}>
          {/* Left: Text Content - Bigger */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Headline with shadow effect like reference image */}
            <h1 
              className="font-bold leading-tight text-wrap-balance"
              style={{ 
                fontSize: "clamp(2.25rem, 1.5rem + 5vw, 5.5rem)",
                marginBottom: "clamp(16px, 2vw, 24px)",
                ...mainStyle,
              }}
            >
              <span 
                className="block"
                style={{
                  color: 'hsl(0 0% 100%)',
                  textShadow: '0 4px 30px hsl(0 0% 100% / 0.15), 0 8px 60px hsl(210 100% 70% / 0.1)',
                }}
              >
                One Workspace.
              </span>
              <span 
                className="block"
                style={{
                  background: 'linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 70%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 4px 20px hsl(210 100% 60% / 0.2))',
                }}
              >
                Every AI Model.
              </span>
            </h1>

            {/* Sub-headline */}
            <p 
              className="text-muted-foreground max-w-xl mx-auto lg:mx-0 text-break"
              style={{ 
                fontSize: "clamp(1rem, 0.85rem + 0.6vw, 1.35rem)",
                marginBottom: "clamp(28px, 4vw, 48px)",
                lineHeight: 1.7,
                ...mainStyle,
              }}
            >
              Create blocks for different AI models, chat with them, and connect outputs 
              to automate your workflows. Your keys, your control.
            </p>

            {/* Single CTA Button - Glassmorphism 3D style */}
            <div 
              className="flex items-center justify-center lg:justify-start"
              style={buttonsStyle}
            >
              <Link 
                to="/auth" 
                className="group relative inline-flex items-center justify-center overflow-hidden"
                style={{
                  padding: '16px 40px',
                  fontSize: 'clamp(0.95rem, 0.9rem + 0.3vw, 1.1rem)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  borderRadius: '50px',
                  // Glassmorphism background
                  background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.12) 0%, hsl(0 0% 100% / 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  // Subtle border with gradient
                  border: '1px solid hsl(0 0% 100% / 0.2)',
                  // 3D shadow effect
                  boxShadow: `
                    inset 0 1px 0 hsl(0 0% 100% / 0.2),
                    inset 0 -1px 0 hsl(0 0% 0% / 0.1),
                    0 4px 20px hsl(0 0% 0% / 0.3),
                    0 8px 40px hsl(0 0% 0% / 0.2)
                  `,
                  color: 'hsl(0 0% 95%)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, hsl(0 0% 100% / 0.18) 0%, hsl(0 0% 100% / 0.08) 100%)';
                  e.currentTarget.style.boxShadow = `
                    inset 0 1px 0 hsl(0 0% 100% / 0.25),
                    inset 0 -1px 0 hsl(0 0% 0% / 0.1),
                    0 6px 30px hsl(0 0% 0% / 0.35),
                    0 12px 50px hsl(0 0% 0% / 0.25),
                    0 0 40px hsl(0 0% 100% / 0.1)
                  `;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, hsl(0 0% 100% / 0.12) 0%, hsl(0 0% 100% / 0.05) 100%)';
                  e.currentTarget.style.boxShadow = `
                    inset 0 1px 0 hsl(0 0% 100% / 0.2),
                    inset 0 -1px 0 hsl(0 0% 0% / 0.1),
                    0 4px 20px hsl(0 0% 0% / 0.3),
                    0 8px 40px hsl(0 0% 0% / 0.2)
                  `;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Inner highlight */}
                <span 
                  className="absolute inset-0 rounded-[50px]"
                  style={{
                    background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.1) 0%, transparent 50%)',
                    pointerEvents: 'none',
                  }}
                />
                <span className="relative z-10">Get Access</span>
              </Link>
            </div>
          </div>

          {/* Right: Connected Blocks Visual - Smaller */}
          <div 
            className="order-1 lg:order-2 flex items-center justify-center"
            style={{ 
              minHeight: "clamp(200px, 30vw, 450px)",
              maxHeight: "60vh",
              ...visualStyle,
            }}
          >
            <HeroBlocks />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
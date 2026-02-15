import { Link } from "react-router-dom";
import { HeroBlocks } from "./HeroBlocks";
import { FloatingBlocksBackground } from "./FloatingBlocksBackground";
import { useState, useEffect, useRef } from "react";

const Hero = () => {
  // Detect mobile to skip animations entirely
  const isMobile = useRef(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const [phase, setPhase] = useState(isMobile.current ? 2 : 0);

  useEffect(() => {
    if (isMobile.current) return; // no timers on mobile
    const timer1 = setTimeout(() => setPhase(1), 200);
    const timer2 = setTimeout(() => setPhase(2), 1400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const noAnim: React.CSSProperties = { opacity: 1, transform: 'none' };

  const mainStyle: React.CSSProperties = isMobile.current ? noAnim : {
    opacity: phase >= 1 ? 1 : 0,
    transform: phase >= 1 ? "translateY(0)" : "translateY(50px)",
    transition: "opacity 1.8s cubic-bezier(0.16, 1, 0.3, 1), transform 2s cubic-bezier(0.16, 1, 0.3, 1)",
  };
  const visualStyle: React.CSSProperties = isMobile.current ? noAnim : {
    opacity: phase >= 1 ? 1 : 0,
    transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(40px) scale(0.96)",
    transition: "opacity 2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
  };
  const buttonsStyle: React.CSSProperties = isMobile.current ? noAnim : {
    opacity: phase >= 2 ? 1 : 0,
    transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
  };
  return (
    <section className="relative min-h-[100svh] overflow-visible bg-background dot-grid-bg pt-20 pb-16 sm:pt-24 sm:pb-20 md:pt-28 md:pb-24 lg:pt-32 lg:pb-16">
      {/* Pure black background - pointer-events-none to not block taps */}
      <div className="absolute inset-0 bg-background pointer-events-none" aria-hidden="true" />

      {/* Floating Blocks Background with Centered Light Beam */}
      <FloatingBlocksBackground showLightBeam={phase >= 1} />

      {/* Container - ensure it's above decorative layers */}
      <div className="relative z-20 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero grid - stacks on mobile/tablet, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] items-center gap-8 lg:gap-10">
          {/* Left: Text Content - Always on top on mobile */}
          <div className="text-center lg:text-left order-1 lg:order-1 relative z-20">
            {/* Headline with shadow effect */}
            <h1
              className="font-display italic font-bold leading-tight text-wrap-balance text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl mb-4 sm:mb-5"
              style={mainStyle}
            >
              <span
                className="block"
                style={{
                  color: "hsl(0 0% 100%)",
                  textShadow:
                    "0 2px 20px hsl(0 0% 100% / 0.35), 0 4px 40px hsl(0 0% 100% / 0.25), 0 8px 80px hsl(0 0% 100% / 0.15), 0 0 120px hsl(0 0% 100% / 0.1)",
                }}
              >
                The AI Workspace
              </span>
              <span
                className="block"
                style={{
                  background: "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 65%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "none",
                  filter:
                    "drop-shadow(0 2px 15px hsl(0 0% 100% / 0.3)) drop-shadow(0 4px 30px hsl(0 0% 100% / 0.2)) drop-shadow(0 8px 50px hsl(0 0% 100% / 0.1))",
                }}
              >
                That Remembers
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-muted-foreground max-w-lg mx-auto lg:mx-0 text-sm sm:text-base lg:text-lg mb-4 sm:mb-5 lg:mb-6"
              style={{
                lineHeight: 1.7,
                ...mainStyle,
              }}
            >
              Stop losing your best AI conversations. Multiblock saves every context, every model, every insight — so your AI work builds on itself instead of starting over.
            </p>

            {/* Supporting points */}
            <div
              className="flex flex-col gap-2 sm:gap-2.5 mb-6 sm:mb-8 lg:mb-10 max-w-lg mx-auto lg:mx-0"
              style={mainStyle}
            >
              {[
                "Connect all AI models (GPT, Claude, Gemini, and more)",
                "Persistent boards that never reset",
                "Your keys, your data, your control",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center">
                    <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm">{point}</span>
                </div>
              ))}
            </div>

            {/* CTA Button - touch-optimized with no hover dependency */}
            <div
              className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 relative z-30"
              style={buttonsStyle}
            >
              <Link
                to="/auth"
                className="hero-cta-button group relative inline-flex items-center justify-center overflow-hidden px-5 py-2.5 sm:px-8 sm:py-3.5 text-xs sm:text-base font-medium rounded-full touch-manipulation"
              >
                {/* Animated edge shine - pointer-events-none */}
                <span
                  className="absolute inset-0 rounded-full animate-edge-shine pointer-events-none"
                  aria-hidden="true"
                />

                {/* Top gloss - pointer-events-none */}
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  aria-hidden="true"
                  style={{
                    background: "linear-gradient(180deg, hsl(0 0% 100% / 0.08) 0%, transparent 50%)",
                  }}
                />

                <span className="relative z-10">Start Free Trial</span>
              </Link>

              <a
                href="https://www.youtube.com/watch?v=IovzpNyw88A"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 text-xs sm:text-base font-medium rounded-full border border-border/40 bg-card/10 backdrop-blur-sm text-foreground/90 hover:bg-card/20 hover:border-border/60 hover:text-foreground transition-all duration-300 touch-manipulation"
                style={{
                  boxShadow: "0 0 20px hsl(0 0% 100% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
                }}
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Demo</span>
              </a>
            </div>
          </div>

          {/* Right: Connected Blocks Visual - Desktop: full size, Mobile/Tablet: scaled up and centered */}
          <div
            className="flex order-2 lg:order-2 items-center justify-center min-h-[360px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[500px] xl:min-h-[550px] max-h-[55vh] sm:max-h-[50vh] lg:max-h-[70vh] relative z-10 w-full overflow-visible"
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

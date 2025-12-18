import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroBlocks } from "./HeroBlocks";
import { useState, useEffect } from "react";

const Hero = () => {
  const [phase, setPhase] = useState(0);
  // Phase 0: nothing visible
  // Phase 1: main elements (text + animation) start appearing
  // Phase 2: secondary elements (badge, buttons) appear

  useEffect(() => {
    // Start main elements after a brief delay
    const timer1 = setTimeout(() => setPhase(1), 100);
    // Secondary elements appear after main elements settle
    const timer2 = setTimeout(() => setPhase(2), 700);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const mainStyle = {
    opacity: phase >= 1 ? 1 : 0,
    transform: phase >= 1 ? 'translateY(0)' : 'translateY(40px)',
    transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const visualStyle = {
    opacity: phase >= 1 ? 1 : 0,
    transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)',
    transition: 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
  };

  const badgeStyle = {
    opacity: phase >= 2 ? 1 : 0,
    transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const buttonsStyle = {
    opacity: phase >= 2 ? 1 : 0,
    transform: phase >= 2 ? 'translateY(0)' : 'translateY(15px)',
    transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
  };

  return (
    <section className="relative min-h-screen overflow-hidden" style={{ paddingTop: "clamp(80px, 12vw, 128px)", paddingBottom: "clamp(48px, 6vw, 80px)" }}>
      {/* Soft Warm Noisy Background */}
      <div className="absolute inset-0 hero-glow-bg" />
      <div className="absolute inset-0 hero-noise" />
      
      {/* Cinematic Lighting Effect */}
      <div className={`hero-lighting ${phase >= 1 ? 'active' : ''}`} />
      
      {/* Container */}
      <div 
        className="relative z-10 w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(24px, 4vw, 48px)" }}>
          {/* Left: Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge - Secondary */}
            <div 
              className="inline-flex items-center gap-2 rounded-full bg-secondary/50 border border-border"
              style={{ 
                paddingLeft: "clamp(12px, 2vw, 16px)",
                paddingRight: "clamp(12px, 2vw, 16px)",
                paddingTop: "clamp(6px, 1vw, 8px)",
                paddingBottom: "clamp(6px, 1vw, 8px)",
                marginBottom: "clamp(20px, 3vw, 32px)",
                ...badgeStyle,
              }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
              <span className="text-fluid-sm text-muted-foreground">Now in Early Access</span>
            </div>

            {/* Headline - Primary */}
            <h1 
              className="font-bold text-foreground leading-tight text-wrap-balance"
              style={{ 
                fontSize: "clamp(1.75rem, 1rem + 4vw, 4.5rem)",
                marginBottom: "clamp(16px, 2vw, 24px)",
                ...mainStyle,
              }}
            >
              One Workspace.
              <br />
              <span className="glow-text">Every AI Model.</span>
            </h1>

            {/* Sub-headline - Primary */}
            <p 
              className="text-muted-foreground max-w-xl mx-auto lg:mx-0 text-break"
              style={{ 
                fontSize: "clamp(0.875rem, 0.75rem + 0.5vw, 1.25rem)",
                marginBottom: "clamp(24px, 4vw, 40px)",
                lineHeight: 1.6,
                ...mainStyle,
              }}
            >
              Create blocks for different AI models, chat with them, and connect outputs 
              to automate your workflows. Your keys, your control.
            </p>

            {/* CTA Buttons - Secondary */}
            <div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start"
              style={{ gap: "clamp(12px, 2vw, 16px)", ...buttonsStyle }}
            >
              <Link 
                to="/auth" 
                className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Get Early Access
                <ArrowRight size={18} />
              </Link>
              <a 
                href="#how-it-works" 
                className="btn-outline flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Play size={18} />
                View Demo
              </a>
            </div>
          </div>

          {/* Right: Connected Blocks Visual - Primary */}
          <div 
            className="order-1 lg:order-2 flex items-center justify-center"
            style={{ 
              minHeight: "clamp(250px, 40vw, 600px)",
              maxHeight: "70vh",
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

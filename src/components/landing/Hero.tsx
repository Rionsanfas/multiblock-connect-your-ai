import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroBlocks } from "./HeroBlocks";

const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden" style={{ paddingTop: "clamp(80px, 12vw, 128px)", paddingBottom: "clamp(48px, 6vw, 80px)" }}>
      {/* Soft Warm Noisy Background */}
      <div className="absolute inset-0 hero-glow-bg" />
      <div className="absolute inset-0 hero-noise" />
      
      {/* 
        Container with responsive padding.
        Max-width prevents content from stretching too wide.
      */}
      <div 
        className="relative z-10 w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* 
          Hero grid: stacked on mobile/tablet, side-by-side on laptop+.
          Text first on mobile (order-2 → order-1 on lg).
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(24px, 4vw, 48px)" }}>
          {/* Left: Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 rounded-full bg-secondary/50 border border-border animate-fade-up"
              style={{ 
                paddingLeft: "clamp(12px, 2vw, 16px)",
                paddingRight: "clamp(12px, 2vw, 16px)",
                paddingTop: "clamp(6px, 1vw, 8px)",
                paddingBottom: "clamp(6px, 1vw, 8px)",
                marginBottom: "clamp(20px, 3vw, 32px)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
              <span className="text-fluid-sm text-muted-foreground">Now in Early Access</span>
            </div>

            {/* 
              Headline with fluid typography.
              Uses text-wrap: balance for better line distribution.
            */}
            <h1 
              className="font-bold text-foreground leading-tight animate-fade-up delay-100 text-wrap-balance"
              style={{ 
                fontSize: "clamp(1.75rem, 1rem + 4vw, 4.5rem)",
                marginBottom: "clamp(16px, 2vw, 24px)",
              }}
            >
              One Workspace.
              <br />
              <span className="glow-text">Every AI Model.</span>
            </h1>

            {/* Sub-headline with proper text wrapping */}
            <p 
              className="text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-fade-up delay-200 text-break"
              style={{ 
                fontSize: "clamp(0.875rem, 0.75rem + 0.5vw, 1.25rem)",
                marginBottom: "clamp(24px, 4vw, 40px)",
                lineHeight: 1.6,
              }}
            >
              Create blocks for different AI models, chat with them, and connect outputs 
              to automate your workflows. Your keys, your control.
            </p>

            {/* CTA Buttons - stack on mobile, row on sm+ */}
            <div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start animate-fade-up delay-300"
              style={{ gap: "clamp(12px, 2vw, 16px)" }}
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

          {/* 
            Right: Connected Blocks Visual.
            Height scales with viewport, centered on mobile.
          */}
          <div 
            className="order-1 lg:order-2 animate-fade-up delay-200 flex items-center justify-center"
            style={{ 
              minHeight: "clamp(250px, 40vw, 600px)",
              maxHeight: "70vh",
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
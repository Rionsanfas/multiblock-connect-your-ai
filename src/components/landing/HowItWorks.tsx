import { useEffect, useRef, useState } from "react";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import { SectionBackground } from "./SectionBackground";

const LetterHighlight = ({ text }: { text: string }) => {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const startPoint = windowHeight;
      const endPoint = windowHeight * 0.3;
      
      const elementCenter = rect.top + rect.height / 2;
      
      if (elementCenter >= startPoint) {
        setProgress(0);
      } else if (elementCenter <= endPoint) {
        setProgress(1);
      } else {
        const scrollProgress = (startPoint - elementCenter) / (startPoint - endPoint);
        setProgress(Math.max(0, Math.min(1, scrollProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const highlightedCount = progress * text.length;

  return (
    <div ref={containerRef} className="hiw-letter-highlight-container">
      {text.split("").map((letter, i) => {
        const letterProgress = Math.max(0, Math.min(1, highlightedCount - i));
        
        return (
          <span
            key={i}
            className="hiw-letter"
            style={{
              color: letterProgress > 0 
                ? `hsl(30 30% ${35 + letterProgress * 25}%)` 
                : undefined,
              textShadow: letterProgress > 0.5 
                ? `0 0 ${25 * letterProgress}px hsl(30 30% 50% / ${0.5 * letterProgress})` 
                : undefined,
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};

/* True 3D Plus Icon - The icon itself is 3D, not in a box */
const Plus3DIcon = () => {
  return (
    <div className="hiw-icon-3d-scene">
      <div className="hiw-icon-3d-wrapper">
        {/* Horizontal bar of the plus */}
        <div className="hiw-plus-bar hiw-plus-horizontal">
          <div className="hiw-bar-face hiw-bar-front" />
          <div className="hiw-bar-face hiw-bar-back" />
          <div className="hiw-bar-face hiw-bar-top" />
          <div className="hiw-bar-face hiw-bar-bottom" />
          <div className="hiw-bar-face hiw-bar-left" />
          <div className="hiw-bar-face hiw-bar-right" />
        </div>
        {/* Vertical bar of the plus */}
        <div className="hiw-plus-bar hiw-plus-vertical">
          <div className="hiw-bar-face hiw-bar-front" />
          <div className="hiw-bar-face hiw-bar-back" />
          <div className="hiw-bar-face hiw-bar-top" />
          <div className="hiw-bar-face hiw-bar-bottom" />
          <div className="hiw-bar-face hiw-bar-left" />
          <div className="hiw-bar-face hiw-bar-right" />
        </div>
      </div>
    </div>
  );
};

/* True 3D Link Icon - Chain links in 3D */
const Link3DIcon = () => {
  return (
    <div className="hiw-icon-3d-scene hiw-link-scene">
      <div className="hiw-icon-3d-wrapper hiw-link-wrapper">
        {/* First chain link */}
        <div className="hiw-chain-link hiw-chain-link-1">
          <div className="hiw-chain-ring" />
        </div>
        {/* Second chain link */}
        <div className="hiw-chain-link hiw-chain-link-2">
          <div className="hiw-chain-ring" />
        </div>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="relative"
      style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
    >
      {/* Background effects */}
      <SectionBackground intensity="normal" />

      {/* Container */}
      <div
        className="relative z-10 w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Header */}
        <AnimatedSection delay={0} className="text-center" style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}>
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            How It Works
          </span>
          <h2
            className="font-bold text-foreground mt-4 text-wrap-balance"
            style={{
              fontSize: "clamp(1.5rem, 1rem + 2.5vw, 3rem)",
              marginBottom: "clamp(12px, 2vw, 16px)",
            }}
          >
            Simple. Powerful. Visual.
          </h2>
          <p
            className="text-muted-foreground max-w-xl mx-auto text-break"
            style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
          >
            Get started in minutes with an intuitive workflow designed for builders.
          </p>
        </AnimatedSection>

        {/* Bento Grid - New Layout: Big card left, 2 stacked right */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Add Blocks (Big Card) */}
          <AnimatedElement delay={100}>
            <div className="hiw-bento-card hiw-card-3d hiw-card-3d-left hiw-card-featured dot-grid-card h-full min-h-[400px] lg:min-h-[500px]">
              <div className="hiw-card-3d-inner h-full flex flex-col">
                {/* 3D Plus Icon */}
                <div className="hiw-3d-icon-wrapper flex-1 flex items-center justify-center">
                  <Plus3DIcon />
                </div>
                
                <div className="hiw-bento-content p-6">
                  <h3 className="hiw-bento-title text-2xl mb-3">Add Blocks</h3>
                  <p className="hiw-bento-desc text-base">
                    Create a new block for each AI model you want to use. Choose from GPT-5, Claude, Gemini, and more.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedElement>

          {/* Right side - 2 stacked cards */}
          <div className="flex flex-col gap-6">
            {/* Card 2 - Chat with Models */}
            <AnimatedElement delay={200}>
              <div className="hiw-bento-card hiw-card-3d hiw-card-3d-right dot-grid-card h-full min-h-[230px]">
                <div className="hiw-card-3d-inner h-full flex flex-col">
                  {/* Sequential letter highlight text */}
                  <div className="hiw-overflow-text-new flex-1 flex items-center justify-center">
                    <LetterHighlight text="Compare" />
                  </div>
                  
                  <div className="hiw-bento-content hiw-content-bottom p-5">
                    <h3 className="hiw-bento-title text-xl mb-2">Chat with Models</h3>
                    <p className="hiw-bento-desc text-sm">
                      Interact with each model independently. Compare responses in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedElement>

            {/* Card 3 - Connect Them */}
            <AnimatedElement delay={300}>
              <div className="hiw-bento-card hiw-card-3d hiw-card-3d-right dot-grid-card h-full min-h-[230px]">
                <div className="hiw-card-3d-inner h-full flex flex-col">
                  {/* 3D Link Icon */}
                  <div className="hiw-3d-icon-wrapper flex-1 flex items-center justify-center">
                    <Link3DIcon />
                  </div>
                  
                  <div className="hiw-bento-content p-5">
                    <h3 className="hiw-bento-title text-xl mb-2">Connect Them</h3>
                    <p className="hiw-bento-desc text-sm">
                      Draw connections between blocks. One model's output becomes another's input.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

import { useEffect, useRef, useState } from "react";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";

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

/* 3D Plus Icon with real depth */
const Plus3DIcon = () => {
  return (
    <div className="hiw-3d-icon-scene">
      <div className="hiw-3d-icon-cube hiw-3d-plus-cube">
        {/* Front face - main icon */}
        <div className="hiw-3d-face hiw-3d-face-front">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        {/* Back face */}
        <div className="hiw-3d-face hiw-3d-face-back" />
        {/* Top face */}
        <div className="hiw-3d-face hiw-3d-face-top" />
        {/* Bottom face */}
        <div className="hiw-3d-face hiw-3d-face-bottom" />
        {/* Left face */}
        <div className="hiw-3d-face hiw-3d-face-left" />
        {/* Right face */}
        <div className="hiw-3d-face hiw-3d-face-right" />
      </div>
    </div>
  );
};

/* 3D Link Icon with real depth */
const Link3DIcon = () => {
  return (
    <div className="hiw-3d-icon-scene hiw-3d-link-scene">
      <div className="hiw-3d-icon-cube hiw-3d-link-cube">
        {/* Front face - main icon */}
        <div className="hiw-3d-face hiw-3d-face-front">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        {/* Back face */}
        <div className="hiw-3d-face hiw-3d-face-back" />
        {/* Top face */}
        <div className="hiw-3d-face hiw-3d-face-top" />
        {/* Bottom face */}
        <div className="hiw-3d-face hiw-3d-face-bottom" />
        {/* Left face */}
        <div className="hiw-3d-face hiw-3d-face-left" />
        {/* Right face */}
        <div className="hiw-3d-face hiw-3d-face-right" />
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
      {/* Background blur effect */}
      <div
        className="gradient-blur bg-accent/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute"
        style={{
          width: "clamp(250px, 40vw, 500px)",
          height: "clamp(250px, 40vw, 500px)",
        }}
      />

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
            <div className="premium-dark-card premium-dark-card-large group h-full min-h-[400px] lg:min-h-[500px]">
              {/* Inner decorative lines */}
              <div className="premium-dark-card-lines" />
              
              {/* Icon area */}
              <div className="premium-dark-card-icon-area flex-1">
                <div className="premium-dark-card-icon premium-dark-card-icon-large">
                  <Plus3DIcon />
                </div>
                {/* Connection nodes decoration */}
                <div className="premium-dark-card-node premium-dark-card-node-left" />
                <div className="premium-dark-card-node premium-dark-card-node-right" />
              </div>
              
              <div className="premium-dark-card-content p-6">
                <h3 className="premium-dark-card-title text-2xl mb-3">Add Blocks</h3>
                <p className="premium-dark-card-desc text-base">
                  Create a new block for each AI model you want to use. Choose from GPT-5, Claude, Gemini, and more.
                </p>
              </div>
            </div>
          </AnimatedElement>

          {/* Right side - 2 stacked cards */}
          <div className="flex flex-col gap-6">
            {/* Card 2 - Chat with Models */}
            <AnimatedElement delay={200}>
              <div className="premium-dark-card group h-full min-h-[230px]">
                <div className="premium-dark-card-lines" />
                
                <div className="premium-dark-card-icon-area flex-1">
                  <div className="hiw-overflow-text-new flex items-center justify-center">
                    <LetterHighlight text="Compare" />
                  </div>
                </div>
                
                <div className="premium-dark-card-content p-5">
                  <h3 className="premium-dark-card-title text-xl mb-2">Chat with Models</h3>
                  <p className="premium-dark-card-desc text-sm">
                    Interact with each model independently. Compare responses in real-time.
                  </p>
                </div>
              </div>
            </AnimatedElement>

            {/* Card 3 - Connect Them */}
            <AnimatedElement delay={300}>
              <div className="premium-dark-card group h-full min-h-[230px]">
                <div className="premium-dark-card-lines" />
                
                <div className="premium-dark-card-icon-area flex-1">
                  <div className="premium-dark-card-icon">
                    <Link3DIcon />
                  </div>
                  <div className="premium-dark-card-node premium-dark-card-node-left" />
                  <div className="premium-dark-card-node premium-dark-card-node-right" />
                </div>
                
                <div className="premium-dark-card-content p-5">
                  <h3 className="premium-dark-card-title text-xl mb-2">Connect Them</h3>
                  <p className="premium-dark-card-desc text-sm">
                    Draw connections between blocks. One model's output becomes another's input.
                  </p>
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

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
      className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24"
    >
      {/* Background blur effect */}
      <div
        className="gradient-blur bg-accent/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute w-[200px] sm:w-[300px] md:w-[400px] lg:w-[500px] h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px]"
      />

      {/* Container */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection delay={0} className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            How It Works
          </span>
          <h2 className="font-display italic font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            How Multiblock Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
            Set up in minutes. Keep context flowing automatically between AI models.
          </p>
        </AnimatedSection>

        {/* Bento Grid - horizontal scroll on mobile/tablet */}
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-6 max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-4 max-lg:-mx-4 max-lg:px-4 max-lg:snap-x max-lg:snap-mandatory scrollbar-hide">
          {/* Card 1 - Add Blocks */}
          <AnimatedElement delay={100}>
            <div className="hiw-bento-card hiw-card-3d hiw-card-3d-left hiw-card-featured dot-grid-card h-full min-h-[200px] sm:min-h-[240px] lg:min-h-[420px] max-lg:min-w-[200px] max-lg:max-w-[220px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[240px] md:max-lg:max-w-[260px]">
              <div className="hiw-card-3d-inner h-full flex flex-col">
                {/* 3D Plus Icon - smaller on mobile/tablet */}
                <div className="hiw-3d-icon-wrapper flex-1 flex items-center justify-center max-lg:scale-75 max-lg:origin-center">
                  <Plus3DIcon />
                </div>
                
                <div className="hiw-bento-content p-3 sm:p-4 lg:p-6">
                  <h3 className="hiw-bento-title font-display text-base sm:text-lg lg:text-2xl mb-1.5 sm:mb-2 lg:mb-3">Create AI Blocks</h3>
                  <p className="hiw-bento-desc text-xs sm:text-sm lg:text-base">
                    Add GPT-5, Claude, Gemini—any model you need in one workspace.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedElement>

          {/* Card 2 - Chat with Models */}
          <AnimatedElement delay={200}>
            <div className="hiw-bento-card hiw-card-3d hiw-card-3d-right dot-grid-card h-full min-h-[200px] sm:min-h-[240px] lg:min-h-[200px] max-lg:min-w-[200px] max-lg:max-w-[220px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[240px] md:max-lg:max-w-[260px]">
              <div className="hiw-card-3d-inner h-full flex flex-col">
                {/* Sequential letter highlight text - smaller on mobile */}
                <div className="hiw-overflow-text-new flex-1 flex items-center justify-start pt-4 sm:pt-6 lg:pt-8 max-lg:scale-75 max-lg:origin-top-center">
                  <LetterHighlight text="Compare" />
                </div>
                
                <div className="hiw-bento-content hiw-content-bottom p-3 sm:p-4 lg:p-5 mt-auto">
                  <h3 className="hiw-bento-title font-display text-base sm:text-lg lg:text-xl mb-1 sm:mb-1.5 lg:mb-2">Compare Side-by-Side</h3>
                  <p className="hiw-bento-desc text-xs sm:text-sm">
                    See which model gives better results—no tab switching.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedElement>

          {/* Card 3 - Connect Them */}
          <AnimatedElement delay={300}>
            <div className="hiw-bento-card hiw-card-3d hiw-card-3d-right dot-grid-card h-full min-h-[200px] sm:min-h-[240px] lg:min-h-[200px] max-lg:min-w-[200px] max-lg:max-w-[220px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[240px] md:max-lg:max-w-[260px]">
              <div className="hiw-card-3d-inner h-full flex flex-col">
                {/* 3D Link Icon - smaller on mobile/tablet */}
                <div className="hiw-3d-icon-wrapper flex-1 flex items-center justify-center max-lg:scale-75 max-lg:origin-center">
                  <Link3DIcon />
                </div>
                
                <div className="hiw-bento-content p-3 sm:p-4 lg:p-5">
                  <h3 className="hiw-bento-title font-display text-base sm:text-lg lg:text-xl mb-1 sm:mb-1.5 lg:mb-2">Link Context Automatically</h3>
                  <p className="hiw-bento-desc text-xs sm:text-sm">
                    One block's output feeds directly into another—zero copy-paste.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

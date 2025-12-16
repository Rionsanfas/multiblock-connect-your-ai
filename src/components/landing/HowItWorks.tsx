import { Plus, Link } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const LetterHighlight = ({ text }: { text: string }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (text.length + 3));
    }, 150);
    return () => clearInterval(interval);
  }, [isVisible, text.length]);

  return (
    <div ref={containerRef} className="hiw-letter-highlight-container">
      {text.split("").map((letter, i) => (
        <span
          key={i}
          className={`hiw-letter ${i <= activeIndex && activeIndex < text.length ? "hiw-letter-active" : ""}`}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="relative dot-grid-bg"
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
        <div className="text-center" style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}>
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
        </div>

        {/* Bento Grid */}
        <div className="hiw-bento-grid max-w-4xl mx-auto">
          {/* Card 1 - Add Blocks (Tall left card) */}
          <div className="hiw-bento-card hiw-bento-tall hiw-card-3d hiw-card-3d-left">
            <div className="hiw-card-3d-inner">
              {/* 3D Plus Icon */}
              <div className="hiw-3d-icon-wrapper">
                <div className="hiw-3d-plus">
                  <Plus className="hiw-3d-plus-icon" strokeWidth={3} />
                </div>
              </div>
              
              <div className="hiw-bento-content">
                <h3 className="hiw-bento-title">Add Blocks</h3>
                <p className="hiw-bento-desc">
                  Create a new block for each AI model you want to use. Choose from GPT-5, Claude, Gemini, and more.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 - Chat (Top right, wide) */}
          <div className="hiw-bento-card hiw-bento-wide hiw-card-3d hiw-card-3d-right">
            <div className="hiw-card-3d-inner">
              {/* Sequential letter highlight text */}
              <div className="hiw-overflow-text-new">
                <LetterHighlight text="Compare" />
              </div>
              
              <div className="hiw-bento-content hiw-content-bottom">
                <h3 className="hiw-bento-title">Chat with Models</h3>
                <p className="hiw-bento-desc">
                  Interact with each model independently. Compare responses in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3 - Connect (Bottom right, square) */}
          <div className="hiw-bento-card hiw-bento-square hiw-card-3d hiw-card-3d-right">
            <div className="hiw-card-3d-inner">
              {/* 3D Link Icon */}
              <div className="hiw-3d-icon-wrapper">
                <div className="hiw-3d-link">
                  <Link className="hiw-3d-link-icon" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="hiw-bento-content">
                <h3 className="hiw-bento-title">Connect Them</h3>
                <p className="hiw-bento-desc">
                  Draw connections between blocks. One model's output becomes another's input.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

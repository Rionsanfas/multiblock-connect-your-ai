import { Link } from "react-router-dom";
import { AnimatedSection } from "./AnimatedSection";

const FinalCTA = () => {
  return (
    <section className="relative dot-grid-bg py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection delay={0} className="text-center">
          <h2 className="font-display italic font-bold text-foreground text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-5">
            Stop Losing Your AI Work
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base mb-8 sm:mb-10">
            Join the AI workspace where thinking compounds, not resets.
          </p>

          <Link
            to="/auth"
            className="hero-cta-button group relative inline-flex items-center justify-center overflow-hidden px-8 py-3.5 text-base font-medium rounded-full touch-manipulation"
          >
            <span
              className="absolute inset-0 rounded-full animate-edge-shine pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 rounded-full pointer-events-none"
              aria-hidden="true"
              style={{
                background: "linear-gradient(180deg, hsl(0 0% 100% / 0.08) 0%, transparent 50%)",
              }}
            />
            <span className="relative z-10">Start Free Trial</span>
          </Link>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-6 sm:mt-8">
            {["All data exportable", "Cancel anytime"].map((signal) => (
              <div key={signal} className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-muted-foreground text-xs sm:text-sm">{signal}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FinalCTA;

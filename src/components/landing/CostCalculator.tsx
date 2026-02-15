import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import { Check, X } from "lucide-react";

const CostCalculator = () => {
  return (
    <section className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection delay={0} className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Save Money
          </span>
          <h2 className="font-display italic font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            Replace $60/Month in Subscriptions
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* What You're Paying Now */}
          <AnimatedElement delay={100}>
            <div className="glass-card p-5 sm:p-6 h-full flex flex-col">
              <h3 className="font-display font-semibold text-foreground text-base sm:text-lg mb-4">
                What You're Paying Now
              </h3>
              <div className="flex flex-col gap-3 flex-1">
                {[
                  { name: "ChatGPT Plus", price: "$20/mo" },
                  { name: "Claude Pro", price: "$20/mo" },
                  { name: "Perplexity Pro", price: "$20/mo" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">{item.name}</span>
                    <span className="text-foreground text-sm font-medium">{item.price}</span>
                  </div>
                ))}
                <div className="border-t border-border/30 pt-3 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold text-sm">Total</span>
                    <span className="text-foreground font-bold text-lg">$60/mo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-muted/30">
                <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Lost conversations, no memory</span>
              </div>
            </div>
          </AnimatedElement>

          {/* With Multiblock */}
          <AnimatedElement delay={200}>
            <div className="glass-card p-5 sm:p-6 h-full flex flex-col border-accent/30">
              <h3 className="font-display font-semibold text-foreground text-base sm:text-lg mb-4">
                With Multiblock
              </h3>
              <div className="flex flex-col gap-3 flex-1">
                {[
                  { name: "Multiblock workspace", price: "$19/mo" },
                  { name: "Your API keys (est.)", price: "~$15/mo" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">{item.name}</span>
                    <span className="text-foreground text-sm font-medium">{item.price}</span>
                  </div>
                ))}
                <div className="border-t border-border/30 pt-3 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold text-sm">Total</span>
                    <span className="text-accent font-bold text-lg">$34/mo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-accent/10">
                <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Unlimited usage + persistent boards</span>
              </div>
            </div>
          </AnimatedElement>

          {/* Savings */}
          <AnimatedElement delay={300}>
            <div className="glass-card p-5 sm:p-6 h-full flex flex-col items-center justify-center text-center"
              style={{
                background: "linear-gradient(145deg, hsl(var(--accent) / 0.08), hsl(0 0% 8% / 0.85))",
                borderColor: "hsl(var(--accent) / 0.25)",
              }}
            >
              <span className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">You Save</span>
              <span className="text-4xl sm:text-5xl font-bold text-foreground mb-1">$26</span>
              <span className="text-muted-foreground text-sm mb-3">/month</span>
              <div className="px-4 py-2 rounded-full bg-accent/15 text-accent font-semibold text-sm">
                $312/year saved
              </div>
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
};

export default CostCalculator;

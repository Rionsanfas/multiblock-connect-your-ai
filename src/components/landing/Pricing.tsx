import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import { getFreePlan, getPaidPlans } from "@/config/plans";
import { PricingCard } from "@/components/pricing/PricingCard";

const Pricing = () => {
  const freePlan = getFreePlan();
  const paidPlans = getPaidPlans();

  return (
    <TooltipProvider>
      <section id="pricing" className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <AnimatedSection delay={0} className="text-center mb-6 sm:mb-8 md:mb-10">
            <span className="section-badge mb-4">
              Simple Pricing
            </span>
            <h2 className="font-display italic font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
              Start free, upgrade when you need more. Annual plans and lifetime deals available.
            </p>
          </AnimatedSection>

          {/* Annual Plans Row */}
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 max-w-5xl mx-auto items-stretch mb-6 sm:mb-8">
              <AnimatedElement delay={0}>
                <PricingCard plan={freePlan} />
              </AnimatedElement>
              {paidPlans.filter(p => p.billing_period !== 'lifetime').map((plan, index) => (
                <AnimatedElement key={plan.id} delay={(index + 1) * 100}>
                  <PricingCard plan={plan} showSeats={plan.seats > 1} />
                </AnimatedElement>
              ))}
            </div>
          </AnimatedSection>

          {/* Lifetime Plans Row */}
          <AnimatedSection delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 max-w-3xl mx-auto items-stretch">
              {paidPlans.filter(p => p.billing_period === 'lifetime').map((plan, index) => (
                <AnimatedElement key={plan.id} delay={index * 100}>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                    <PricingCard plan={plan} showSeats={plan.seats > 1} />
                  </div>
                </AnimatedElement>
              ))}
            </div>
          </AnimatedSection>

          {/* View All Plans CTA */}
          <AnimatedSection delay={300} className="text-center mt-8 sm:mt-10 md:mt-12">
            <></>
          </AnimatedSection>
        </div>
      </section>
    </TooltipProvider>
  );
};
export default Pricing;

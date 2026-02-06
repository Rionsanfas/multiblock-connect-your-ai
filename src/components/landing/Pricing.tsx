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

          {/* All plans as flat grid - no tabs */}
          <AnimatedSection delay={100}>
            {/* Mobile/tablet: horizontal scroll. Desktop: 5-col grid (free + 4 paid) */}
            <div className="lg:grid lg:grid-cols-5 lg:gap-5 lg:max-w-7xl lg:mx-auto lg:items-stretch max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-4 max-lg:-mx-4 max-lg:px-4 max-lg:snap-x max-lg:snap-mandatory scrollbar-hide">
              <AnimatedElement delay={0}>
                <div className="max-lg:min-w-[220px] max-lg:max-w-[250px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[260px] md:max-lg:max-w-[280px]">
                  <PricingCard plan={freePlan} />
                </div>
              </AnimatedElement>
              {paidPlans.map((plan, index) => (
                <AnimatedElement key={plan.id} delay={(index + 1) * 100}>
                  <div className={`max-lg:min-w-[220px] max-lg:max-w-[250px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[260px] md:max-lg:max-w-[280px] ${plan.billing_period === 'lifetime' ? 'relative' : ''}`}>
                    {plan.billing_period === 'lifetime' && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                    )}
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

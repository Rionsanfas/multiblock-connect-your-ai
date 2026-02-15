import { useState } from "react";
import { Check } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import {
  getFreePlan,
  getProMonthlyPlan,
  getProAnnualPlan,
  getTeamMonthlyPlan,
  getTeamAnnualPlan,
  type PlanConfig,
} from "@/config/plans";
import { PricingButton } from "@/components/pricing/PricingButton";
import { useNavigate } from "react-router-dom";

function HomePricingCard({ plan }: { plan: PlanConfig }) {
  const isHighlight = plan.highlight;

  return (
    <div className={`relative flex flex-col h-full rounded-2xl transition-all duration-500 overflow-hidden ${
      isHighlight ? 'pricing-card-highlight sm:scale-105 z-10' : 'pricing-card-default'
    }`}>
      {/* Badge */}
      {plan.badge && (
        <div className={`absolute -top-px left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap z-10 ${
          isHighlight ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {plan.badge}
        </div>
      )}

      <div className="p-4 sm:p-6 flex flex-col h-full">
        {/* Price */}
        <div className="mb-3 sm:mb-4 mt-2">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight">
              {plan.price_cents === 0 ? '$0' : `$${(plan.price_cents / 100).toFixed(0)}`}
            </span>
            {plan.price_cents > 0 && (
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                / {plan.billing_period === 'yearly' ? 'year' : 'Per Month'}
              </span>
            )}
          </div>
          {plan.billing_period === 'yearly' && plan.annual_savings && (
            <p className="text-[10px] sm:text-xs text-accent font-medium mt-1">
              Save ${plan.annual_savings} vs monthly
            </p>
          )}
          {plan.trial_days && plan.billing_period === 'monthly' && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {plan.trial_days}-day free trial
            </p>
          )}
        </div>

        {/* Plan Name */}
        <h3 className={`text-base sm:text-lg font-bold mb-1 ${isHighlight ? 'text-gold-shine' : 'text-foreground'}`}>
          {plan.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
          {plan.description}
        </p>

        {/* CTA Button */}
        <div className="mb-4 sm:mb-5">
          <PricingButton plan={plan} variant={isHighlight ? 'primary' : 'secondary'} />
        </div>

        {/* Features */}
        <p className="text-[10px] sm:text-xs font-semibold text-foreground mb-2 tracking-wide uppercase">
          Features:
        </p>
        <ul className="space-y-1.5 sm:space-y-2 flex-1">
          {plan.features.slice(0, 6).map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[10px] sm:text-xs">
              <div className="mt-0.5 flex-shrink-0 check-icon-3d">
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent" />
              </div>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const freePlan = getFreePlan();
  const proPlan = isAnnual ? getProAnnualPlan() : getProMonthlyPlan();
  const teamPlan = isAnnual ? getTeamAnnualPlan() : getTeamMonthlyPlan();
  const navigate = useNavigate();

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
              Start free, upgrade when you need more.
            </p>
          </AnimatedSection>

          {/* Billing Toggle */}
          <AnimatedSection delay={50} className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="billing-toggle-3d">
              <button
                onClick={() => setIsAnnual(false)}
                className={`billing-toggle-btn ${!isAnnual ? 'billing-toggle-active' : ''}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`billing-toggle-btn flex items-center gap-1.5 ${isAnnual ? 'billing-toggle-active' : ''}`}
              >
                Yearly
                <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </AnimatedSection>

          {/* Pricing Cards */}
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 max-w-5xl mx-auto items-stretch mb-8 sm:mb-10">
              <AnimatedElement delay={0}>
                <HomePricingCard plan={freePlan} />
              </AnimatedElement>
              <AnimatedElement delay={100}>
                <HomePricingCard plan={proPlan} />
              </AnimatedElement>
              <AnimatedElement delay={200}>
                <HomePricingCard plan={teamPlan} />
              </AnimatedElement>
            </div>
          </AnimatedSection>

          {/* View All Plans CTA */}
          <AnimatedSection delay={300} className="text-center">
            <button
              onClick={() => navigate('/pricing')}
              className="btn-3d text-sm font-medium px-6 py-2.5 rounded-full text-foreground"
            >
              Compare all plans →
            </button>
          </AnimatedSection>
        </div>
      </section>
    </TooltipProvider>
  );
};
export default Pricing;

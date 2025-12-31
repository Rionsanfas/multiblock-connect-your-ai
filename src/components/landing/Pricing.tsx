import { Zap, Infinity, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import { 
  getFreePlan,
  getIndividualAnnualPlans, 
  getTeamAnnualPlans, 
  getIndividualLifetimePlans,
  getTeamLifetimePlans
} from "@/config/plans";
import { PricingCard } from "@/components/pricing/PricingCard";
import { LtdScarcityBadge } from "@/components/pricing/LtdScarcityBadge";

const Pricing = () => {
  const freePlan = getFreePlan();
  const individualAnnualPlans = getIndividualAnnualPlans();
  const teamAnnualPlans = getTeamAnnualPlans();
  const individualLifetimePlans = getIndividualLifetimePlans();
  const teamLifetimePlans = getTeamLifetimePlans();

  return (
    <TooltipProvider>
      <section
        id="pricing"
        className="relative"
        style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
      >
        <div
          className="w-full max-w-7xl mx-auto"
          style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
        >
          {/* Header */}
          <AnimatedSection delay={0} className="text-center" style={{ marginBottom: "clamp(32px, 5vw, 48px)" }}>
            <span className="section-badge mb-4">
              <Zap className="h-4 w-4" />
              Simple Pricing
            </span>
            <h2
              className="font-bold text-foreground mt-4 text-wrap-balance"
              style={{
                fontSize: "clamp(1.5rem, 1rem + 2.5vw, 3rem)",
                marginBottom: "clamp(12px, 2vw, 16px)",
              }}
            >
              Choose Your Plan
            </h2>
            <p
              className="text-muted-foreground max-w-xl mx-auto text-break"
              style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
            >
              Start free, upgrade when you need more. Annual plans and lifetime deals available.
            </p>
          </AnimatedSection>

          {/* Plan Category Tabs */}
          <AnimatedSection delay={100}>
            <Tabs defaultValue="lifetime" className="w-full">
              <TabsList className="tabs-3d grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
                <TabsTrigger value="lifetime" className="flex items-center gap-2">
                  <Infinity className="h-4 w-4" />
                  Lifetime
                </TabsTrigger>
                <TabsTrigger value="individual" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Individual
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Teams
                </TabsTrigger>
              </TabsList>

              {/* Individual Annual Plans */}
              <TabsContent value="individual" className="mt-8">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">Annual plans for individual users</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                  <AnimatedElement delay={0}>
                    <PricingCard plan={freePlan} />
                  </AnimatedElement>
                  {individualAnnualPlans.map((plan, index) => (
                    <AnimatedElement key={plan.id} delay={(index + 1) * 100}>
                      <PricingCard plan={plan} />
                    </AnimatedElement>
                  ))}
                </div>
              </TabsContent>

              {/* Team Annual Plans */}
              <TabsContent value="team" className="mt-8">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">Annual plans for teams</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
                  {teamAnnualPlans.map((plan, index) => (
                    <AnimatedElement key={plan.id} delay={index * 100}>
                      <PricingCard plan={plan} showSeats />
                    </AnimatedElement>
                  ))}
                </div>
              </TabsContent>

              {/* Lifetime Deals */}
              <TabsContent value="lifetime" className="mt-8">
                {/* LTD Scarcity Badge */}
                <div className="flex justify-center mb-8">
                  <LtdScarcityBadge />
                </div>

                {/* Individual Lifetime */}
                <div className="mb-10">
                  <h3 className="text-lg font-semibold text-center mb-6 text-muted-foreground">Individual Lifetime Deals</h3>
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
                    {individualLifetimePlans.map((plan, index) => (
                      <AnimatedElement key={plan.id} delay={index * 100}>
                        <div className="relative">
                          {/* LTD Glow Effect */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                          <PricingCard plan={plan} />
                        </div>
                      </AnimatedElement>
                    ))}
                  </div>
                </div>

                {/* Team Lifetime */}
                <div>
                  <h3 className="text-lg font-semibold text-center mb-6 text-muted-foreground">Team Lifetime Deals</h3>
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
                    {teamLifetimePlans.map((plan, index) => (
                      <AnimatedElement key={plan.id} delay={index * 100}>
                        <div className="relative">
                          {/* LTD Glow Effect */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                          <PricingCard plan={plan} showSeats />
                        </div>
                      </AnimatedElement>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </AnimatedSection>

          {/* View All Plans CTA */}
          <AnimatedSection delay={300} className="text-center" style={{ marginTop: "clamp(32px, 4vw, 48px)" }}>
            <p
              className="text-muted-foreground"
              style={{
                fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1rem)",
                marginBottom: "12px",
              }}
            >
              Need add-ons or enterprise solutions?
            </p>
            <Link
              to="/pricing"
              className="text-accent hover:text-accent/80 font-medium transition-colors min-h-[44px] inline-flex items-center"
              style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1rem)" }}
            >
              View All Plans & Add-ons →
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default Pricing;

import { Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import { getFreePlan, getIndividualAnnualPlans, getTeamAnnualPlans, getIndividualLifetimePlans, getTeamLifetimePlans } from "@/config/plans";
import { PricingCard } from "@/components/pricing/PricingCard";
import { LtdScarcityBadge } from "@/components/pricing/LtdScarcityBadge";
const Pricing = () => {
  const freePlan = getFreePlan();
  const individualAnnualPlans = getIndividualAnnualPlans();
  const teamAnnualPlans = getTeamAnnualPlans();
  const individualLifetimePlans = getIndividualLifetimePlans();
  const teamLifetimePlans = getTeamLifetimePlans();
  return <TooltipProvider>
      <section id="pricing" className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <AnimatedSection delay={0} className="text-center mb-6 sm:mb-8 md:mb-10">
            <span className="section-badge mb-4">
              
              Simple Pricing
            </span>
            <h2 className="font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
              Start free, upgrade when you need more. Annual plans and lifetime deals available.
            </p>
          </AnimatedSection>

          {/* Plan Category Tabs */}
          <AnimatedSection delay={100}>
            <Tabs defaultValue="lifetime" className="w-full">
              <TabsList className="tabs-3d grid w-full max-w-2xl mx-auto grid-cols-3 mb-6 sm:mb-8">
                <TabsTrigger value="lifetime" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span className="hidden xs:inline">Lifetime Deals</span>
                  <span className="xs:hidden">Lifetime</span>
                </TabsTrigger>
                <TabsTrigger value="individual" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  
                  Individual
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  
                  Teams
                </TabsTrigger>
              </TabsList>

              {/* Individual Annual Plans */}
              <TabsContent value="individual" className="mt-6 sm:mt-8">
                <div className="text-center mb-4 sm:mb-6">
                  <p className="text-muted-foreground text-sm sm:text-base">Annual plans for individual users</p>
                </div>
                {/* Horizontal scroll on mobile/tablet, grid on desktop */}
                <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:max-w-5xl lg:mx-auto lg:items-stretch max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-4 max-lg:-mx-4 max-lg:px-4 max-lg:snap-x max-lg:snap-mandatory scrollbar-hide">
                  <AnimatedElement delay={0}>
                    <div className="max-lg:min-w-[240px] max-lg:max-w-[260px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[280px] md:max-lg:max-w-[300px]">
                      <PricingCard plan={freePlan} />
                    </div>
                  </AnimatedElement>
                  {individualAnnualPlans.map((plan, index) => <AnimatedElement key={plan.id} delay={(index + 1) * 100}>
                      <div className="max-lg:min-w-[240px] max-lg:max-w-[260px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[280px] md:max-lg:max-w-[300px]">
                        <PricingCard plan={plan} />
                      </div>
                    </AnimatedElement>)}
                </div>
              </TabsContent>

              {/* Team Annual Plans */}
              <TabsContent value="team" className="mt-6 sm:mt-8">
                <div className="text-center mb-4 sm:mb-6">
                  <p className="text-muted-foreground text-sm sm:text-base">Annual plans for teams</p>
                </div>
                {/* Horizontal scroll on mobile/tablet */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:max-w-4xl lg:mx-auto lg:items-stretch max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-4 max-lg:-mx-4 max-lg:px-4 max-lg:snap-x max-lg:snap-mandatory scrollbar-hide">
                  {teamAnnualPlans.map((plan, index) => <AnimatedElement key={plan.id} delay={index * 100}>
                      <div className="max-lg:min-w-[240px] max-lg:max-w-[260px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[280px] md:max-lg:max-w-[300px]">
                        <PricingCard plan={plan} showSeats />
                      </div>
                    </AnimatedElement>)}
                </div>
              </TabsContent>

              {/* Lifetime Deals */}
              <TabsContent value="lifetime" className="mt-6 sm:mt-8">
                {/* LTD Scarcity Badge */}
                <div className="flex justify-center mb-6 sm:mb-8">
                  <LtdScarcityBadge />
                </div>

                {/* Individual Lifetime */}
                <div className="mb-8 sm:mb-10">
                  <h3 className="text-base sm:text-lg font-semibold text-center mb-4 sm:mb-6 text-muted-foreground">Individual Lifetime Deals</h3>
                  {/* Horizontal scroll on mobile/tablet */}
                  <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:max-w-4xl lg:mx-auto lg:items-stretch max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-4 max-lg:-mx-4 max-lg:px-4 max-lg:snap-x max-lg:snap-mandatory scrollbar-hide">
                    {individualLifetimePlans.map((plan, index) => <AnimatedElement key={plan.id} delay={index * 100}>
                        <div className="relative max-lg:min-w-[240px] max-lg:max-w-[260px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[280px] md:max-lg:max-w-[300px]">
                          {/* LTD Glow Effect */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                          <PricingCard plan={plan} />
                        </div>
                      </AnimatedElement>)}
                  </div>
                </div>

                {/* Team Lifetime */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-center mb-4 sm:mb-6 text-muted-foreground">Team Lifetime Deals</h3>
                  {/* Horizontal scroll on mobile/tablet */}
                  <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:max-w-4xl lg:mx-auto lg:items-stretch max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-4 max-lg:-mx-4 max-lg:px-4 max-lg:snap-x max-lg:snap-mandatory scrollbar-hide">
                    {teamLifetimePlans.map((plan, index) => <AnimatedElement key={plan.id} delay={index * 100}>
                        <div className="relative max-lg:min-w-[240px] max-lg:max-w-[260px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[280px] md:max-lg:max-w-[300px]">
                          {/* LTD Glow Effect */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                          <PricingCard plan={plan} showSeats />
                        </div>
                      </AnimatedElement>)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </AnimatedSection>

          {/* View All Plans CTA */}
          <AnimatedSection delay={300} className="text-center mt-8 sm:mt-10 md:mt-12">
            <></>
          </AnimatedSection>
        </div>
      </section>
    </TooltipProvider>;
};
export default Pricing;
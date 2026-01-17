import { Zap, Info, HardDrive, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getFreePlan,
  getIndividualAnnualPlans, 
  getTeamAnnualPlans, 
  getIndividualLifetimePlans,
  getTeamLifetimePlans,
  getActiveAddons,
  formatStorage 
} from "@/config/plans";
import { PricingCard } from "@/components/pricing/PricingCard";
import { AddonCard } from "@/components/pricing/AddonCard";
import { LtdScarcityBadge } from "@/components/pricing/LtdScarcityBadge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useLtdInventory } from "@/hooks/useLtdInventory";
import { usePricingRefresh } from "@/hooks/usePageRefresh";

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { soldOut, totalSeats, remainingSeats } = useLtdInventory();

  // Refresh pricing data on page mount
  usePricingRefresh();

  // Get plans by category
  const freePlan = getFreePlan();
  const individualAnnualPlans = getIndividualAnnualPlans();
  const teamAnnualPlans = getTeamAnnualPlans();
  const individualLifetimePlans = getIndividualLifetimePlans();
  const teamLifetimePlans = getTeamLifetimePlans();
  const addons = getActiveAddons();

  return (
    <TooltipProvider>
      <div className="min-h-screen liquid-bg">
        <div className="noise-overlay" />
        <Navbar />
        <main className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <span className="section-badge mb-4">
                <Zap className="h-4 w-4" />
                Simple Pricing
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Choose Your Plan
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
                Start free, upgrade when you need more. Annual plans and lifetime deals available.
              </p>
            </div>

            {/* Plan Category Tabs */}
            <Tabs defaultValue="individual" className="mb-8 sm:mb-10 md:mb-12">
              <TabsList className="tabs-3d grid w-full max-w-2xl mx-auto grid-cols-3 h-auto p-1">
                <TabsTrigger value="individual" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2 sm:py-2.5">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 hidden xs:block" />
                  Individual
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2 sm:py-2.5">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 hidden xs:block" />
                  Teams
                </TabsTrigger>
                <TabsTrigger value="lifetime" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2 sm:py-2.5">
                  <span className="hidden xs:inline">Lifetime Deals</span>
                  <span className="xs:hidden">Lifetime</span>
                </TabsTrigger>
              </TabsList>

              {/* Individual Annual Plans */}
              <TabsContent value="individual" className="mt-6 sm:mt-8">
                <div className="text-center mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base text-muted-foreground">Annual plans for individual users</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
                  <PricingCard plan={freePlan} />
                  {individualAnnualPlans.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </TabsContent>

              {/* Team Annual Plans */}
              <TabsContent value="team" className="mt-6 sm:mt-8">
                <div className="text-center mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base text-muted-foreground">Annual plans for teams</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto items-stretch">
                  {teamAnnualPlans.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} showSeats />
                  ))}
                </div>
              </TabsContent>

              {/* Lifetime Deals - Highlighted */}
              <TabsContent value="lifetime" className="mt-6 sm:mt-8">
                {/* LTD Scarcity Badge */}
                <div className="flex justify-center mb-6 sm:mb-8">
                  <LtdScarcityBadge />
                </div>

                {/* Individual Lifetime */}
                <div className="mb-8 sm:mb-10 md:mb-12">
                  <h3 className="text-lg sm:text-xl font-semibold text-center mb-4 sm:mb-6">Individual Lifetime Deals</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto items-stretch">
                    {individualLifetimePlans.map((plan) => (
                      <div key={plan.id} className="relative">
                        {/* LTD Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                        <PricingCard plan={plan} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Lifetime */}
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-center mb-4 sm:mb-6">Team Lifetime Deals</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto items-stretch">
                    {teamLifetimePlans.map((plan) => (
                      <div key={plan.id} className="relative">
                        {/* LTD Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />
                        <PricingCard plan={plan} showSeats />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Add-ons Section */}
            <div className="mt-12 sm:mt-16 md:mt-20">
              <div className="text-center mb-6 sm:mb-8 md:mb-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
                  Storage & Board Add-Ons
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-2">
                  Expand your workspace with stackable add-ons. Each add-on increases both storage and boards.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 max-w-5xl mx-auto">
                {addons.map((addon) => (
                  <AddonCard key={addon.id} addon={addon} />
                ))}
              </div>
            </div>

            {/* Storage Info */}
            <div className="mt-10 sm:mt-12 md:mt-16 max-w-2xl mx-auto px-2">
              <div className="premium-card-wrapper">
                <div className="premium-card-gradient" />
                <div className="premium-card-content p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-accent/10 border border-accent/20 shrink-0">
                      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">About Storage</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Your storage quota covers all your data including messages, block configurations, 
                        system prompts, and any files you upload. Storage usage is calculated in real-time 
                        and displayed in your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise CTA */}
            <div className="mt-10 sm:mt-12 md:mt-16 text-center pb-4">
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Need a custom solution for your organization?
              </p>
              <a 
                href="mailto:sales@multiblock.ai?subject=Enterprise%20Plan%20Inquiry"
                className="text-sm sm:text-base text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Contact our sales team →
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  );
}

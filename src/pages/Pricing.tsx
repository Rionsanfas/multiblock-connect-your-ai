import { Zap, Info, HardDrive, Infinity, Clock } from "lucide-react";
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

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { soldOut, totalSeats, remainingSeats } = useLtdInventory();

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
        <main className="pt-32 pb-20 px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <span className="section-badge mb-4">
                <Zap className="h-4 w-4" />
                Simple Pricing
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Choose Your Plan
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade when you need more. Annual plans and lifetime deals available.
              </p>
            </div>

            {/* Plan Category Tabs */}
            <Tabs defaultValue="individual" className="mb-12">
              <TabsList className="tabs-3d grid w-full max-w-2xl mx-auto grid-cols-3">
                <TabsTrigger value="individual" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Individual
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Teams
                </TabsTrigger>
                <TabsTrigger value="lifetime" className="flex items-center gap-2">
                  <Infinity className="h-4 w-4" />
                  Lifetime
                </TabsTrigger>
              </TabsList>

              {/* Individual Annual Plans */}
              <TabsContent value="individual" className="mt-8">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">Annual plans for individual users</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
                  <PricingCard plan={freePlan} />
                  {individualAnnualPlans.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </TabsContent>

              {/* Team Annual Plans */}
              <TabsContent value="team" className="mt-8">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">Annual plans for teams</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                  {teamAnnualPlans.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} showSeats />
                  ))}
                </div>
              </TabsContent>

              {/* Lifetime Deals - Highlighted */}
              <TabsContent value="lifetime" className="mt-8">
                {/* LTD Scarcity Badge */}
                <div className="flex justify-center mb-8">
                  <LtdScarcityBadge />
                </div>

                {/* Individual Lifetime */}
                <div className="mb-12">
                  <h3 className="text-xl font-semibold text-center mb-6">Individual Lifetime Deals</h3>
                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
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
                  <h3 className="text-xl font-semibold text-center mb-6">Team Lifetime Deals</h3>
                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
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
            <div className="mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Storage & Board Add-Ons
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Expand your workspace with stackable add-ons. Each add-on increases both storage and boards.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
                {addons.map((addon) => (
                  <AddonCard key={addon.id} addon={addon} />
                ))}
              </div>
            </div>

            {/* Storage Info */}
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="premium-card-wrapper">
                <div className="premium-card-gradient" />
                <div className="premium-card-content p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                      <Info className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">About Storage</h3>
                      <p className="text-sm text-muted-foreground">
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
            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">
                Need a custom solution for your organization?
              </p>
              <a 
                href="mailto:sales@multiblock.ai?subject=Enterprise%20Plan%20Inquiry"
                className="text-accent hover:text-accent/80 font-medium transition-colors"
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

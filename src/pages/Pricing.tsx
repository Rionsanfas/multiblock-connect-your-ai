import { Info } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getFreePlan, getPaidPlans, getActiveAddons } from "@/config/plans";
import { PricingCard } from "@/components/pricing/PricingCard";
import { AddonCard } from "@/components/pricing/AddonCard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useLtdInventory } from "@/hooks/useLtdInventory";
import { usePricingRefresh } from "@/hooks/usePageRefresh";
export default function Pricing() {
  const navigate = useNavigate();
  const {
    isAuthenticated
  } = useAuth();
  const {
    soldOut,
    totalSeats,
    remainingSeats
  } = useLtdInventory();
  usePricingRefresh();
  const freePlan = getFreePlan();
  const paidPlans = getPaidPlans();
  const addons = getActiveAddons();
  return <TooltipProvider>
      <div className="min-h-screen liquid-bg">
        <Navbar />
        <main className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <span className="section-badge mb-4">
                Simple Pricing
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Choose Your Plan
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
                Start free, upgrade when you need more. Annual plans and lifetime deals available.
              </p>
            </div>

            {/* All plans as flat grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 max-w-7xl mx-auto items-stretch mb-12 sm:mb-16">
              <PricingCard plan={freePlan} />
              {paidPlans.map(plan => <div key={plan.id} className={plan.billing_period === 'lifetime' ? 'relative' : ''}>
                  {plan.billing_period === 'lifetime' && <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-transparent to-accent/30 rounded-2xl blur-lg opacity-50" />}
                  <PricingCard plan={plan} showSeats={plan.seats > 1} />
                </div>)}
            </div>

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
                {addons.map(addon => <AddonCard key={addon.id} addon={addon} />)}
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

            {/* Contact CTA */}
            <div className="mt-10 sm:mt-12 md:mt-16 text-center pb-4">
              
              
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </TooltipProvider>;
}
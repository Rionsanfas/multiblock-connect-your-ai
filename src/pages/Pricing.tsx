import { Zap, Info, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRICING_PLANS, formatStorage, formatPlanPrice } from "@/config/plans";
import { PricingCard } from "@/components/pricing/PricingCard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Board add-ons (keeping for future use)
const boardAddons = [
  { id: 'addon-5', name: '5 Extra Boards', boards: 5, storage_mb: 500, price_cents: 500 },
  { id: 'addon-20', name: '20 Extra Boards', boards: 20, storage_mb: 2048, price_cents: 1500 },
  { id: 'addon-50', name: '50 Extra Boards', boards: 50, storage_mb: 5120, price_cents: 3000 },
  { id: 'addon-100', name: '100 Extra Boards', boards: 100, storage_mb: 10240, price_cents: 5000 },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Filter plans by category
  const individualPlans = PRICING_PLANS.filter(p => 
    p.is_active && (p.tier === 'free' || p.tier === 'starter' || p.tier === 'pro')
  );
  const teamPlans = PRICING_PLANS.filter(p => 
    p.is_active && (p.tier === 'team' || p.tier === 'enterprise')
  );

  const handleSelectAddon = (addonId: string) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    toast.info("Add-ons coming soon", {
      description: "Board add-ons will be available in a future update.",
    });
  };

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
                Start free, upgrade when you need more. All paid plans are billed yearly.
              </p>
            </div>

            {/* Plan Type Tabs */}
            <Tabs defaultValue="individual" className="mb-12">
              <TabsList className="tabs-3d grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="team">Teams</TabsTrigger>
              </TabsList>

              {/* Individual Plans */}
              <TabsContent value="individual" className="mt-8">
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
                  {individualPlans.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </TabsContent>

              {/* Team Plans */}
              <TabsContent value="team" className="mt-8">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                  {teamPlans.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} showSeats />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Board Add-ons Section */}
            <div className="mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Need More Boards?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Expand your workspace with board add-ons. Each add-on includes extra storage.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {boardAddons.map((addon) => (
                  <div key={addon.id} className="premium-card-wrapper">
                    <div className="premium-card-gradient" />
                    <div className="premium-card-content p-5 text-center">
                      <div className="text-3xl font-bold text-accent mb-1">
                        +{addon.boards}
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">boards</div>
                      
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4">
                        <HardDrive className="h-3 w-3" />
                        +{formatStorage(addon.storage_mb)}
                      </div>

                      <div className="text-2xl font-bold mb-3">
                        ${addon.price_cents / 100}
                      </div>

                      <Button
                        variant="pill-outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleSelectAddon(addon.id)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
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

            {/* FAQ or Enterprise CTA */}
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

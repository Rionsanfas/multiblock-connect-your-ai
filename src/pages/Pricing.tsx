import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Info, Plus, HardDrive, Users, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import { pricingPlans, boardAddons } from "@/mocks/seed";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper to format storage
const formatStorage = (mb: number): string => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  }
  return `${mb} MB`;
};

// Helper to format price
const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(0)}`;
};

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppStore();
  const [selectedTab, setSelectedTab] = useState<"individual" | "team">("individual");

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    // TODO: Replace with Supabase checkout integration
    toast.success("Redirecting to checkout...");
    navigate(`/checkout?plan=${planId}`);
  };

  const handleSelectAddon = (addonId: string) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    // TODO: Replace with Supabase addon purchase
    toast.success("Adding to your plan...");
  };

  const individualPlans = pricingPlans.filter((p) => p.tier === "free" || p.tier === "pro");
  const teamPlans = pricingPlans.filter((p) => p.tier === "team");

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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade when you need more boards and storage. All plans include yearly billing.
              </p>
            </div>

            {/* Plan Type Tabs */}
            <Tabs
              value={selectedTab}
              onValueChange={(v) => setSelectedTab(v as "individual" | "team")}
              className="mb-12"
            >
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="team">Teams</TabsTrigger>
              </TabsList>

              {/* Individual Plans */}
              <TabsContent value="individual" className="mt-8">
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
                  {individualPlans.map((plan) => (
                    <div key={plan.id} className={`premium-card-wrapper ${plan.highlight ? "scale-105 z-10" : ""}`}>
                      <div className="premium-card-gradient" />
                      <div className="premium-card-content p-6 relative">
                        {plan.badge && (
                          <div
                            className={`absolute -top-0 left-1/2 -translate-x-1/2 px-4 py-1.5 text-xs font-semibold rounded-full z-10 ${
                              plan.highlight
                                ? "bg-accent text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.4)]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {plan.badge}
                          </div>
                        )}

                        <h3
                          className={`text-2xl font-bold mb-3 ${plan.highlight ? "plan-title-animated" : "text-foreground"}`}
                        >
                          {plan.name}
                        </h3>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold">{formatPrice(plan.price_cents)}</span>
                            {plan.price_cents > 0 && <span className="text-muted-foreground">/year</span>}
                          </div>
                        </div>

                        {/* Key Stats */}
                        <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border/30">
                          <div className="flex items-center gap-2 text-sm">
                            <LayoutGrid className="h-4 w-4 text-accent" />
                            <span>
                              {plan.boards} board{plan.boards > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Plus className="h-4 w-4 text-accent" />
                            <span>
                              {plan.blocks_per_board === "unlimited" ? "Unlimited" : plan.blocks_per_board} blocks/board
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <HardDrive className="h-4 w-4 text-accent" />
                            <span>{formatStorage(plan.storage_mb)} storage</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Storage covers messages, blocks, and uploaded files</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 mb-6">
                          {plan.features.slice(3).map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handleSelectPlan(plan.id)}
                          className="w-full"
                          variant={plan.highlight ? "pill-accent" : "pill-outline"}
                          size="lg"
                        >
                          {plan.price_cents === 0 ? "Get Started Free" : "Subscribe Now"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Team Plans */}
              <TabsContent value="team" className="mt-8">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
                  {teamPlans.map((plan) => (
                    <div key={plan.id} className={`premium-card-wrapper ${plan.highlight ? "scale-105 z-10" : ""}`}>
                      <div className="premium-card-gradient" />
                      <div className="premium-card-content p-6 relative">
                        {plan.badge && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-full shadow-[0_0_20px_hsl(var(--accent)/0.4)]">
                            {plan.badge}
                          </div>
                        )}

                        <h3
                          className={`text-2xl font-bold mb-3 ${plan.highlight ? "plan-title-animated" : "text-foreground"}`}
                        >
                          {plan.name}
                        </h3>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold">{formatPrice(plan.price_cents)}</span>
                            <span className="text-muted-foreground">/year</span>
                          </div>
                        </div>

                        {/* Key Stats */}
                        <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border/30">
                          <div className="flex items-center gap-2 text-sm">
                            <LayoutGrid className="h-4 w-4 text-accent" />
                            <span>{plan.boards} boards</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Plus className="h-4 w-4 text-accent" />
                            <span>Unlimited blocks/board</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-accent" />
                            <span>{plan.seats} team seats</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <HardDrive className="h-4 w-4 text-accent" />
                            <span>{formatStorage(plan.storage_mb)} storage</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Storage covers messages, blocks, and uploaded files</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 mb-6">
                          {plan.features.slice(4).map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handleSelectPlan(plan.id)}
                          className="w-full"
                          variant="pill-accent"
                          size="lg"
                        >
                          Subscribe Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Board Add-ons Section */}
            <div className="mt-20">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Need More Boards?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Expand your workspace with board add-ons. Each add-on includes extra storage.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {boardAddons.map((addon) => (
                  <div key={addon.id} className="premium-card-wrapper">
                    <div className="premium-card-gradient" />
                    <div className="premium-card-content p-5 text-center">
                      <div className="text-3xl font-bold text-accent mb-1">+{addon.boards}</div>
                      <div className="text-sm text-muted-foreground mb-3">boards</div>

                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4">
                        <HardDrive className="h-3 w-3" />+{formatStorage(addon.storage_mb)}
                      </div>

                      <div className="text-2xl font-bold mb-3">{formatPrice(addon.price_cents)}</div>

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
                        Your storage quota covers all your data including messages, block configurations, system
                        prompts, and any files you upload. Storage usage is calculated in real-time and displayed in
                        your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  );
}

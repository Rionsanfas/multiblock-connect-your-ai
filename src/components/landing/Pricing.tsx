import { Check, Info, HardDrive, Users, LayoutGrid, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { pricingPlans } from "@/mocks/seed";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const Pricing = () => {
  // Show individual plans on landing page
  const displayPlans = pricingPlans.filter(p => p.tier === 'free' || p.tier === 'pro');

  return (
    <TooltipProvider>
      <section id="pricing" className="py-16 sm:py-20 md:py-24 relative">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <span className="section-badge mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-3 sm:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-2 sm:px-0">
              Start free, upgrade when you need more. Yearly billing for best value.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
            {displayPlans.map((plan) => (
              <div
                key={plan.id}
                className={`glass-card-hover p-5 sm:p-6 md:p-8 relative ${
                  plan.highlight ? 'border-accent/50 bg-card/70' : ''
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                    plan.highlight 
                      ? 'bg-accent text-background' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {plan.badge}
                  </div>
                )}
                
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">
                      {formatPrice(plan.price_cents)}
                    </span>
                    {plan.price_cents > 0 && (
                      <span className="text-muted-foreground text-xs sm:text-sm">/year</span>
                    )}
                  </div>
                </div>

                {/* Key Stats */}
                <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                    <LayoutGrid size={14} className="text-accent flex-shrink-0 sm:hidden" />
                    <LayoutGrid size={16} className="text-accent flex-shrink-0 hidden sm:block" />
                    {plan.boards} board{plan.boards > 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                    <Plus size={14} className="text-accent flex-shrink-0 sm:hidden" />
                    <Plus size={16} className="text-accent flex-shrink-0 hidden sm:block" />
                    {plan.blocks_per_board === 'unlimited' ? 'Unlimited' : plan.blocks_per_board} blocks/board
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                    <HardDrive size={14} className="text-accent flex-shrink-0 sm:hidden" />
                    <HardDrive size={16} className="text-accent flex-shrink-0 hidden sm:block" />
                    {formatStorage(plan.storage_mb)} storage
                    <Tooltip>
                      <TooltipTrigger className="min-w-[24px] min-h-[24px] flex items-center justify-center">
                        <Info size={12} className="text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">Storage covers messages, blocks, and uploaded files</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {plan.seats > 1 && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                      <Users size={14} className="text-accent flex-shrink-0 sm:hidden" />
                      <Users size={16} className="text-accent flex-shrink-0 hidden sm:block" />
                      {plan.seats} team seats
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.slice(3).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-foreground">
                      <Check size={14} className="text-accent flex-shrink-0 sm:hidden" />
                      <Check size={16} className="text-accent flex-shrink-0 hidden sm:block" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/pricing"
                  className={`block text-center w-full py-3 rounded-full font-medium transition-all duration-300 min-h-[48px] flex items-center justify-center text-sm sm:text-base ${
                    plan.highlight
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {plan.price_cents === 0 ? "Get Started" : "View Plans"}
                </Link>
              </div>
            ))}
          </div>

          {/* Team Plans CTA */}
          <div className="text-center mt-8 sm:mt-10">
            <p className="text-sm sm:text-base text-muted-foreground mb-3">
              Need team features?
            </p>
            <Link 
              to="/pricing" 
              className="text-accent hover:text-accent/80 font-medium transition-colors text-sm sm:text-base min-h-[44px] inline-flex items-center"
            >
              View Team Plans →
            </Link>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default Pricing;

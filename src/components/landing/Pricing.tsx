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
      <section 
        id="pricing" 
        className="relative"
        style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
      >
        {/* Container */}
        <div 
          className="w-full max-w-[1200px] mx-auto"
          style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
        >
          {/* Header */}
          <div 
            className="text-center"
            style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}
          >
            <span className="section-badge mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Pricing
            </span>
            <h2 
              className="font-bold text-foreground mt-4 text-wrap-balance"
              style={{ 
                fontSize: "clamp(1.5rem, 1rem + 2.5vw, 3rem)",
                marginBottom: "clamp(12px, 2vw, 16px)",
              }}
            >
              Simple, Transparent Pricing
            </h2>
            <p 
              className="text-muted-foreground max-w-xl mx-auto text-break"
              style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
            >
              Start free, upgrade when you need more. Yearly billing for best value.
            </p>
          </div>

          {/* 
            Pricing Cards - responsive grid with auto-fit.
            Max-width centers cards on large screens.
          */}
          <div 
            className="grid max-w-5xl mx-auto align-start"
            style={{ 
              gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
              gap: "clamp(16px, 2.5vw, 24px)",
            }}
          >
            {displayPlans.map((plan) => (
              <div
                key={plan.id}
                className={`glass-card-hover relative ${
                  plan.highlight ? 'border-accent/50 bg-card/70' : ''
                }`}
                style={{ padding: "clamp(20px, 3vw, 32px)" }}
              >
                {plan.badge && (
                  <div 
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full font-medium ${
                      plan.highlight 
                        ? 'bg-accent text-background' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                    style={{ 
                      padding: "4px 12px",
                      fontSize: "clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}
                
                <div style={{ marginBottom: "clamp(16px, 2.5vw, 24px)" }}>
                  <h3 
                    className="font-medium text-muted-foreground"
                    style={{ 
                      fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1.125rem)",
                      marginBottom: "8px",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span 
                      className="font-bold text-foreground"
                      style={{ fontSize: "clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem)" }}
                    >
                      {formatPrice(plan.price_cents)}
                    </span>
                    {plan.price_cents > 0 && (
                      <span 
                        className="text-muted-foreground"
                        style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)" }}
                      >
                        /year
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Stats */}
                <div 
                  className="rounded-lg bg-muted/20"
                  style={{ 
                    padding: "clamp(12px, 2vw, 16px)",
                    marginBottom: "clamp(16px, 2.5vw, 24px)",
                  }}
                >
                  <div 
                    className="flex items-center gap-2 text-foreground"
                    style={{ 
                      fontSize: "clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)",
                      marginBottom: "clamp(8px, 1vw, 12px)",
                    }}
                  >
                    <LayoutGrid className="text-accent flex-shrink-0" style={{ width: "clamp(14px, 1.5vw, 16px)", height: "clamp(14px, 1.5vw, 16px)" }} />
                    {plan.boards} board{plan.boards > 1 ? 's' : ''}
                  </div>
                  <div 
                    className="flex items-center gap-2 text-foreground"
                    style={{ 
                      fontSize: "clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)",
                      marginBottom: "clamp(8px, 1vw, 12px)",
                    }}
                  >
                    <Plus className="text-accent flex-shrink-0" style={{ width: "clamp(14px, 1.5vw, 16px)", height: "clamp(14px, 1.5vw, 16px)" }} />
                    {plan.blocks_per_board === 'unlimited' ? 'Unlimited' : plan.blocks_per_board} blocks/board
                  </div>
                  <div 
                    className="flex items-center gap-2 text-foreground"
                    style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)" }}
                  >
                    <HardDrive className="text-accent flex-shrink-0" style={{ width: "clamp(14px, 1.5vw, 16px)", height: "clamp(14px, 1.5vw, 16px)" }} />
                    {formatStorage(plan.storage_mb)} storage
                    <Tooltip>
                      <TooltipTrigger className="min-w-[24px] min-h-[24px] flex items-center justify-center">
                        <Info style={{ width: "12px", height: "12px" }} className="text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs" style={{ fontSize: "clamp(0.625rem, 0.6rem + 0.1vw, 0.75rem)" }}>
                          Storage covers messages, blocks, and uploaded files
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {plan.seats > 1 && (
                    <div 
                      className="flex items-center gap-2 text-foreground"
                      style={{ 
                        fontSize: "clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)",
                        marginTop: "clamp(8px, 1vw, 12px)",
                      }}
                    >
                      <Users className="text-accent flex-shrink-0" style={{ width: "clamp(14px, 1.5vw, 16px)", height: "clamp(14px, 1.5vw, 16px)" }} />
                      {plan.seats} team seats
                    </div>
                  )}
                </div>

                <ul style={{ marginBottom: "clamp(20px, 3vw, 32px)" }}>
                  {plan.features.slice(3).map((feature) => (
                    <li 
                      key={feature} 
                      className="flex items-center gap-2 text-foreground text-break"
                      style={{ 
                        fontSize: "clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)",
                        marginBottom: "clamp(8px, 1vw, 12px)",
                      }}
                    >
                      <Check className="text-accent flex-shrink-0" style={{ width: "clamp(14px, 1.5vw, 16px)", height: "clamp(14px, 1.5vw, 16px)" }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/pricing"
                  className={`block text-center w-full rounded-full font-medium transition-all duration-300 ${
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
          <div 
            className="text-center"
            style={{ marginTop: "clamp(32px, 4vw, 40px)" }}
          >
            <p 
              className="text-muted-foreground"
              style={{ 
                fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1rem)",
                marginBottom: "12px",
              }}
            >
              Need team features?
            </p>
            <Link 
              to="/pricing" 
              className="text-accent hover:text-accent/80 font-medium transition-colors min-h-[44px] inline-flex items-center"
              style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1rem)" }}
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
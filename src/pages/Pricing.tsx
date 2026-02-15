import { useState } from "react";
import { Check, X, Info, Shield, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useBilling } from "@/hooks/useBilling";
import { PricingButton } from "@/components/pricing/PricingButton";
import {
  getFreePlan,
  getProMonthlyPlan,
  getProAnnualPlan,
  getTeamMonthlyPlan,
  getTeamAnnualPlan,
  formatStorage,
  type PlanConfig,
} from "@/config/plans";

// ============================================
// PRICING CARD (Reference: image 1 layout)
// Price → Plan name → Description → Button → Features
// ============================================

function PricingCard({ plan }: { plan: PlanConfig }) {
  const isFree = plan.tier === 'free';
  const isHighlight = plan.highlight;

  return (
    <div className={`relative flex flex-col h-full rounded-2xl transition-all duration-500 overflow-hidden ${
      isHighlight
        ? 'pricing-card-highlight'
        : 'pricing-card-default'
    }`}>
      {/* Badge */}
      {plan.badge && (
        <div className={`absolute -top-px left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap z-10 ${
          isHighlight
            ? 'bg-accent text-accent-foreground'
            : 'bg-muted text-muted-foreground'
        }`}>
          {plan.badge}
        </div>
      )}

      <div className="p-5 sm:p-7 flex flex-col h-full">
        {/* Price (large, top) */}
        <div className="mb-4 mt-2">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight">
              {plan.price_cents === 0 ? '$0' : `$${(plan.price_cents / 100).toFixed(0)}`}
            </span>
            {plan.price_cents > 0 && (
              <span className="text-sm text-muted-foreground font-medium">
                / {plan.billing_period === 'yearly' ? 'year' : 'Per Month'}
              </span>
            )}
          </div>
          {plan.billing_period === 'yearly' && plan.annual_savings && (
            <p className="text-xs text-green-500 font-medium mt-1.5">
              Save ${plan.annual_savings} vs monthly
            </p>
          )}
          {plan.trial_days && plan.billing_period === 'monthly' && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {plan.trial_days}-day free trial
            </p>
          )}
        </div>

        {/* Plan Name */}
        <h3 className="text-lg sm:text-xl font-bold mb-1">{plan.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
          {plan.description}
        </p>

        {/* CTA Button */}
        <div className="mb-6">
          <PricingButton plan={plan} variant={isHighlight ? 'primary' : 'secondary'} />
          {!isFree && plan.trial_days && plan.billing_period === 'monthly' && (
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              No credit card required
            </p>
          )}
        </div>

        {/* Features label */}
        <p className="text-xs font-semibold text-foreground mb-3 tracking-wide uppercase">
          Features:
        </p>

        {/* Features List */}
        <ul className="space-y-2.5 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm">
              <div className="mt-0.5 check-icon-3d">
                <Check className="h-2.5 w-2.5 text-accent" />
              </div>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================
// COMPARISON TABLE (Reference: image 2 layout)
// Clean grid with checkmarks & alternating rows
// ============================================

interface ComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
}

function FeatureComparisonTable() {
  const rows: ComparisonRow[] = [
    { feature: 'Boards', free: '1', pro: '50', team: '50' },
    { feature: 'Blocks per Board', free: '3', pro: 'Unlimited', team: 'Unlimited' },
    { feature: 'Storage', free: '100 MB', pro: '5 GB', team: '20 GB' },
    { feature: 'Messages per Day', free: '50', pro: 'Unlimited', team: 'Unlimited' },
    { feature: 'API Keys (BYOK)', free: '3', pro: 'Unlimited', team: 'Unlimited' },
    { feature: 'Team Seats', free: false, pro: false, team: 'Up to 10' },
    { feature: 'All AI Models', free: true, pro: true, team: true },
    { feature: 'Board Memory', free: false, pro: true, team: true },
    { feature: 'Priority Support', free: false, pro: true, team: true },
    { feature: 'Data Export', free: false, pro: true, team: true },
    { feature: 'Shared Boards', free: false, pro: false, team: true },
    { feature: 'Admin Controls', free: false, pro: false, team: true },
    { feature: 'Audit Logs', free: false, pro: false, team: true },
  ];

  const renderCell = (value: string | boolean) => {
    if (value === true) {
      return (
        <div className="flex justify-center">
          <div className="check-icon-3d" style={{ width: 22, height: 22 }}>
            <Check className="h-3 w-3 text-accent" />
          </div>
        </div>
      );
    }
    if (value === false) {
      return (
        <div className="flex justify-center">
          <div className="x-icon-3d" style={{ width: 22, height: 22 }}>
            <X className="h-3 w-3 text-muted-foreground/40" />
          </div>
        </div>
      );
    }
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/30">
            <th className="text-left py-4 pr-4 text-sm font-semibold text-muted-foreground">Features</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-muted-foreground">Free</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-accent">Pro</th>
            <th className="py-4 pl-4 text-center text-sm font-semibold text-muted-foreground">Pro Team</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.feature}
              className={`border-b border-border/10 ${i % 2 === 0 ? 'bg-muted/5' : ''}`}
            >
              <td className="py-3 pr-4 text-sm font-medium text-foreground">{row.feature}</td>
              <td className="py-3 px-4 text-center">{renderCell(row.free)}</td>
              <td className="py-3 px-4 text-center">{renderCell(row.pro)}</td>
              <td className="py-3 pl-4 text-center">{renderCell(row.team)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// API COST SECTION
// ============================================

function ApiCostSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Multiblock uses <strong className="text-foreground">Bring Your Own Key (BYOK)</strong>. You pay AI providers (OpenAI, Anthropic, etc.) directly for API usage.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Light use', desc: '~10 conversations', cost: '~$3/mo' },
          { label: 'Moderate use', desc: '~50 conversations', cost: '~$15/mo' },
          { label: 'Heavy use', desc: '100+ conversations', cost: '~$35/mo' },
        ].map((ex) => (
          <div key={ex.label} className="p-3 rounded-lg bg-muted/20 border border-border/20">
            <p className="text-xs font-medium mb-0.5">{ex.label}</p>
            <p className="text-[10px] text-muted-foreground mb-1">{ex.desc}</p>
            <p className="text-sm font-semibold text-accent">{ex.cost}</p>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
        <p className="text-xs sm:text-sm">
          <span className="font-semibold text-green-500">Total example:</span>{' '}
          <span className="text-muted-foreground">
            $19/mo (Multiblock) + $15/mo (APIs) = <strong className="text-foreground">$34/mo</strong>
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          vs ChatGPT Plus ($20) + Claude Pro ($20) = $40/mo —{' '}
          <strong className="text-green-500">you save $6/mo</strong> + get unlimited usage + persistent boards
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN PRICING PAGE
// ============================================

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { isAuthenticated } = useAuth();
  const { billing } = useBilling();

  const freePlan = getFreePlan();
  const proPlan = isAnnual ? getProAnnualPlan() : getProMonthlyPlan();
  const teamPlan = isAnnual ? getTeamAnnualPlan() : getTeamMonthlyPlan();

  const isGrandfathered = (billing as any)?.is_grandfathered === true;
  const grandfatheredPrice = (billing as any)?.grandfathered_price_cents;
  const grandfatheredPlan = (billing as any)?.grandfathered_plan_name;

  return (
    <TooltipProvider>
      <div className="min-h-screen liquid-bg">
        <Navbar />
        <main className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Grandfathered badge */}
            {isGrandfathered && grandfatheredPrice && (
              <div className="max-w-2xl mx-auto mb-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <Sparkles className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm">
                    <span className="font-semibold text-green-500">You're grandfathered!</span>{' '}
                    <span className="text-muted-foreground">
                      Your {grandfatheredPlan} plan at ${(grandfatheredPrice / 100).toFixed(0)}/year will never change.
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-8 sm:mb-10">
              <span className="section-badge mb-4">Pricing</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Our pricing plans
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade when you need more power.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8 sm:mb-10">
              <div className="inline-flex items-center rounded-full p-1 bg-card/60 border border-border/30 backdrop-blur-sm">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    !isAnnual
                      ? 'bg-foreground text-background shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                    isAnnual
                      ? 'bg-foreground text-background shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                  <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto items-stretch mb-16 sm:mb-20">
              <PricingCard plan={freePlan} />
              <PricingCard plan={proPlan} />
              <PricingCard plan={teamPlan} />
            </div>

            {/* Feature Comparison Table */}
            <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
                Compare Plans
              </h2>
              <div className="pricing-card-default rounded-2xl p-4 sm:p-6">
                <FeatureComparisonTable />
              </div>
            </div>

            {/* API Costs Section */}
            <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
              <details className="group">
                <summary className="flex items-center gap-3 cursor-pointer p-4 rounded-xl pricing-card-default transition-colors hover:border-border/40">
                  <Shield className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">What About API Costs?</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-4 sm:p-5 mt-2 rounded-xl bg-card/20 border border-border/10">
                  <ApiCostSection />
                </div>
              </details>
            </div>

            {/* Storage Info */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/20 border border-border/20">
                <Info className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-sm mb-1">About Storage</h3>
                  <p className="text-xs text-muted-foreground">
                    Storage covers messages, block configs, system prompts, and uploads.
                    Usage is tracked in real-time on your dashboard.
                  </p>
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

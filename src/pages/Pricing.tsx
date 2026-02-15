import { useState } from "react";
import { Check, Info, Zap, ArrowRight, Shield, MessageSquare, LayoutGrid, HardDrive, Users, Sparkles } from "lucide-react";
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
import {
  PRO_ANNUAL_SAVINGS,
  TEAM_ANNUAL_SAVINGS,
  TRIAL_DAYS,
} from "@/config/plan-constants";

function PricingCard({ plan, isAnnual }: { plan: PlanConfig; isAnnual?: boolean }) {
  const isFree = plan.tier === 'free';
  const isHighlight = plan.highlight;

  return (
    <div className={`relative flex flex-col h-full rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
      isHighlight
        ? 'border-accent/50 bg-card/60 shadow-[0_0_30px_-5px_hsl(var(--accent)/0.15)]'
        : 'border-border/30 bg-card/30'
    }`}>
      {plan.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
          isHighlight
            ? 'bg-accent text-accent-foreground'
            : 'bg-muted text-muted-foreground border border-border/30'
        }`}>
          {plan.badge}
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-lg sm:text-xl font-bold mt-2 mb-1">{plan.name}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">{plan.description}</p>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-3xl sm:text-4xl font-bold">
            {plan.price_cents === 0 ? '$0' : `$${(plan.price_cents / 100).toFixed(0)}`}
          </span>
          {plan.price_cents > 0 && (
            <span className="text-sm text-muted-foreground">
              /{plan.billing_period === 'yearly' ? 'year' : 'mo'}
            </span>
          )}
        </div>
        {plan.billing_period === 'yearly' && plan.annual_savings && (
          <p className="text-xs text-green-500 mt-1">
            Save ${plan.annual_savings} vs monthly
          </p>
        )}
        {plan.trial_days && plan.billing_period === 'monthly' && (
          <p className="text-xs text-muted-foreground mt-1">
            {plan.trial_days}-day free trial
          </p>
        )}
      </div>

      {/* Key Stats */}
      <div className="space-y-2.5 mb-5 p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/20">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <LayoutGrid className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          <span>{plan.boards} board{plan.boards !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <Zap className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          <span>{plan.blocks_per_board === 'unlimited' ? 'Unlimited' : plan.blocks_per_board} blocks/board</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <HardDrive className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          <span>{formatStorage(plan.storage_mb)} storage</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <MessageSquare className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          <span>{plan.messages_per_day === -1 ? 'Unlimited' : plan.messages_per_day} messages/day</span>
        </div>
        {plan.seats > 1 && (
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 text-accent flex-shrink-0" />
            <span>Up to {plan.seats} team seats</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs sm:text-sm">
            <Check className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <PricingButton plan={plan} variant={isHighlight ? 'primary' : 'secondary'} />

      {!isFree && plan.trial_days && plan.billing_period === 'monthly' && (
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          No credit card required to start
        </p>
      )}
    </div>
  );
}

function ComparisonTable() {
  const rows = [
    { feature: 'Price', chatgpt: '$20/month', multiblock: '$19/month + API' },
    { feature: 'Usage Limits', chatgpt: '40 msgs/3 hours', multiblock: 'Unlimited' },
    { feature: 'Models', chatgpt: 'GPT-4 only', multiblock: 'All models (BYOK)' },
    { feature: 'Data Ownership', chatgpt: 'Trains on data', multiblock: 'Your keys, your data' },
    { feature: 'Interface', chatgpt: 'Chat (resets)', multiblock: 'Persistent boards' },
    { feature: 'Context', chatgpt: 'Resets daily', multiblock: 'Compounds forever' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/30">
            <th className="text-left py-3 pr-4 text-muted-foreground font-medium">Feature</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">ChatGPT Plus</th>
            <th className="text-left py-3 pl-4 font-medium text-accent">Multiblock Pro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-border/10">
              <td className="py-2.5 pr-4 font-medium">{row.feature}</td>
              <td className="py-2.5 px-4 text-muted-foreground">{row.chatgpt}</td>
              <td className="py-2.5 pl-4 text-foreground">{row.multiblock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
              <span className="section-badge mb-4">Simple Pricing</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Choose Your Plan
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free, upgrade when you need more power.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !isAnnual
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isAnnual
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto items-stretch mb-12 sm:mb-16">
              <PricingCard plan={freePlan} isAnnual={isAnnual} />
              <PricingCard plan={proPlan} isAnnual={isAnnual} />
              <PricingCard plan={teamPlan} isAnnual={isAnnual} />
            </div>

            {/* API Costs Section */}
            <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
              <details className="group">
                <summary className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-card/30 border border-border/20 hover:border-border/40 transition-colors">
                  <Shield className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">What About API Costs?</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-4 sm:p-5 mt-2 rounded-xl bg-card/20 border border-border/10">
                  <ApiCostSection />
                </div>
              </details>
            </div>

            {/* Comparison Table */}
            <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
                How Multiblock Compares
              </h2>
              <div className="p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/20">
                <ComparisonTable />
              </div>
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

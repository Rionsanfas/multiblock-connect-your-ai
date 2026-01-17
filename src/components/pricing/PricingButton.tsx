/**
 * PricingButton - Smart button for pricing cards
 * 
 * Uses server-side Polar checkout (via edge function) with embed modal
 * - Not logged in → "Get Started" → /auth
 * - Current plan → "Current Plan" (disabled) - compared by PLAN ID, not tier
 * - Has checkout → Opens Polar embed modal
 * - Enterprise → "Contact Sales" → mailto
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBilling } from '@/hooks/useBilling';
import { PlanConfig, comparePlanTiers, PlanTier } from '@/config/plans';
import { PolarCheckoutButton } from './PolarCheckoutButton';
import { Spinner } from '@/components/ui/spinner';

interface PricingButtonProps {
  plan: PlanConfig;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function PricingButton({ plan, className = '', variant = 'secondary' }: PricingButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { billing, isLoading } = useBilling();
  
  // Get the actual plan ID from billing (e.g., "pro-team-annual", "starter-individual-annual")
  const currentPlanId = billing?.active_plan ?? 'free';
  
  // Button styles based on variant and state
  const getButtonClass = (disabled: boolean = false) => {
    const base = 'w-full rounded-full font-medium transition-all duration-500 ease-out py-3 px-6 text-center inline-flex items-center justify-center relative overflow-hidden';
    
    if (disabled) {
      return `${base} bg-muted text-muted-foreground cursor-not-allowed opacity-60`;
    }
    
    if (variant === 'primary' || plan.highlight) {
      return `${base} btn-pricing-shiny`;
    }
    
    return `${base} border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border hover:-translate-y-0.5`;
  };
  
  // Loading state - show spinner centered in button
  if (isLoading && isAuthenticated) {
    return (
      <button className={`${getButtonClass(true)} ${className}`} disabled aria-busy="true">
        <Spinner size="sm" className="text-muted-foreground" />
      </button>
    );
  }
  
  // Not logged in - redirect to auth
  if (!isAuthenticated) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          navigate('/auth');
        }}
        className={`${getButtonClass()} ${className}`}
      >
        Get Started
      </button>
    );
  }
  
  // Free plan - go to dashboard
  if (plan.tier === 'free') {
    // If user is on free plan, show "Current Plan"
    if (currentPlanId === 'free') {
      return (
        <button className={`${getButtonClass(true)} ${className}`} disabled>
          Current Plan
        </button>
      );
    }
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          navigate('/dashboard');
        }}
        className={`${getButtonClass()} ${className}`}
      >
        Get Started
      </button>
    );
  }
  
  // Enterprise - contact sales
  if (plan.tier === 'enterprise') {
    return (
      <a
        href="mailto:sales@multiblock.ai?subject=Enterprise%20Plan%20Inquiry"
        className={`${getButtonClass()} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        Contact Sales
      </a>
    );
  }
  
  // CRITICAL: Compare by PLAN ID, not tier
  // This ensures "pro-team-annual" matches exactly, not just "pro" tier
  const isCurrentPlan = currentPlanId === plan.id;
  
  if (isCurrentPlan) {
    return (
      <button className={`${getButtonClass(true)} ${className}`} disabled>
        Current Plan
      </button>
    );
  }
  
  // No checkout URL means no product configured in Polar
  if (!plan.checkout_url) {
    return (
      <button className={`${getButtonClass(true)} ${className}`} disabled>
        Coming Soon
      </button>
    );
  }
  
  // Determine if upgrade or downgrade by comparing tiers
  const currentTier = getTierFromPlanId(currentPlanId);
  const comparison = comparePlanTiers(currentTier, plan.tier);
  const buttonText = comparison < 0 ? 'Upgrade' : 'Switch Plan';
  
  return (
    <PolarCheckoutButton
      planKey={plan.id}
      className={`${getButtonClass()} ${className}`}
    >
      {buttonText}
    </PolarCheckoutButton>
  );
}

/**
 * Extract tier from plan ID
 * e.g., "pro-team-annual" → "pro", "starter-individual-annual" → "starter"
 */
function getTierFromPlanId(planId: string): PlanTier {
  if (planId === 'free') return 'free';
  if (planId === 'enterprise') return 'enterprise';
  if (planId.includes('pro')) return 'pro';
  if (planId.includes('starter')) return 'starter';
  return 'free';
}

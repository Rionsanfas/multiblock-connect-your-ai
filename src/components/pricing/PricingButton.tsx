/**
 * PricingButton - Smart button for pricing cards
 * 
 * Uses server-side Polar checkout (via edge function) with embed modal
 * - Not logged in → "Get Started" → /auth
 * - Current plan → "Current Plan" (disabled)
 * - Has checkout → Opens Polar embed modal
 * - Enterprise → "Contact Sales" → mailto
 */

import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { PlanConfig, comparePlanTiers, PlanTier } from '@/config/plans';
import { PolarCheckoutButton } from './PolarCheckoutButton';

interface PricingButtonProps {
  plan: PlanConfig;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function PricingButton({ plan, className = '', variant = 'secondary' }: PricingButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { plan: currentTierRaw, isLoading } = usePlanLimits();
  
  // Map the current tier string to our PlanTier type
  const currentTier: PlanTier = (currentTierRaw as PlanTier) || 'free';
  
  // Button styles based on variant and state
  const getButtonClass = (disabled: boolean = false) => {
    const base = 'w-full rounded-full font-medium transition-all duration-300 py-3 px-6 text-center inline-block cursor-pointer';
    
    if (disabled) {
      return `${base} bg-muted text-muted-foreground cursor-not-allowed opacity-60`;
    }
    
    if (variant === 'primary' || plan.highlight) {
      return `${base} btn-pricing-shiny`;
    }
    
    return `${base} border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border hover:-translate-y-0.5`;
  };
  
  // Loading state
  if (isLoading && isAuthenticated) {
    return (
      <button className={`${getButtonClass(true)} ${className}`} disabled>
        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
      </button>
    );
  }
  
  // Not logged in - redirect to auth
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => navigate('/auth')}
        className={`${getButtonClass()} ${className}`}
      >
        Get Started
      </button>
    );
  }
  
  // Free plan - go to dashboard
  if (plan.tier === 'free') {
    return (
      <button
        onClick={() => navigate('/dashboard')}
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
      >
        Contact Sales
      </a>
    );
  }
  
  // Compare current tier to target tier
  const comparison = comparePlanTiers(currentTier, plan.tier);
  
  // Current plan - disabled
  if (comparison === 0) {
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
  
  // Upgrade or Downgrade - use server-side Polar checkout
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

/**
 * PricingButton - Smart button for pricing cards
 * 
 * Handles all plan button states:
 * - Not logged in → "Get Started" → /auth
 * - Current plan → "Current Plan" (disabled)
 * - Can upgrade → "Upgrade" → Polar checkout URL
 * - Can downgrade → "Downgrade" (disabled or contact)
 * - Enterprise → "Contact Sales" → mailto
 */

import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { PlanConfig, getPlanCheckoutUrl, comparePlanTiers, PlanTier } from '@/config/plans';

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
  
  // Determine button state
  const getButtonState = () => {
    // Not logged in
    if (!isAuthenticated) {
      return {
        text: 'Get Started',
        disabled: false,
        action: () => navigate('/auth'),
      };
    }
    
    // Enterprise - always contact sales
    if (plan.tier === 'enterprise') {
      return {
        text: 'Contact Sales',
        disabled: false,
        action: () => {
          window.location.href = 'mailto:sales@multiblock.ai?subject=Enterprise%20Plan%20Inquiry';
        },
      };
    }
    
    // Compare current tier to target tier
    const comparison = comparePlanTiers(currentTier, plan.tier);
    
    // Current plan
    if (comparison === 0) {
      return {
        text: 'Current Plan',
        disabled: true,
        action: () => {},
      };
    }
    
    // Upgrade
    if (comparison < 0) {
      const checkoutUrl = getPlanCheckoutUrl(plan);
      
      return {
        text: 'Upgrade',
        disabled: false,
        action: () => {
          if (checkoutUrl) {
            // Redirect to Polar checkout
            window.location.href = checkoutUrl;
          } else {
            // No checkout URL configured
            toast.error('Checkout not available', {
              description: 'This plan is not available for purchase yet. Please contact support.',
            });
          }
        },
      };
    }
    
    // Downgrade
    return {
      text: 'Downgrade',
      disabled: true, // Downgrade via billing portal
      action: () => {
        toast.info('Manage your subscription', {
          description: 'To downgrade, please contact support or manage your subscription in the billing portal.',
        });
      },
    };
  };
  
  const { text, disabled, action } = getButtonState();
  
  // Button styles based on variant and state
  const getButtonClass = () => {
    const base = 'w-full rounded-full font-medium transition-all duration-300 py-3 px-6 text-center';
    
    if (disabled) {
      return `${base} bg-muted text-muted-foreground cursor-not-allowed opacity-60`;
    }
    
    if (variant === 'primary' || plan.highlight) {
      return `${base} btn-pricing-shiny`;
    }
    
    return `${base} border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border hover:-translate-y-0.5`;
  };
  
  if (isLoading && isAuthenticated) {
    return (
      <button className={`${getButtonClass()} ${className}`} disabled>
        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
      </button>
    );
  }
  
  return (
    <button
      onClick={action}
      disabled={disabled}
      className={`${getButtonClass()} ${className}`}
    >
      {text}
    </button>
  );
}

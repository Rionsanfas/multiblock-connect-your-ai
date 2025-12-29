/**
 * PricingButton - Smart button for pricing cards
 * 
 * Handles all plan button states:
 * - Not logged in → "Get Started" → /auth
 * - Current plan → "Current Plan" (disabled)
 * - Can upgrade → "Upgrade" → Create Polar checkout session
 * - Can downgrade → "Downgrade" (disabled or contact)
 * - Enterprise → "Contact Sales" → mailto
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { PlanConfig, comparePlanTiers, PlanTier } from '@/config/plans';
import { supabase } from '@/integrations/supabase/client';

interface PricingButtonProps {
  plan: PlanConfig;
  className?: string;
  variant?: 'primary' | 'secondary';
}

/**
 * Create a Polar checkout session via edge function
 */
async function createCheckoutSession(planKey: string, isAddon: boolean = false): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-polar-checkout', {
      body: { plan_key: planKey, is_addon: isAddon },
    });

    if (error) {
      console.error('Checkout error:', error);
      throw new Error(error.message || 'Failed to create checkout');
    }

    return data?.checkout_url || null;
  } catch (err) {
    console.error('Checkout session creation failed:', err);
    return null;
  }
}

export function PricingButton({ plan, className = '', variant = 'secondary' }: PricingButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { plan: currentTierRaw, isLoading } = usePlanLimits();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Map the current tier string to our PlanTier type
  const currentTier: PlanTier = (currentTierRaw as PlanTier) || 'free';
  
  // Handle checkout flow
  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in first');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Map plan tier to plan_key for the checkout endpoint
      const planKey = getPlanKey(plan);
      
      if (!planKey) {
        toast.info('Coming soon', {
          description: 'This plan will be available for purchase soon.',
        });
        return;
      }

      const checkoutUrl = await createCheckoutSession(planKey, false);
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setIsProcessing(false);
    }
  };
  
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
      return {
        text: 'Upgrade',
        disabled: false,
        action: handleCheckout,
      };
    }
    
    // Downgrade
    return {
      text: 'Downgrade',
      disabled: true,
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
    
    if (disabled || isProcessing) {
      return `${base} bg-muted text-muted-foreground cursor-not-allowed opacity-60`;
    }
    
    if (variant === 'primary' || plan.highlight) {
      return `${base} btn-pricing-shiny`;
    }
    
    return `${base} border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border hover:-translate-y-0.5`;
  };
  
  if ((isLoading || isProcessing) && isAuthenticated) {
    return (
      <button className={`${getButtonClass()} ${className}`} disabled>
        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
      </button>
    );
  }
  
  return (
    <button
      onClick={action}
      disabled={disabled || isProcessing}
      className={`${getButtonClass()} ${className}`}
    >
      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : text}
    </button>
  );
}

/**
 * Map PlanConfig to plan_key for checkout endpoint
 */
function getPlanKey(plan: PlanConfig): string | null {
  // Map tier + variant to plan_key
  const tierMapping: Record<string, string> = {
    'starter': 'starter-individual-annual',
    'pro': 'pro-individual-annual',
    'team': 'starter-team-annual',
    'enterprise': null as unknown as string,
    'free': null as unknown as string,
  };
  
  return tierMapping[plan.tier] || null;
}

/**
 * PolarCheckoutButton - Server-side checkout with Polar Embed
 * 
 * Calls edge function to create checkout session with metadata attached server-side
 * Opens Polar embed modal for payment
 * On success: closes modal, refetches data, redirects to /dashboard
 */

import { useAuth } from '@/contexts/AuthContext';
import { usePolarCheckout } from '@/hooks/usePolarCheckout';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PolarCheckoutButtonProps {
  planKey: string;
  isAddon?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
}

export function PolarCheckoutButton({
  planKey,
  isAddon = false,
  children,
  className = '',
  disabled = false,
  variant = 'default',
}: PolarCheckoutButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { openCheckout, isLoading } = usePolarCheckout();

  const handleClick = () => {
    if (!isAuthenticated || !user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth?redirect=/pricing';
      return;
    }
    openCheckout(planKey, isAddon);
  };

  const isDisabled = disabled || isLoading;

  return (
    <Button
      variant={variant}
      className={className}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
}

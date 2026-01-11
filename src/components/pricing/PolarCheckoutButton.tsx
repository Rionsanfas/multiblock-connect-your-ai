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
import { Spinner } from '@/components/ui/spinner';

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

  const handleClick = (e: React.MouseEvent) => {
    // Prevent any default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();
    
    // Don't process if already loading
    if (isLoading) return;
    
    if (!isAuthenticated || !user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth?redirect=/pricing';
      return;
    }
    
    // Trigger checkout immediately
    openCheckout(planKey, isAddon);
  };

  const isDisabled = disabled || isLoading;

  return (
    <Button
      variant={variant}
      className={`relative overflow-hidden ${className}`}
      disabled={isDisabled}
      onClick={handleClick}
      aria-busy={isLoading}
    >
      <span className={`inline-flex items-center justify-center gap-2 transition-opacity duration-150 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" className="text-current" />
        </span>
      )}
    </Button>
  );
}

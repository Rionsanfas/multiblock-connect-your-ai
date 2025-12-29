/**
 * usePolarCheckout - Hook for server-side Polar checkout with embed modal
 * 
 * Creates checkout session via edge function (with metadata attached server-side)
 * Opens Polar embed modal for payment
 * On success: closes modal, refetches data, redirects to dashboard
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutResult {
  checkout_url: string;
  checkout_id: string;
  client_secret?: string;
}

interface UsePolarCheckoutOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Polar embed script management
let polarScriptLoaded = false;
let polarScriptLoading = false;
const polarScriptCallbacks: (() => void)[] = [];

function loadPolarScript(): Promise<void> {
  return new Promise((resolve) => {
    if (polarScriptLoaded) {
      resolve();
      return;
    }

    if (polarScriptLoading) {
      polarScriptCallbacks.push(resolve);
      return;
    }

    polarScriptLoading = true;

    const existingScript = document.querySelector('script[src*="polar.sh/embed"]');
    if (existingScript) {
      polarScriptLoaded = true;
      polarScriptLoading = false;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.polar.sh/embed/polar.js';
    script.async = true;
    script.onload = () => {
      polarScriptLoaded = true;
      polarScriptLoading = false;
      // Initialize Polar
      if ((window as any).Polar) {
        (window as any).Polar.init();
      }
      resolve();
      polarScriptCallbacks.forEach(cb => cb());
      polarScriptCallbacks.length = 0;
    };
    script.onerror = () => {
      polarScriptLoading = false;
      console.error('Failed to load Polar script');
      resolve(); // Resolve anyway to not block
    };
    document.head.appendChild(script);
  });
}

export function usePolarCheckout(options: UsePolarCheckoutOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load Polar script on mount
  useEffect(() => {
    loadPolarScript();
  }, []);

  // Refetch all billing-related queries
  const refetchBillingData = useCallback(async () => {
    console.log('[usePolarCheckout] Refetching billing data...');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['billing'] }),
      queryClient.invalidateQueries({ queryKey: ['user-billing'] }),
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] }),
      queryClient.invalidateQueries({ queryKey: ['user-entitlements'] }),
      queryClient.invalidateQueries({ queryKey: ['user-boards'] }),
      queryClient.invalidateQueries({ queryKey: ['user-board-count'] }),
    ]);
    console.log('[usePolarCheckout] Billing data refetched');
  }, [queryClient]);

  // Handle successful checkout
  const handleSuccess = useCallback(async () => {
    console.log('[usePolarCheckout] Checkout successful!');
    
    // Wait a moment for webhook to process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Refetch billing data
    await refetchBillingData();
    
    // Show success toast
    toast.success('Payment successful!', {
      description: 'Your plan has been activated.',
    });
    
    // Call custom success handler
    options.onSuccess?.();
    
    // Redirect to dashboard
    navigate('/dashboard?checkout=success');
  }, [refetchBillingData, navigate, options]);

  // Create checkout session and open embed modal
  const openCheckout = useCallback(async (planKey: string, isAddon = false) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[usePolarCheckout] Creating checkout for:', planKey, 'isAddon:', isAddon);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to purchase');
      }

      // Call edge function to create checkout with metadata
      const { data, error: fnError } = await supabase.functions.invoke<CheckoutResult>(
        'create-polar-checkout',
        {
          body: { plan_key: planKey, is_addon: isAddon },
        }
      );

      if (fnError) {
        console.error('[usePolarCheckout] Edge function error:', fnError);
        throw new Error(fnError.message || 'Failed to create checkout');
      }

      if (!data?.checkout_url) {
        throw new Error('No checkout URL returned');
      }

      console.log('[usePolarCheckout] Checkout created:', data.checkout_id);

      // Ensure Polar script is loaded
      await loadPolarScript();

      // Open Polar embed checkout
      const Polar = (window as any).Polar;
      if (Polar && typeof Polar.Checkout?.open === 'function') {
        console.log('[usePolarCheckout] Opening Polar embed modal...');
        
        Polar.Checkout.open({
          url: data.checkout_url,
          theme: 'dark',
          onSuccess: () => {
            console.log('[usePolarCheckout] Polar onSuccess callback');
            handleSuccess();
          },
          onClose: () => {
            console.log('[usePolarCheckout] Polar modal closed');
            setIsLoading(false);
          },
        });
      } else {
        // Fallback: open in new tab
        console.log('[usePolarCheckout] Polar.Checkout.open not available, using window.open');
        window.open(data.checkout_url, '_blank');
        
        // Set up message listener for success
        const messageHandler = (event: MessageEvent) => {
          if (event.origin.includes('polar.sh')) {
            if (event.data?.type === 'checkout:success' || event.data?.status === 'succeeded') {
              window.removeEventListener('message', messageHandler);
              handleSuccess();
            }
          }
        };
        window.addEventListener('message', messageHandler);
      }

    } catch (err) {
      console.error('[usePolarCheckout] Error:', err);
      const error = err instanceof Error ? err : new Error('Checkout failed');
      setError(error);
      toast.error('Checkout failed', { description: error.message });
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleSuccess, options]);

  return {
    openCheckout,
    isLoading,
    error,
    refetchBillingData,
  };
}

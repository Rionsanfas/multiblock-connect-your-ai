/**
 * PolarCheckoutButton - Polar Embed Checkout Button
 * 
 * Uses Polar's embed checkout (data-polar-checkout) to open checkout in modal
 * On successful checkout, redirects to /dashboard
 * 
 * CRITICAL: Appends user_id and plan_key to checkout URL metadata
 */

import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PolarCheckoutButtonProps {
  checkoutUrl: string;
  planKey: string;
  isAddon?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onCheckoutOpen?: () => void;
}

// Inject Polar embed script once
let polarScriptInjected = false;

function injectPolarScript() {
  if (polarScriptInjected || typeof window === 'undefined') return;
  
  const existingScript = document.querySelector('script[src*="polar.sh/embed"]');
  if (existingScript) {
    polarScriptInjected = true;
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://cdn.polar.sh/embed/polar.js';
  script.async = true;
  script.onload = () => {
    polarScriptInjected = true;
    // Initialize Polar if available
    if ((window as any).Polar) {
      (window as any).Polar.init();
    }
  };
  document.head.appendChild(script);
  polarScriptInjected = true;
}

export function PolarCheckoutButton({
  checkoutUrl,
  planKey,
  isAddon = false,
  children,
  className = '',
  disabled = false,
  onCheckoutOpen,
}: PolarCheckoutButtonProps) {
  const navigate = useNavigate();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    injectPolarScript();
  }, []);

  // Build checkout URL with metadata for the webhook
  const checkoutUrlWithMetadata = useMemo(() => {
    if (!user?.id || !checkoutUrl) return checkoutUrl;
    
    try {
      const url = new URL(checkoutUrl);
      // Add metadata as query params - Polar will pass these to webhook
      url.searchParams.set('metadata[user_id]', user.id);
      url.searchParams.set('metadata[plan_key]', planKey);
      if (isAddon) {
        url.searchParams.set('metadata[is_addon]', 'true');
      }
      // Also set customer email for pre-fill
      if (user.email) {
        url.searchParams.set('customer_email', user.email);
      }
      return url.toString();
    } catch {
      // If URL parsing fails, just return original
      return checkoutUrl;
    }
  }, [checkoutUrl, user?.id, user?.email, planKey, isAddon]);

  // Listen for successful checkout via message events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Polar sends messages when checkout completes
      if (event.origin.includes('polar.sh')) {
        if (event.data?.type === 'polar:checkout:success' || 
            event.data?.event === 'checkout.completed' ||
            event.data?.status === 'success') {
          // Redirect to dashboard on success
          navigate('/dashboard?checkout=success');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  // Also check URL params on mount for redirect-based success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      navigate('/dashboard?checkout=success');
    }
  }, [navigate]);

  if (disabled || !user) {
    return (
      <button className={className} disabled>
        {children}
      </button>
    );
  }

  return (
    <a
      ref={linkRef}
      href={checkoutUrlWithMetadata}
      data-polar-checkout
      data-polar-checkout-theme="dark"
      className={className}
      onClick={(e) => {
        onCheckoutOpen?.();
        // Let Polar handle the click for embed modal
      }}
    >
      {children}
    </a>
  );
}

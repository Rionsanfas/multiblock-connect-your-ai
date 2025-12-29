/**
 * PolarCheckoutButton - Polar Embed Checkout Button
 * 
 * Uses Polar's embed checkout (data-polar-checkout) to open checkout in modal
 * On successful checkout, redirects to /dashboard
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface PolarCheckoutButtonProps {
  checkoutUrl: string;
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
  children,
  className = '',
  disabled = false,
  onCheckoutOpen,
}: PolarCheckoutButtonProps) {
  const navigate = useNavigate();
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    injectPolarScript();
  }, []);

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

  if (disabled) {
    return (
      <button className={className} disabled>
        {children}
      </button>
    );
  }

  return (
    <a
      ref={linkRef}
      href={checkoutUrl}
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

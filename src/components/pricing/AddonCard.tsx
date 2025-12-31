/**
 * AddonCard - Card for displaying stackable add-ons
 * Uses server-side Polar checkout with embed modal
 */

import { LayoutGrid } from 'lucide-react';
import { AddonConfig, formatStorage } from '@/config/plans';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { PolarCheckoutButton } from './PolarCheckoutButton';

interface AddonCardProps {
  addon: AddonConfig;
}

export function AddonCard({ addon }: AddonCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Button styles
  const buttonClass = 'w-full rounded-full font-medium transition-all duration-500 ease-out py-2 px-4 text-sm text-center inline-block cursor-pointer border border-border/60 bg-card/50 text-foreground hover:bg-card/80 hover:border-border hover:-translate-y-0.5';

  return (
    <div className="premium-card-wrapper">
      <div className="premium-card-gradient" />
      <div className="premium-card-content p-5 text-center">
        {/* Storage amount */}
        <div className="text-3xl font-bold text-accent mb-1">
          +{formatStorage(addon.extra_storage_mb)}
        </div>
        <div className="text-xs text-muted-foreground mb-2">storage</div>
        
        {/* Boards */}
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4">
          <LayoutGrid className="h-3 w-3" />
          +{addon.extra_boards} boards
        </div>

        {/* Price */}
        <div className="text-2xl font-bold mb-3">
          ${(addon.price_cents / 100).toFixed(2)}
        </div>

        {/* Button - use server-side Polar checkout if authenticated */}
        {isAuthenticated ? (
          <PolarCheckoutButton
            planKey={addon.id}
            isAddon={true}
            className={buttonClass}
          >
            Add
          </PolarCheckoutButton>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className={buttonClass}
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}

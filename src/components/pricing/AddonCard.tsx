/**
 * AddonCard - Card for displaying stackable add-ons
 */

import { HardDrive, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddonConfig, formatStorage } from '@/config/plans';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AddonCardProps {
  addon: AddonConfig;
}

export function AddonCard({ addon }: AddonCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (addon.checkout_url) {
      window.location.href = addon.checkout_url;
    } else {
      toast.info('Coming soon', {
        description: 'This add-on will be available soon.',
      });
    }
  };

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

        <Button
          variant="pill-outline"
          size="sm"
          className="w-full"
          onClick={handleClick}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface LockedBoardBannerProps {
  reason?: string | null;
}

export function LockedBoardBanner({ reason }: LockedBoardBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
      <Lock className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm flex-1">
        {reason || 'This board is read-only. Upgrade to unlock.'}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-7"
        onClick={() => navigate('/pricing')}
      >
        Upgrade
      </Button>
    </div>
  );
}

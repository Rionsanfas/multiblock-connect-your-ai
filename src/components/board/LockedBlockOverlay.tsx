import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LockedBlockOverlay() {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-2xl">
      <div className="text-center space-y-2 p-4">
        <Lock className="h-6 w-6 mx-auto text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Locked —{' '}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/pricing');
            }}
            className="underline text-primary hover:text-primary/80 no-drag"
          >
            Upgrade to unlock
          </button>
        </p>
      </div>
    </div>
  );
}

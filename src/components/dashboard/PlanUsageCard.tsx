import { LayoutGrid, Users, Crown, ArrowRight, Sparkles, Infinity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useBilling } from "@/hooks/useBilling";

// Plan display name mapping
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  'free': 'Free',
  'starter-individual-annual': 'Starter',
  'pro-individual-annual': 'Pro',
  'starter-team-annual': 'Starter Team',
  'pro-team-annual': 'Pro Team',
  'ltd-starter-individual': 'Starter LTD',
  'ltd-pro-individual': 'Pro LTD',
  'ltd-starter-team': 'Starter Team LTD',
  'ltd-pro-team': 'Pro Team LTD',
};

interface PlanUsageCardProps {
  boardsUsed: number;
}

export function PlanUsageCard({ boardsUsed }: PlanUsageCardProps) {
  const { data: billing, isLoading } = useBilling();
  
  // Get plan data from billing (user_billing table)
  const activePlan = billing?.active_plan || 'free';
  const planName = PLAN_DISPLAY_NAMES[activePlan] || activePlan;
  const isActive = billing?.subscription_status === 'active' || billing?.is_lifetime;
  const isLifetime = billing?.is_lifetime ?? false;
  const isFree = !isActive || activePlan === 'free';
  
  // Board limits from billing
  const boardsLimit = isFree ? 1 : (billing?.total_boards ?? 1);
  const seatsLimit = billing?.seats ?? 1;
  const seatsUsed = 1;
  
  const boardPercentage = boardsLimit > 0 && boardsLimit !== -1 
    ? Math.min(boardsUsed / boardsLimit * 100, 100) 
    : 0;
  const seatPercentage = seatsLimit > 1 
    ? Math.min(seatsUsed / seatsLimit * 100, 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-pulse">
        <div className="h-20 bg-muted/20 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="dashboard-icon-box">
            <Crown className="h-4 w-4 text-foreground" />
          </div>
          <span className="font-semibold text-center text-sm">{planName}</span>
          {isLifetime && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1">
              <Sparkles className="h-3 w-3" />
              Lifetime
            </Badge>
          )}
          {!isFree && isActive && !isLifetime && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-green-500 border-green-500/30">
              Active
            </Badge>
          )}
          {billing?.subscription_status === 'canceled' && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
              Canceled
            </Badge>
          )}
        </div>
        {isFree && (
          <Link to="/pricing">
            <Button variant="ghost" size="sm" className="text-xs h-8 gap-1 hover:bg-secondary/60">
              Upgrade
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>

      {/* Boards Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="font-medium">Boards</span>
          </div>
          <span className="font-semibold tabular-nums">
            {boardsUsed} / {boardsLimit === -1 ? <Infinity className="inline h-3 w-3" /> : boardsLimit}
          </span>
        </div>
        {boardsLimit !== -1 && <Progress value={boardPercentage} className="h-1.5" />}
      </div>

      {/* Seats Usage (for team plans) */}
      {seatsLimit > 1 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">Seats</span>
            </div>
            <span className="font-semibold tabular-nums">{seatsUsed} / {seatsLimit}</span>
          </div>
          <Progress value={seatPercentage} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

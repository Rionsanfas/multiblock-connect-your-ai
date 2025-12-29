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
  planId?: string;
  boardsUsed: number;
  boardsLimit?: number;
  seatsUsed?: number;
  seatsLimit?: number;
}

export function PlanUsageCard({
  planId,
  boardsUsed,
  boardsLimit: propBoardsLimit,
  seatsUsed = 1,
  seatsLimit: propSeatsLimit,
}: PlanUsageCardProps) {
  const { data: billing, isLoading } = useBilling();
  
  // Use billing data if available, otherwise use props
  const activePlan = billing?.active_plan || planId || 'free';
  const planName = PLAN_DISPLAY_NAMES[activePlan] || activePlan;
  const boardsLimit = billing?.boards ?? propBoardsLimit ?? 3;
  const seatsLimit = billing?.seats ?? propSeatsLimit ?? 1;
  const isLifetime = billing?.is_lifetime ?? false;
  const status = billing?.subscription_status ?? 'inactive';
  
  const boardPercentage = boardsLimit > 0 ? Math.min(boardsUsed / boardsLimit * 100, 100) : 0;
  const seatPercentage = seatsLimit > 1 ? Math.min(seatsUsed / seatsLimit * 100, 100) : 0;
  
  const isActive = status === 'active';
  const isFree = activePlan === 'free' || !activePlan;

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
          {status === 'canceled' && (
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
import { LayoutGrid, Users, Crown, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { pricingPlans } from "@/mocks/seed";
interface PlanUsageCardProps {
  planId: string;
  boardsUsed: number;
  boardsLimit: number;
  seatsUsed?: number;
  seatsLimit?: number;
}
export function PlanUsageCard({
  planId,
  boardsUsed,
  boardsLimit,
  seatsUsed,
  seatsLimit
}: PlanUsageCardProps) {
  // TODO: Replace with Supabase query
  const plan = pricingPlans.find(p => p.id === planId);
  const planName = plan?.name || 'Free / Starter';
  const boardPercentage = Math.min(boardsUsed / boardsLimit * 100, 100);
  const seatPercentage = seatsLimit ? Math.min((seatsUsed || 0) / seatsLimit * 100, 100) : 0;
  return <div className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="dashboard-icon-box">
            <Crown className="h-4 w-4 text-foreground" />
          </div>
          <span className="font-semibold text-center text-sm">{planName}</span>
        </div>
        <Link to="/pricing">
          <Button variant="ghost" size="sm" className="text-xs h-8 gap-1 hover:bg-secondary/60">
            Upgrade
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Boards Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="font-medium">Boards</span>
          </div>
          <span className="font-semibold tabular-nums">{boardsUsed} / {boardsLimit}</span>
        </div>
        <Progress value={boardPercentage} className="h-1.5" />
      </div>

      {/* Seats Usage (for team plans) */}
      {seatsLimit && seatsLimit > 1 && <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">Seats</span>
            </div>
            <span className="font-semibold tabular-nums">{seatsUsed || 0} / {seatsLimit}</span>
          </div>
          <Progress value={seatPercentage} className="h-1.5" />
        </div>}
    </div>;
}
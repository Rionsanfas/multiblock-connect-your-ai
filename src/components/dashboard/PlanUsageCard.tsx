import { LayoutGrid, Users, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/glass-card";
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
  
  const boardPercentage = Math.min((boardsUsed / boardsLimit) * 100, 100);
  const seatPercentage = seatsLimit ? Math.min(((seatsUsed || 0) / seatsLimit) * 100, 100) : 0;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{planName}</span>
        </div>
        <Link to="/pricing">
          <Button variant="ghost" size="sm" className="text-xs h-7">
            Upgrade
          </Button>
        </Link>
      </div>

      {/* Boards Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <div className="flex items-center gap-1">
            <LayoutGrid className="h-3 w-3" />
            <span>Boards</span>
          </div>
          <span>{boardsUsed} / {boardsLimit}</span>
        </div>
        <Progress value={boardPercentage} className="h-1.5" />
      </div>

      {/* Seats Usage (for team plans) */}
      {seatsLimit && seatsLimit > 1 && (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Seats</span>
            </div>
            <span>{seatsUsed || 0} / {seatsLimit}</span>
          </div>
          <Progress value={seatPercentage} className="h-1.5" />
        </div>
      )}
    </GlassCard>
  );
}

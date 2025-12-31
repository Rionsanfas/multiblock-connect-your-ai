/**
 * UnifiedPricingCard - Clean pricing card component
 * Used on both Home page and Pricing page
 * Shows only canonical features: Boards, Blocks, Storage, Seats, Access type
 */

import { Check, LayoutGrid, Plus, HardDrive, Users, Infinity, Clock, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PlanConfig, formatStorage, formatLimit } from '@/config/plans';
import { PricingButton } from './PricingButton';

interface UnifiedPricingCardProps {
  plan: PlanConfig;
  showSeats?: boolean;
  ltdRemaining?: number;
  ltdTotal?: number;
}

export function UnifiedPricingCard({ 
  plan, 
  showSeats = false, 
  ltdRemaining, 
  ltdTotal = 250 
}: UnifiedPricingCardProps) {
  const isLifetime = plan.billing_period === 'lifetime';
  const isEnterprise = plan.tier === 'enterprise';
  const isFree = plan.tier === 'free';
  const isSoldOut = isLifetime && ltdRemaining !== undefined && ltdRemaining <= 0;

  return (
    <div className={`premium-card-wrapper ${plan.highlight ? 'scale-105 z-10' : ''} h-full`}>
      <div className="premium-card-gradient" />
      <div className="premium-card-content h-full p-6 relative flex flex-col">
        {/* Badge */}
        {plan.badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 text-xs rounded-full z-10 badge-3d-shiny whitespace-nowrap">
            {plan.badge}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-gold-shine' : 'text-foreground'}`}>
            {plan.name}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              {isEnterprise ? 'Custom' : isFree ? 'Free' : `$${(plan.price_cents / 100).toFixed(0)}`}
            </span>
            {plan.price_cents > 0 && !isEnterprise && (
              <span className="text-muted-foreground">
                {isLifetime ? ' one-time' : '/year'}
              </span>
            )}
          </div>
          {/* Access duration */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            {isLifetime ? (
              <>
                <Infinity className="h-3 w-3 text-accent" />
                <span className="text-accent font-medium">Lifetime access</span>
              </>
            ) : isFree ? (
              <span>Free forever</span>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>1-year access</span>
              </>
            )}
          </div>
        </div>

        {/* Key Stats - Only canonical features */}
        <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border/30">
          {/* Boards */}
          <div className="flex items-center gap-3 text-sm">
            <div className="icon-3d-box">
              <LayoutGrid className="h-4 w-4 text-accent" />
            </div>
            <span>{formatLimit(plan.boards)} board{plan.boards !== 1 && plan.boards !== -1 ? 's' : ''}</span>
          </div>
          
          {/* Blocks */}
          <div className="flex items-center gap-3 text-sm">
            <div className="icon-3d-box">
              <Plus className="h-4 w-4 text-accent" />
            </div>
            <span>{formatLimit(plan.blocks_per_board)} blocks/board</span>
          </div>
          
          {/* Storage */}
          <div className="flex items-center gap-3 text-sm">
            <div className="icon-3d-box">
              <HardDrive className="h-4 w-4 text-accent" />
            </div>
            <span>{formatStorage(plan.storage_mb)} storage</span>
          </div>
          
          {/* Seats (for team plans or when specified) */}
          {(showSeats || plan.seats > 1) && (
            <div className="flex items-center gap-3 text-sm">
              <div className="icon-3d-box">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <span>{formatLimit(plan.seats)} seat{plan.seats !== 1 && plan.seats !== -1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* LTD Scarcity Warning */}
        {isLifetime && ltdRemaining !== undefined && !isSoldOut && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Limited Availability</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {ltdRemaining} of {ltdTotal} remaining
            </p>
          </div>
        )}

        {isSoldOut && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Sold Out</span>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA Button */}
        {isSoldOut ? (
          <div className="w-full py-3 text-center text-muted-foreground bg-muted/50 rounded-xl text-sm font-medium">
            Sold Out
          </div>
        ) : (
          <PricingButton plan={plan} variant={plan.highlight ? 'primary' : 'secondary'} />
        )}
      </div>
    </div>
  );
}

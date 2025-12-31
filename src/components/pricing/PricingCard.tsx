/**
 * PricingCard - Reusable pricing card component
 */

import { Check, Info, HardDrive, Users, LayoutGrid, Plus, MessageSquare, Infinity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlanConfig, formatPlanPrice, formatStorage, formatLimit } from '@/config/plans';
import { PricingButton } from './PricingButton';

interface PricingCardProps {
  plan: PlanConfig;
  showSeats?: boolean;
}

export function PricingCard({ plan, showSeats = false }: PricingCardProps) {
  const isLifetime = plan.billing_period === 'lifetime';
  const isEnterprise = plan.tier === 'enterprise';

  return (
    <div className={`premium-card-wrapper ${plan.highlight ? 'sm:scale-105 z-10' : ''} h-full`}>
      <div className="premium-card-gradient" />
      <div className="premium-card-content h-full p-4 sm:p-6 relative flex flex-col">
        {/* Badge */}
        {plan.badge && (
          <div className="inline-flex self-start px-2 sm:px-3 py-1 text-xs rounded-full mb-3 sm:mb-4 badge-3d-shiny whitespace-nowrap">
            {plan.badge}
          </div>
        )}

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h3 className={`text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 ${plan.highlight ? 'text-gold-shine' : 'text-foreground'}`}>
            {plan.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            {plan.description}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-bold">
              {isEnterprise ? 'Custom' : plan.price_cents === 0 ? 'Free' : `$${(plan.price_cents / 100).toFixed(2)}`}
            </span>
            {plan.price_cents > 0 && !isEnterprise && (
              <span className="text-muted-foreground text-sm">
                {isLifetime ? ' one-time' : '/year'}
              </span>
            )}
          </div>
          {isLifetime && (
            <div className="flex items-center gap-1 mt-2 text-xs text-accent">
              <Infinity className="h-3 w-3" />
              <span>Lifetime access</span>
            </div>
          )}
        </div>

        {/* Key Stats */}
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
            <Tooltip>
              <TooltipTrigger className="min-w-[24px] min-h-[24px] flex items-center justify-center">
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Storage covers messages, blocks, and uploaded files
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Seats (for team plans or when specified) */}
          {(showSeats || plan.seats > 1) && (
            <div className="flex items-center gap-3 text-sm">
              <div className="icon-3d-box">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <span>{formatLimit(plan.seats)} team seat{plan.seats !== 1 && plan.seats !== -1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6 flex-1">
          {plan.features.slice(0, 6).map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <PricingButton plan={plan} variant={plan.highlight ? 'primary' : 'secondary'} />
      </div>
    </div>
  );
}

/**
 * PricingCard - Reusable pricing card component
 */

import { Info, HardDrive, Users, LayoutGrid, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlanConfig, formatPlanPrice, formatStorage, formatLimit } from '@/config/plans';
import { PricingButton } from './PricingButton';
interface PricingCardProps {
  plan: PlanConfig;
  showSeats?: boolean;
}
export function PricingCard({
  plan,
  showSeats = false
}: PricingCardProps) {
  const isLifetime = plan.billing_period === 'lifetime';
  const isEnterprise = plan.tier === 'enterprise';
  return <div className={`premium-card-wrapper ${plan.highlight ? 'sm:scale-105 z-10' : ''} h-full`}>
      <div className="premium-card-gradient" />
      <div className="premium-card-content h-full p-3 sm:p-4 md:p-6 relative flex flex-col px-[10px]">
        {/* Badge */}
        {plan.badge && <div className="inline-flex self-start px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full mb-2 sm:mb-3 md:mb-4 badge-3d-shiny whitespace-nowrap">
            {plan.badge}
          </div>}

        {/* Header */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <h3 className={`text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-1.5 md:mb-2 ${plan.highlight ? 'text-gold-shine' : 'text-foreground'}`}>
            {plan.name}
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-2 sm:mb-3 md:mb-4 line-clamp-2">
            {plan.description}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold px-0 py-0 my-[2px] mx-0">
              {isEnterprise ? 'Custom' : plan.price_cents === 0 ? 'Free' : `$${(plan.price_cents / 100).toFixed(2)}`}
            </span>
            {plan.price_cents > 0 && !isEnterprise && <span className="text-muted-foreground text-xs sm:text-sm">
                {isLifetime ? ' one-time' : '/year'}
              </span>}
          </div>
          {isLifetime && <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-accent">
              
              <span>Lifetime access</span>
            </div>}
        </div>

        {/* Key Stats */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-muted/20 border border-border/30 px-[9px]">
          {/* Boards */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="icon-3d-box p-1 sm:p-1.5">
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
            </div>
            <span>{formatLimit(plan.boards)} board{plan.boards !== 1 && plan.boards !== -1 ? 's' : ''}</span>
          </div>
          
          {/* Blocks */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="icon-3d-box p-1 sm:p-1.5">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
            </div>
            <span>{formatLimit(plan.blocks_per_board)} blocks/board</span>
          </div>
          
          {/* Storage */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="icon-3d-box p-1 sm:p-1.5">
              <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
            </div>
            <span>{formatStorage(plan.storage_mb)} storage</span>
            <Tooltip>
              <TooltipTrigger className="min-w-[20px] sm:min-w-[24px] min-h-[20px] sm:min-h-[24px] flex items-center justify-center">
                <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Storage covers messages, blocks, and uploaded files
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Seats (for team plans or when specified) */}
          {(showSeats || plan.seats > 1) && <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="icon-3d-box p-1 sm:p-1.5">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
              </div>
              <span>{formatLimit(plan.seats)} team seat{plan.seats !== 1 && plan.seats !== -1 ? 's' : ''}</span>
            </div>}
        </div>

        {/* Features */}
        <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-1">
          {plan.features.slice(0, 6).map(feature => <li key={feature} className="flex items-start gap-2 sm:gap-2.5 text-[10px] sm:text-xs md:text-sm">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 sm:mt-2 flex-shrink-0" />
              <span className="text-muted-foreground line-clamp-2">{feature}</span>
            </li>)}
        </ul>

        {/* CTA Button */}
        <PricingButton plan={plan} variant={plan.highlight ? 'primary' : 'secondary'} />
      </div>
    </div>;
}
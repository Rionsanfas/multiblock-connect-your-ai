import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { pricingPlans, boardAddons } from '@/mocks/seed';
import type { PricingPlan, PlanCapabilities, UserPlan, Subscription } from '@/types';
import { FREE_PLAN_STORAGE_MB } from '@/config/plan-constants';

// ============================================
// PLAN DATA HOOKS
// ============================================

export function usePricingPlans() {
  return useMemo(() => pricingPlans.filter((p) => p.is_active), []);
}

export function useBoardAddons() {
  return useMemo(() => boardAddons.filter((a) => a.is_active), []);
}

export function usePlanById(planId: string): PricingPlan | undefined {
  return useMemo(() => pricingPlans.find((p) => p.id === planId), [planId]);
}

// ============================================
// USER PLAN HOOKS
// ============================================

export function useUserPlan(): UserPlan | undefined {
  const getUserPlan = useAppStore((s) => s.getUserPlan);
  return getUserPlan();
}

export function useUserSubscription(): Subscription | undefined {
  const getUserSubscription = useAppStore((s) => s.getUserSubscription);
  return getUserSubscription();
}

export function useCurrentPlanDetails(): PricingPlan | undefined {
  const userPlan = useUserPlan();
  return usePlanById(userPlan?.plan_id || 'free');
}

// ============================================
// PLAN CAPABILITIES HOOKS
// ============================================

export function usePlanCapabilities(): PlanCapabilities | undefined {
  const plan = useCurrentPlanDetails();
  return plan?.capabilities;
}

export function useHasCapability(capability: keyof PlanCapabilities): boolean {
  const capabilities = usePlanCapabilities();
  return capabilities?.[capability] ?? false;
}

// ============================================
// PLAN LIMITS HOOKS
// ============================================

export function usePlanLimits() {
  const userPlan = useUserPlan();
  const planDetails = useCurrentPlanDetails();
  
  return useMemo(() => ({
    boardsLimit: userPlan?.effective_boards_limit ?? planDetails?.boards ?? 1,
    boardsUsed: userPlan?.boards_used ?? 0,
    storageLimit: userPlan?.effective_storage_mb ?? planDetails?.storage_mb ?? FREE_PLAN_STORAGE_MB,
    storageUsed: userPlan?.storage_used_mb ?? 0,
    seatsLimit: userPlan?.effective_seats ?? planDetails?.seats ?? 1,
    blocksPerBoard: planDetails?.blocks_per_board ?? 3,
  }), [userPlan, planDetails]);
}

export function useIsAtBoardLimit(): boolean {
  const { boardsLimit, boardsUsed } = usePlanLimits();
  return boardsUsed >= boardsLimit;
}

export function useIsAtStorageLimit(thresholdPercent = 90): boolean {
  const { storageLimit, storageUsed } = usePlanLimits();
  return (storageUsed / storageLimit) * 100 >= thresholdPercent;
}

export function useBoardsRemaining(): number {
  const { boardsLimit, boardsUsed } = usePlanLimits();
  return Math.max(0, boardsLimit - boardsUsed);
}

// ============================================
// PLAN TIER HOOKS
// ============================================

export function usePlanTier(): 'free' | 'pro' | 'team' | 'enterprise' {
  const plan = useCurrentPlanDetails();
  return plan?.tier ?? 'free';
}

export function useIsPaidPlan(): boolean {
  const tier = usePlanTier();
  return tier !== 'free';
}

export function useIsTeamPlan(): boolean {
  const tier = usePlanTier();
  return tier === 'team' || tier === 'enterprise';
}

// ============================================
// UPGRADE SUGGESTIONS
// ============================================

export function useUpgradeSuggestion(): PricingPlan | undefined {
  const currentPlan = useCurrentPlanDetails();
  const plans = usePricingPlans();
  
  return useMemo(() => {
    if (!currentPlan) return plans.find((p) => p.tier === 'pro');
    
    const currentIndex = plans.findIndex((p) => p.id === currentPlan.id);
    if (currentIndex < plans.length - 1) {
      return plans[currentIndex + 1];
    }
    return undefined;
  }, [currentPlan, plans]);
}

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatPlanPrice(plan: PricingPlan): string {
  if (plan.price_cents === 0) return 'Free';
  const price = plan.price_cents / 100;
  const period = plan.billing_period === 'yearly' ? '/year' : '/month';
  return `$${price}${period}`;
}

export function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function formatStorageUsage(used: number, limit: number): string {
  return `${formatStorage(used)} / ${formatStorage(limit)}`;
}

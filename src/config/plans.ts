/**
 * Pricing Plans Configuration
 * Monthly-first pricing model with Polar.sh integration
 */

import {
  FREE_PLAN_STORAGE_MB,
  FREE_PLAN_STORAGE_DISPLAY,
  FREE_PLAN_BOARDS,
  FREE_PLAN_BLOCKS_PER_BOARD,
  FREE_PLAN_SEATS,
  FREE_PLAN_MESSAGES_PER_DAY,
  FREE_PLAN_API_KEYS,
  PRO_PLAN_BOARDS,
  PRO_PLAN_STORAGE_MB,
  PRO_PLAN_STORAGE_GB,
  PRO_PLAN_SEATS,
  TEAM_PLAN_BOARDS,
  TEAM_PLAN_STORAGE_MB,
  TEAM_PLAN_STORAGE_GB,
  TEAM_PLAN_SEATS,
  PRO_MONTHLY_PRICE,
  PRO_ANNUAL_PRICE,
  PRO_ANNUAL_SAVINGS,
  TEAM_MONTHLY_PRICE,
  TEAM_ANNUAL_PRICE,
  TEAM_ANNUAL_SAVINGS,
  TRIAL_DAYS,
  POLAR_PRODUCT_IDS,
} from './plan-constants';

import type { PlanCapabilities } from '@/types';

export type PlanCategory = 'individual' | 'team';
export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';
export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime' | 'one_time';

export interface PlanConfig {
  id: string;
  name: string;
  tier: PlanTier;
  category: PlanCategory;
  description: string;
  price_cents: number;
  billing_period: BillingPeriod;
  boards: number;
  blocks_per_board: number | 'unlimited';
  storage_mb: number;
  seats: number;
  messages_per_day: number;
  api_keys: number;
  features: string[];
  capabilities: PlanCapabilities;
  highlight?: boolean;
  badge?: string;
  sort_order: number;
  is_active: boolean;
  checkout_url?: string;
  polar_product_id?: string;
  trial_days?: number;
  annual_price_cents?: number;
  annual_savings?: number;
}

// Base capabilities
const BASE_CAPABILITIES: PlanCapabilities = {
  api_access: false,
  custom_models: false,
  priority_support: false,
  export_json: false,
  export_pdf: false,
  sso_enabled: false,
  audit_logs: false,
  custom_branding: false,
  webhooks: false,
  advanced_analytics: false,
};

const PRO_CAPABILITIES: PlanCapabilities = {
  ...BASE_CAPABILITIES,
  api_access: true,
  custom_models: true,
  priority_support: true,
  export_json: true,
};

const TEAM_CAPABILITIES: PlanCapabilities = {
  ...PRO_CAPABILITIES,
  sso_enabled: true,
  audit_logs: true,
  custom_branding: true,
  advanced_analytics: true,
};

// ============================================
// PLAN DEFINITIONS
// ============================================

const FREE_PLAN: PlanConfig = {
  id: 'free',
  name: 'Free',
  tier: 'free',
  category: 'individual',
  description: 'Try Multiblock with basic features',
  price_cents: 0,
  billing_period: 'monthly',
  boards: FREE_PLAN_BOARDS,
  blocks_per_board: FREE_PLAN_BLOCKS_PER_BOARD,
  storage_mb: FREE_PLAN_STORAGE_MB,
  seats: FREE_PLAN_SEATS,
  messages_per_day: FREE_PLAN_MESSAGES_PER_DAY,
  api_keys: FREE_PLAN_API_KEYS,
  features: [
    `${FREE_PLAN_BOARDS} board`,
    `${FREE_PLAN_BLOCKS_PER_BOARD} blocks per board`,
    `${FREE_PLAN_STORAGE_DISPLAY} storage`,
    `${FREE_PLAN_MESSAGES_PER_DAY} messages/day`,
    'Basic AI models (BYOK)',
    '7-day history',
  ],
  capabilities: BASE_CAPABILITIES,
  sort_order: 0,
  is_active: true,
};

const PRO_MONTHLY: PlanConfig = {
  id: 'pro-monthly',
  name: 'Pro',
  tier: 'pro',
  category: 'individual',
  description: 'For power users who need unlimited AI',
  price_cents: PRO_MONTHLY_PRICE * 100,
  billing_period: 'monthly',
  boards: PRO_PLAN_BOARDS,
  blocks_per_board: 'unlimited',
  storage_mb: PRO_PLAN_STORAGE_MB,
  seats: PRO_PLAN_SEATS,
  messages_per_day: -1,
  api_keys: -1,
  features: [
    `${PRO_PLAN_BOARDS} boards`,
    'Unlimited blocks',
    `${PRO_PLAN_STORAGE_GB} GB storage`,
    'Unlimited messages',
    'All AI models (BYOK)',
    'Infinite history',
    'Priority support',
    'Export data',
  ],
  capabilities: PRO_CAPABILITIES,
  highlight: true,
  badge: 'Most Popular',
  sort_order: 1,
  is_active: true,
  checkout_url: `https://polar.sh/multiblock/checkout?product=${POLAR_PRODUCT_IDS['pro-monthly']}`,
  polar_product_id: POLAR_PRODUCT_IDS['pro-monthly'],
  trial_days: TRIAL_DAYS,
  annual_price_cents: PRO_ANNUAL_PRICE * 100,
  annual_savings: PRO_ANNUAL_SAVINGS,
};

const PRO_ANNUAL: PlanConfig = {
  id: 'pro-annual',
  name: 'Pro',
  tier: 'pro',
  category: 'individual',
  description: 'Save $46 with annual billing',
  price_cents: PRO_ANNUAL_PRICE * 100,
  billing_period: 'yearly',
  boards: PRO_PLAN_BOARDS,
  blocks_per_board: 'unlimited',
  storage_mb: PRO_PLAN_STORAGE_MB,
  seats: PRO_PLAN_SEATS,
  messages_per_day: -1,
  api_keys: -1,
  features: PRO_MONTHLY.features,
  capabilities: PRO_CAPABILITIES,
  highlight: true,
  badge: 'Save $46',
  sort_order: 2,
  is_active: true,
  checkout_url: `https://polar.sh/multiblock/checkout?product=${POLAR_PRODUCT_IDS['pro-annual']}`,
  polar_product_id: POLAR_PRODUCT_IDS['pro-annual'],
};

const TEAM_MONTHLY: PlanConfig = {
  id: 'team-monthly',
  name: 'Pro Team',
  tier: 'team',
  category: 'team',
  description: 'For teams that collaborate with AI',
  price_cents: TEAM_MONTHLY_PRICE * 100,
  billing_period: 'monthly',
  boards: TEAM_PLAN_BOARDS,
  blocks_per_board: 'unlimited',
  storage_mb: TEAM_PLAN_STORAGE_MB,
  seats: TEAM_PLAN_SEATS,
  messages_per_day: -1,
  api_keys: -1,
  features: [
    `${TEAM_PLAN_BOARDS} boards`,
    'Unlimited blocks',
    `${TEAM_PLAN_STORAGE_GB} GB storage`,
    `Up to ${TEAM_PLAN_SEATS} seats`,
    'All AI models (BYOK)',
    'Shared boards & team memory',
    'Admin controls & analytics',
    'Audit logs',
  ],
  capabilities: TEAM_CAPABILITIES,
  sort_order: 3,
  is_active: true,
  checkout_url: `https://polar.sh/multiblock/checkout?product=${POLAR_PRODUCT_IDS['team-monthly']}`,
  polar_product_id: POLAR_PRODUCT_IDS['team-monthly'],
  trial_days: TRIAL_DAYS,
  annual_price_cents: TEAM_ANNUAL_PRICE * 100,
  annual_savings: TEAM_ANNUAL_SAVINGS,
};

const TEAM_ANNUAL: PlanConfig = {
  id: 'team-annual',
  name: 'Pro Team',
  tier: 'team',
  category: 'team',
  description: 'Save $118 with annual billing',
  price_cents: TEAM_ANNUAL_PRICE * 100,
  billing_period: 'yearly',
  boards: TEAM_PLAN_BOARDS,
  blocks_per_board: 'unlimited',
  storage_mb: TEAM_PLAN_STORAGE_MB,
  seats: TEAM_PLAN_SEATS,
  messages_per_day: -1,
  api_keys: -1,
  features: TEAM_MONTHLY.features,
  capabilities: TEAM_CAPABILITIES,
  sort_order: 4,
  is_active: true,
  checkout_url: `https://polar.sh/multiblock/checkout?product=${POLAR_PRODUCT_IDS['team-annual']}`,
  polar_product_id: POLAR_PRODUCT_IDS['team-annual'],
};

// ============================================
// ALL PLANS (EXPORT)
// ============================================

export const PRICING_PLANS: PlanConfig[] = [
  FREE_PLAN,
  PRO_MONTHLY,
  PRO_ANNUAL,
  TEAM_MONTHLY,
  TEAM_ANNUAL,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPlanById(planId: string): PlanConfig | undefined {
  return PRICING_PLANS.find(p => p.id === planId);
}

export function getFreePlan(): PlanConfig {
  return FREE_PLAN;
}

export function getProMonthlyPlan(): PlanConfig {
  return PRO_MONTHLY;
}

export function getProAnnualPlan(): PlanConfig {
  return PRO_ANNUAL;
}

export function getTeamMonthlyPlan(): PlanConfig {
  return TEAM_MONTHLY;
}

export function getTeamAnnualPlan(): PlanConfig {
  return TEAM_ANNUAL;
}

/** Get plans for a specific billing period */
export function getPlansByBillingPeriod(period: 'monthly' | 'yearly'): PlanConfig[] {
  return [
    FREE_PLAN,
    ...PRICING_PLANS.filter(p => p.billing_period === period && p.tier !== 'free' && p.is_active),
  ];
}

/** Get all paid plans */
export function getPaidPlans(): PlanConfig[] {
  return PRICING_PLANS.filter(p => p.tier !== 'free' && p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function formatPlanPrice(plan: PlanConfig): string {
  if (plan.tier === 'enterprise') return 'Custom';
  if (plan.price_cents === 0) return 'Free';

  const price = plan.price_cents / 100;
  if (plan.billing_period === 'yearly') return `$${price.toFixed(0)}/year`;
  if (plan.billing_period === 'lifetime') return `$${price.toFixed(0)}`;
  return `$${price.toFixed(0)}/month`;
}

export function formatStorage(mb: number): string {
  if (mb === -1) return 'Unlimited';
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function formatLimit(value: number | 'unlimited'): string {
  if (value === -1 || value === 'unlimited') return 'Unlimited';
  return value.toString();
}

export function comparePlanTiers(tierA: PlanTier, tierB: PlanTier): number {
  const order: Record<PlanTier, number> = {
    free: 0,
    pro: 1,
    team: 2,
    enterprise: 3,
  };
  return (order[tierA] ?? 0) - (order[tierB] ?? 0);
}

export function canUpgrade(currentTier: PlanTier, targetTier: PlanTier): boolean {
  return comparePlanTiers(currentTier, targetTier) < 0;
}

// Legacy compatibility exports

/** @deprecated Add-ons removed in new pricing. Kept for backward compat. */
export interface AddonConfig {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  extra_boards: number;
  extra_storage_mb: number;
  checkout_url: string;
  polar_product_id?: string;
  is_active: boolean;
}

/** @deprecated Add-ons removed in new pricing. Returns empty array. */
export const ADDONS: AddonConfig[] = [];

export function getActiveAddons(): AddonConfig[] { return []; }
export function getPlanCheckoutUrl(plan: PlanConfig): string | null {
  return plan.checkout_url || null;
}

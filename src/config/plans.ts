import {
  FREE_PLAN_STORAGE_MB,
  FREE_PLAN_STORAGE_DISPLAY,
  FREE_PLAN_BOARDS,
  FREE_PLAN_BLOCKS_PER_BOARD,
  FREE_PLAN_SEATS,
  FREE_PLAN_MESSAGES_PER_DAY,
  FREE_PLAN_API_KEYS,
} from './plan-constants';

import type { PlanCapabilities } from '@/types';

export type PlanCategory = 'individual' | 'team' | 'lifetime' | 'addon';
export type PlanTier = 'free' | 'starter' | 'pro' | 'team' | 'enterprise';
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
}

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

const FREE_CAPABILITIES: PlanCapabilities = { ...BASE_CAPABILITIES };

const PRO_CAPABILITIES: PlanCapabilities = {
  ...BASE_CAPABILITIES,
  custom_models: true,
  export_json: true,
};

const PRO_TEAM_CAPABILITIES: PlanCapabilities = {
  ...PRO_CAPABILITIES,
  sso_enabled: true,
  audit_logs: true,
  custom_branding: true,
};

/**
 * ============================================
 * FREE PLAN
 * ============================================
 */
const FREE_PLAN: PlanConfig = {
  id: 'free',
  name: 'Free',
  tier: 'free',
  category: 'individual',
  description: 'Perfect for trying out MultiBlock',
  price_cents: 0,
  billing_period: 'monthly',
  boards: 1,
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
    'Basic AI models',
    'Community support',
  ],
  capabilities: FREE_CAPABILITIES,
  badge: 'Free Forever',
  sort_order: 0,
  is_active: true,
};

/**
 * ============================================
 * PRO INDIVIDUAL (Annual) - was Starter Individual
 * ============================================
 */
const PRO_INDIVIDUAL_ANNUAL: PlanConfig = {
  id: 'starter-individual-annual',
  name: 'Pro',
  tier: 'pro',
  category: 'individual',
  description: 'For individuals getting started',
  price_cents: 3000,
  billing_period: 'yearly',
  boards: 50,
  blocks_per_board: 'unlimited',
  storage_mb: 2048,
  seats: 1,
  messages_per_day: -1,
  api_keys: 5,
  features: [
    '50 boards',
    'Unlimited blocks',
    '2 GB storage',
    '1 seat',
    '1-year access',
    'All AI models',
    'Export to JSON',
    'Email support',
  ],
  capabilities: PRO_CAPABILITIES,
  badge: '1-Year Access',
  sort_order: 1,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v',
};

/**
 * ============================================
 * PRO TEAM (Annual) - was Starter Team
 * ============================================
 */
const PRO_TEAM_ANNUAL: PlanConfig = {
  id: 'starter-team-annual',
  name: 'Pro Team',
  tier: 'pro',
  category: 'team',
  description: 'For small teams getting started',
  price_cents: 3900,
  billing_period: 'yearly',
  boards: 50,
  blocks_per_board: 'unlimited',
  storage_mb: 5120,
  seats: 10,
  messages_per_day: -1,
  api_keys: 10,
  features: [
    '50 boards',
    'Unlimited blocks',
    '5 GB storage',
    'Up to 10 seats',
    '1-year access',
    'All AI models',
    'Team collaboration',
    'Email support',
  ],
  capabilities: PRO_TEAM_CAPABILITIES,
  badge: '1-Year Access',
  sort_order: 2,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy',
};

/**
 * ============================================
 * PRO LIFETIME (Individual) - was LTD Starter Individual
 * ============================================
 */
const PRO_LIFETIME_INDIVIDUAL: PlanConfig = {
  id: 'ltd-starter-individual',
  name: 'Pro Lifetime',
  tier: 'pro',
  category: 'lifetime',
  description: 'Lifetime access for individuals',
  price_cents: 12000,
  billing_period: 'lifetime',
  boards: 50,
  blocks_per_board: 'unlimited',
  storage_mb: 6144,
  seats: 1,
  messages_per_day: -1,
  api_keys: 5,
  features: [
    '50 boards',
    'Unlimited blocks',
    '6 GB storage',
    '1 seat',
    'Lifetime access',
    'All AI models',
    'Export to JSON',
    'Priority support',
  ],
  capabilities: PRO_CAPABILITIES,
  highlight: true,
  badge: 'Lifetime Deal',
  sort_order: 3,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw',
};

/**
 * ============================================
 * PRO LIFETIME TEAM - was LTD Starter Team
 * ============================================
 */
const PRO_LIFETIME_TEAM: PlanConfig = {
  id: 'ltd-starter-team',
  name: 'Pro Lifetime Team',
  tier: 'pro',
  category: 'lifetime',
  description: 'Lifetime access for teams',
  price_cents: 12900,
  billing_period: 'lifetime',
  boards: 150,
  blocks_per_board: 'unlimited',
  storage_mb: 8192,
  seats: 10,
  messages_per_day: -1,
  api_keys: 10,
  features: [
    '150 boards',
    'Unlimited blocks',
    '8 GB storage',
    'Up to 10 seats',
    'Lifetime access',
    'All AI models',
    'Team collaboration',
    'Priority support',
  ],
  capabilities: PRO_TEAM_CAPABILITIES,
  badge: 'Lifetime Deal',
  sort_order: 4,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc',
};

/**
 * ============================================
 * STORAGE ADD-ONS (STACKABLE)
 * ============================================
 */
export const ADDONS: AddonConfig[] = [
  {
    id: 'addon-1gb',
    name: '+1 GB Add-On',
    description: '+1 GB storage + 10 boards',
    price_cents: 500,
    extra_boards: 10,
    extra_storage_mb: 1024,
    checkout_url: 'https://buy.polar.sh/polar_cl_OBo7BCQ6ZYvqCFhc59DMFZJqfSg2ORRsow1RI3e8hEM',
    is_active: true,
  },
  {
    id: 'addon-2gb',
    name: '+2 GB Add-On',
    description: '+2 GB storage + 20 boards',
    price_cents: 600,
    extra_boards: 20,
    extra_storage_mb: 2048,
    checkout_url: 'https://buy.polar.sh/polar_cl_3jJPkH6afjDo1zVJUsauoPKlIclTotWyV9ssE006a3k',
    is_active: true,
  },
  {
    id: 'addon-4gb',
    name: '+4 GB Add-On',
    description: '+4 GB storage + 50 boards',
    price_cents: 900,
    extra_boards: 50,
    extra_storage_mb: 4096,
    checkout_url: 'https://buy.polar.sh/polar_cl_1Oj5sYbfwJyVjmzPXnnjnlr9YS2TVCQd7OsyG1IzSMj',
    is_active: true,
  },
  {
    id: 'addon-5gb',
    name: '+5 GB Add-On',
    description: '+5 GB storage + 60 boards',
    price_cents: 1000,
    extra_boards: 60,
    extra_storage_mb: 5120,
    checkout_url: 'https://buy.polar.sh/polar_cl_BL5ku7NkvCcIsfr2pjq1gHnmn5sN87tkja0IP0PaJDT',
    is_active: true,
  },
  {
    id: 'addon-10gb',
    name: '+10 GB Add-On',
    description: '+10 GB storage + 120 boards',
    price_cents: 1800,
    extra_boards: 120,
    extra_storage_mb: 10240,
    checkout_url: 'https://buy.polar.sh/polar_cl_JCkbiUFVssy28q7auRRSmERW2XUwIhqt2JnrY2yCy9b',
    is_active: true,
  },
];

/**
 * ============================================
 * ALL PRICING PLANS (EXPORT)
 * ============================================
 */
export const PRICING_PLANS: PlanConfig[] = [
  FREE_PLAN,
  PRO_INDIVIDUAL_ANNUAL,
  PRO_TEAM_ANNUAL,
  PRO_LIFETIME_INDIVIDUAL,
  PRO_LIFETIME_TEAM,
];

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

export function getPlanById(planId: string): PlanConfig | undefined {
  return PRICING_PLANS.find(p => p.id === planId);
}

export function getPlansByCategory(category: PlanCategory): PlanConfig[] {
  return PRICING_PLANS.filter(p => p.category === category && p.is_active);
}

/** Get all paid plans (excluding free) */
export function getPaidPlans(): PlanConfig[] {
  return PRICING_PLANS.filter(p => p.tier !== 'free' && p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getIndividualAnnualPlans(): PlanConfig[] {
  return PRICING_PLANS.filter(p => 
    p.category === 'individual' && 
    p.billing_period === 'yearly' && 
    p.is_active
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export function getTeamAnnualPlans(): PlanConfig[] {
  return PRICING_PLANS.filter(p => 
    p.category === 'team' && 
    p.billing_period === 'yearly' && 
    p.tier !== 'enterprise' &&
    p.is_active
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export function getLifetimePlans(): PlanConfig[] {
  return PRICING_PLANS.filter(p => 
    p.billing_period === 'lifetime' && 
    p.is_active
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export function getIndividualLifetimePlans(): PlanConfig[] {
  return PRICING_PLANS.filter(p => 
    p.billing_period === 'lifetime' && 
    p.seats === 1 &&
    p.is_active
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export function getTeamLifetimePlans(): PlanConfig[] {
  return PRICING_PLANS.filter(p => 
    p.billing_period === 'lifetime' && 
    p.seats > 1 &&
    p.is_active
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export function getActiveAddons(): AddonConfig[] {
  return ADDONS.filter(a => a.is_active);
}

export function getFreePlan(): PlanConfig {
  return FREE_PLAN;
}

export function getPlanCheckoutUrl(plan: PlanConfig): string | null {
  return plan.checkout_url || null;
}

export function comparePlanTiers(tierA: PlanTier, tierB: PlanTier): number {
  const order: Record<PlanTier, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    team: 3,
    enterprise: 4,
  };
  return order[tierA] - order[tierB];
}

export function canUpgrade(currentTier: PlanTier, targetTier: PlanTier): boolean {
  return comparePlanTiers(currentTier, targetTier) < 0;
}

export function formatPlanPrice(plan: PlanConfig): string {
  if (plan.tier === 'enterprise') return 'Custom';
  if (plan.price_cents === 0) return 'Free';
  
  const price = plan.price_cents / 100;
  if (plan.billing_period === 'lifetime') return `$${price.toFixed(2)}`;
  if (plan.billing_period === 'yearly') return `$${price.toFixed(2)}/year`;
  return `$${price.toFixed(2)}/month`;
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

export function getPlanIdByCheckoutUrl(url: string): string | undefined {
  const plan = PRICING_PLANS.find(p => p.checkout_url === url);
  return plan?.id;
}

export function getAllCheckoutMappings(): Record<string, { planId: string; isLifetime: boolean; seats: number; boards: number; storageMb: number }> {
  const mappings: Record<string, { planId: string; isLifetime: boolean; seats: number; boards: number; storageMb: number }> = {};
  
  for (const plan of PRICING_PLANS) {
    if (plan.checkout_url) {
      mappings[plan.checkout_url] = {
        planId: plan.id,
        isLifetime: plan.billing_period === 'lifetime',
        seats: plan.seats,
        boards: plan.boards,
        storageMb: plan.storage_mb,
      };
    }
  }
  
  return mappings;
}

export function getAddonByCheckoutUrl(url: string): AddonConfig | undefined {
  return ADDONS.find(a => a.checkout_url === url);
}

/**
 * Pricing Plans Configuration
 * 
 * EXACT plan data with correct Polar embed checkout URLs
 * Categories: Individual Annual, Team Annual, Lifetime Deals, Add-ons
 */

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
  // Limits
  boards: number;
  blocks_per_board: number | 'unlimited';
  storage_mb: number;
  seats: number;
  messages_per_day: number;
  api_keys: number;
  // Features list for display
  features: string[];
  capabilities: PlanCapabilities;
  // UI
  highlight?: boolean;
  badge?: string;
  sort_order: number;
  is_active: boolean;
  // Polar checkout URL for embed
  checkout_url?: string;
  // Polar product ID for webhook mapping
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

const STARTER_CAPABILITIES: PlanCapabilities = {
  ...BASE_CAPABILITIES,
  custom_models: true,
  export_json: true,
};

const PRO_CAPABILITIES: PlanCapabilities = {
  ...BASE_CAPABILITIES,
  api_access: true,
  custom_models: true,
  priority_support: true,
  export_json: true,
  export_pdf: true,
  webhooks: true,
  advanced_analytics: true,
};

const TEAM_CAPABILITIES: PlanCapabilities = {
  ...PRO_CAPABILITIES,
  sso_enabled: true,
  audit_logs: true,
  custom_branding: true,
};

const ENTERPRISE_CAPABILITIES: PlanCapabilities = {
  ...TEAM_CAPABILITIES,
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
  blocks_per_board: 3,
  storage_mb: 100,
  seats: 1,
  messages_per_day: 50,
  api_keys: 2,
  features: [
    '1 board',
    '3 blocks per board',
    '100 MB storage',
    '50 messages/day',
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
 * INDIVIDUAL ANNUAL PLANS
 * ============================================
 */
const INDIVIDUAL_STARTER_ANNUAL: PlanConfig = {
  id: 'starter-individual-annual',
  name: 'Starter',
  tier: 'starter',
  category: 'individual',
  description: 'For individuals getting started',
  price_cents: 9999, // $99.99/year
  billing_period: 'yearly',
  boards: 50,
  blocks_per_board: 'unlimited',
  storage_mb: 2048, // 2 GB
  seats: 1,
  messages_per_day: -1, // unlimited
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
  capabilities: STARTER_CAPABILITIES,
  badge: 'Great Start',
  sort_order: 1,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v',
};

const INDIVIDUAL_PRO_ANNUAL: PlanConfig = {
  id: 'pro-individual-annual',
  name: 'Pro',
  tier: 'pro',
  category: 'individual',
  description: 'For power users and professionals',
  price_cents: 14999, // $149.99/year
  billing_period: 'yearly',
  boards: 100,
  blocks_per_board: 'unlimited',
  storage_mb: 4096, // 4 GB
  seats: 1,
  messages_per_day: -1,
  api_keys: 10,
  features: [
    '100 boards',
    'Unlimited blocks',
    '4 GB storage',
    '1 seat',
    '1-year access',
    'All AI models',
    'Priority support',
    'Export to JSON & PDF',
    'API access',
    'Webhooks',
  ],
  capabilities: PRO_CAPABILITIES,
  highlight: true,
  badge: 'Most Popular',
  sort_order: 2,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_0ANxHBAcEKSneKreosoVddmOPsNRvBMDaHKgv1QrrU9',
};

/**
 * ============================================
 * TEAM ANNUAL PLANS
 * ============================================
 */
const TEAM_STARTER_ANNUAL: PlanConfig = {
  id: 'starter-team-annual',
  name: 'Starter',
  tier: 'starter',
  category: 'team',
  description: 'For small teams getting started',
  price_cents: 12999, // $129.99/year
  billing_period: 'yearly',
  boards: 50,
  blocks_per_board: 'unlimited',
  storage_mb: 5120, // 5 GB
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
  capabilities: TEAM_CAPABILITIES,
  badge: 'Team Start',
  sort_order: 1,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy',
};

const TEAM_PRO_ANNUAL: PlanConfig = {
  id: 'pro-team-annual',
  name: 'Pro',
  tier: 'pro',
  category: 'team',
  description: 'For growing teams',
  price_cents: 17999, // $179.99/year
  billing_period: 'yearly',
  boards: 100,
  blocks_per_board: 'unlimited',
  storage_mb: 6144, // 6 GB
  seats: 20,
  messages_per_day: -1,
  api_keys: 25,
  features: [
    '100 boards',
    'Unlimited blocks',
    '6 GB storage',
    'Up to 20 seats',
    '1-year access',
    'All AI models',
    'Priority support',
    'Admin dashboard',
    'SSO integration',
    'Audit logs',
  ],
  capabilities: TEAM_CAPABILITIES,
  highlight: true,
  badge: 'Best Value',
  sort_order: 2,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_kEOB6DUJjs7JONbOH91zrlACAQDEub2L9px0f3s4BuS',
};

/**
 * ============================================
 * LIFETIME DEALS (LTD) - INDIVIDUAL
 * ============================================
 */
const LTD_STARTER_INDIVIDUAL: PlanConfig = {
  id: 'ltd-starter-individual',
  name: 'LTD Starter',
  tier: 'starter',
  category: 'lifetime',
  description: 'Lifetime access for individuals',
  price_cents: 39999, // $399.99
  billing_period: 'lifetime',
  boards: 50,
  blocks_per_board: 'unlimited',
  storage_mb: 6144, // 6 GB
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
  capabilities: STARTER_CAPABILITIES,
  badge: 'Lifetime',
  sort_order: 1,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw',
};

const LTD_PRO_INDIVIDUAL: PlanConfig = {
  id: 'ltd-pro-individual',
  name: 'LTD Pro',
  tier: 'pro',
  category: 'lifetime',
  description: 'Lifetime Pro for individuals',
  price_cents: 49999, // $499.99
  billing_period: 'lifetime',
  boards: 150,
  blocks_per_board: 'unlimited',
  storage_mb: 7168, // 7 GB
  seats: 1,
  messages_per_day: -1,
  api_keys: 10,
  features: [
    '150 boards',
    'Unlimited blocks',
    '7 GB storage',
    '1 seat',
    'Lifetime access',
    'All AI models',
    'Priority support',
    'Export to JSON & PDF',
    'API access',
    'Webhooks',
  ],
  capabilities: PRO_CAPABILITIES,
  highlight: true,
  badge: 'Best LTD',
  sort_order: 2,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_j6g5GaxCZ3MqM7FVpqt6vbsqk8zUUuLyUOIgR03k0oU',
};

/**
 * ============================================
 * LIFETIME DEALS (LTD) - TEAM
 * ============================================
 */
const LTD_STARTER_TEAM: PlanConfig = {
  id: 'ltd-starter-team',
  name: 'LTD Starter Team',
  tier: 'starter',
  category: 'lifetime',
  description: 'Lifetime access for teams',
  price_cents: 42999, // $429.99
  billing_period: 'lifetime',
  boards: 150,
  blocks_per_board: 'unlimited',
  storage_mb: 8192, // 8 GB
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
  capabilities: TEAM_CAPABILITIES,
  badge: 'Team LTD',
  sort_order: 3,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc',
};

const LTD_PRO_TEAM: PlanConfig = {
  id: 'ltd-pro-team',
  name: 'LTD Pro Team',
  tier: 'pro',
  category: 'lifetime',
  description: 'Ultimate lifetime team plan',
  price_cents: 99999, // $999.99
  billing_period: 'lifetime',
  boards: 200,
  blocks_per_board: 'unlimited',
  storage_mb: 9216, // 9 GB
  seats: 15,
  messages_per_day: -1,
  api_keys: 25,
  features: [
    '200 boards',
    'Unlimited blocks',
    '9 GB storage',
    'Up to 15 seats',
    'Lifetime access',
    'All AI models',
    'Priority support',
    'Admin dashboard',
    'SSO integration',
    'Audit logs',
  ],
  capabilities: TEAM_CAPABILITIES,
  highlight: true,
  badge: 'Ultimate',
  sort_order: 4,
  is_active: true,
  checkout_url: 'https://buy.polar.sh/polar_cl_pQBNRD7r0QBz4pp47hOhg21aTfj5MLn9ffRnL0dxbnR',
};

/**
 * ============================================
 * ENTERPRISE
 * ============================================
 */
const ENTERPRISE_PLAN: PlanConfig = {
  id: 'enterprise',
  name: 'Enterprise',
  tier: 'enterprise',
  category: 'team',
  description: 'Custom solutions for large organizations',
  price_cents: 0,
  billing_period: 'yearly',
  boards: -1,
  blocks_per_board: 'unlimited',
  storage_mb: -1,
  seats: -1,
  messages_per_day: -1,
  api_keys: -1,
  features: [
    'Unlimited everything',
    'Custom integrations',
    'Dedicated support',
    'SLA guarantee',
    'Custom branding',
    'On-premise option',
    'Custom AI models',
  ],
  capabilities: ENTERPRISE_CAPABILITIES,
  badge: 'Custom',
  sort_order: 99,
  is_active: true,
};

/**
 * ============================================
 * ADD-ONS (STACKABLE) - Correct URLs
 * ============================================
 */
export const ADDONS: AddonConfig[] = [
  {
    id: 'addon-1gb',
    name: '+1 GB Add-On',
    description: '+1 GB storage + 10 boards',
    price_cents: 1499, // $14.99
    extra_boards: 10,
    extra_storage_mb: 1024, // 1 GB
    checkout_url: 'https://buy.polar.sh/polar_cl_OBo7BCQ6ZYvqCFhc59DMFZJqfSg2ORRsow1RI3e8hEM',
    is_active: true,
  },
  {
    id: 'addon-2gb',
    name: '+2 GB Add-On',
    description: '+2 GB storage + 20 boards',
    price_cents: 1999, // $19.99
    extra_boards: 20,
    extra_storage_mb: 2048, // 2 GB
    checkout_url: 'https://buy.polar.sh/polar_cl_3jJPkH6afjDo1zVJUsauoPKlIclTotWyV9ssE006a3k',
    is_active: true,
  },
  {
    id: 'addon-4gb',
    name: '+4 GB Add-On',
    description: '+4 GB storage + 50 boards',
    price_cents: 2999, // $29.99
    extra_boards: 50,
    extra_storage_mb: 4096, // 4 GB
    checkout_url: 'https://buy.polar.sh/polar_cl_1Oj5sYbfwJyVjmzPXnnjnlr9YS2TVCQd7OsyG1IzSMj',
    is_active: true,
  },
  {
    id: 'addon-5gb',
    name: '+5 GB Add-On',
    description: '+5 GB storage + 60 boards',
    price_cents: 3499, // $34.99
    extra_boards: 60,
    extra_storage_mb: 5120, // 5 GB
    checkout_url: 'https://buy.polar.sh/polar_cl_BL5ku7NkvCcIsfr2pjq1gHnmn5sN87tkja0IP0PaJDT',
    is_active: true,
  },
  {
    id: 'addon-10gb',
    name: '+10 GB Add-On',
    description: '+10 GB storage + 120 boards',
    price_cents: 5999, // $59.99
    extra_boards: 120,
    extra_storage_mb: 10240, // 10 GB
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
  // Individual Annual
  INDIVIDUAL_STARTER_ANNUAL,
  INDIVIDUAL_PRO_ANNUAL,
  // Team Annual
  TEAM_STARTER_ANNUAL,
  TEAM_PRO_ANNUAL,
  // Lifetime Individual
  LTD_STARTER_INDIVIDUAL,
  LTD_PRO_INDIVIDUAL,
  // Lifetime Team
  LTD_STARTER_TEAM,
  LTD_PRO_TEAM,
  // Enterprise
  ENTERPRISE_PLAN,
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

export function getEnterprisePlan(): PlanConfig {
  return ENTERPRISE_PLAN;
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

/**
 * Map Polar checkout URLs to plan IDs for webhook handling
 */
export function getPlanIdByCheckoutUrl(url: string): string | undefined {
  const plan = PRICING_PLANS.find(p => p.checkout_url === url);
  return plan?.id;
}

/**
 * Get all checkout URL to plan ID mappings (for webhook)
 */
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

/**
 * Get addon by checkout URL
 */
export function getAddonByCheckoutUrl(url: string): AddonConfig | undefined {
  return ADDONS.find(a => a.checkout_url === url);
}

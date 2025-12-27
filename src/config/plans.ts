/**
 * Pricing Plans Configuration
 * 
 * Plan tiers: free, starter, pro, team, enterprise
 * Checkout URLs from env vars (VITE_ prefix for Vite)
 */

import type { PlanCapabilities } from '@/types';

export type PlanTier = 'free' | 'starter' | 'pro' | 'team' | 'enterprise';

export interface PlanConfig {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  price_cents: number;
  billing_period: 'monthly' | 'yearly' | 'lifetime';
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
  // Checkout
  checkout_url_key?: string; // env var key for checkout URL
}

// Capabilities by tier
const FREE_CAPABILITIES: PlanCapabilities = {
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

const STARTER_CAPABILITIES: PlanCapabilities = {
  api_access: false,
  custom_models: true,
  priority_support: false,
  export_json: true,
  export_pdf: false,
  sso_enabled: false,
  audit_logs: false,
  custom_branding: false,
  webhooks: false,
  advanced_analytics: false,
};

const PRO_CAPABILITIES: PlanCapabilities = {
  api_access: true,
  custom_models: true,
  priority_support: true,
  export_json: true,
  export_pdf: true,
  sso_enabled: false,
  audit_logs: false,
  custom_branding: false,
  webhooks: true,
  advanced_analytics: true,
};

const TEAM_CAPABILITIES: PlanCapabilities = {
  api_access: true,
  custom_models: true,
  priority_support: true,
  export_json: true,
  export_pdf: true,
  sso_enabled: true,
  audit_logs: true,
  custom_branding: true,
  webhooks: true,
  advanced_analytics: true,
};

const ENTERPRISE_CAPABILITIES: PlanCapabilities = {
  api_access: true,
  custom_models: true,
  priority_support: true,
  export_json: true,
  export_pdf: true,
  sso_enabled: true,
  audit_logs: true,
  custom_branding: true,
  webhooks: true,
  advanced_analytics: true,
};

/**
 * All available pricing plans
 */
export const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
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
  },
  {
    id: 'starter',
    name: 'Starter',
    tier: 'starter',
    description: 'For individuals getting started',
    price_cents: 4900, // $49/year
    billing_period: 'yearly',
    boards: 10,
    blocks_per_board: 10,
    storage_mb: 1024, // 1 GB
    seats: 1,
    messages_per_day: 200,
    api_keys: 5,
    features: [
      '10 boards',
      '10 blocks per board',
      '1 GB storage',
      '200 messages/day',
      'All AI models',
      'Export to JSON',
      'Email support',
    ],
    capabilities: STARTER_CAPABILITIES,
    badge: 'Great Start',
    sort_order: 1,
    is_active: true,
    checkout_url_key: 'VITE_POLAR_STARTER_CHECKOUT_URL',
  },
  {
    id: 'pro',
    name: 'Pro',
    tier: 'pro',
    description: 'For power users and professionals',
    price_cents: 9900, // $99/year
    billing_period: 'yearly',
    boards: 50,
    blocks_per_board: 'unlimited',
    storage_mb: 5120, // 5 GB
    seats: 1,
    messages_per_day: -1, // unlimited
    api_keys: 10,
    features: [
      '50 boards',
      'Unlimited blocks',
      '5 GB storage',
      'Unlimited messages',
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
    checkout_url_key: 'VITE_POLAR_PRO_CHECKOUT_URL',
  },
  {
    id: 'team',
    name: 'Team',
    tier: 'team',
    description: 'For small teams collaborating together',
    price_cents: 19900, // $199/year
    billing_period: 'yearly',
    boards: 100,
    blocks_per_board: 'unlimited',
    storage_mb: 20480, // 20 GB
    seats: 5,
    messages_per_day: -1,
    api_keys: 25,
    features: [
      '100 boards',
      'Unlimited blocks',
      '20 GB storage',
      '5 team seats',
      'Unlimited messages',
      'All AI models',
      'Team collaboration',
      'Admin dashboard',
      'SSO integration',
      'Audit logs',
      'Priority support',
    ],
    capabilities: TEAM_CAPABILITIES,
    badge: 'For Teams',
    sort_order: 3,
    is_active: true,
    checkout_url_key: 'VITE_POLAR_TEAM_CHECKOUT_URL',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    description: 'Custom solutions for large organizations',
    price_cents: 0, // Contact for pricing
    billing_period: 'yearly',
    boards: -1, // unlimited
    blocks_per_board: 'unlimited',
    storage_mb: -1, // unlimited
    seats: -1, // unlimited
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
    sort_order: 4,
    is_active: true,
  },
];

/**
 * Get a plan by its ID
 */
export function getPlanById(planId: string): PlanConfig | undefined {
  return PRICING_PLANS.find(p => p.id === planId);
}

/**
 * Get plans by tier
 */
export function getPlansByTier(tier: PlanTier): PlanConfig[] {
  return PRICING_PLANS.filter(p => p.tier === tier && p.is_active);
}

/**
 * Get checkout URL for a plan from environment
 */
export function getPlanCheckoutUrl(plan: PlanConfig): string | null {
  if (!plan.checkout_url_key) return null;
  
  // Access Vite env vars
  const url = import.meta.env[plan.checkout_url_key];
  return url || null;
}

/**
 * Compare plan tiers (returns -1, 0, or 1)
 */
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

/**
 * Check if user can upgrade from current tier to target tier
 */
export function canUpgrade(currentTier: PlanTier, targetTier: PlanTier): boolean {
  return comparePlanTiers(currentTier, targetTier) < 0;
}

/**
 * Format price for display
 */
export function formatPlanPrice(plan: PlanConfig): string {
  if (plan.tier === 'enterprise') return 'Custom';
  if (plan.price_cents === 0) return 'Free';
  
  const price = plan.price_cents / 100;
  const period = plan.billing_period === 'yearly' ? '/year' : '/month';
  return `$${price}${period}`;
}

/**
 * Format storage for display
 */
export function formatStorage(mb: number): string {
  if (mb === -1) return 'Unlimited';
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  }
  return `${mb} MB`;
}

/**
 * Format limit for display (handles -1 as unlimited)
 */
export function formatLimit(value: number | 'unlimited'): string {
  if (value === -1 || value === 'unlimited') return 'Unlimited';
  return value.toString();
}

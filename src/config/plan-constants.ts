/**
 * Plan Constants - Single Source of Truth
 * Updated for monthly-first pricing model (Feb 2026)
 */

// ============================================
// FREE PLAN LIMITS
// ============================================

export const FREE_PLAN_STORAGE_MB = 100;
export const FREE_PLAN_STORAGE_DISPLAY = `${FREE_PLAN_STORAGE_MB} MB`;
export const FREE_PLAN_BOARDS = 1;
export const FREE_PLAN_BLOCKS_PER_BOARD = 3;
export const FREE_PLAN_SEATS = 1;
export const FREE_PLAN_MESSAGES_PER_DAY = 50;
export const FREE_PLAN_API_KEYS = 3;
export const FREE_PLAN_HISTORY_DAYS = 7;

// ============================================
// PRO PLAN LIMITS
// ============================================

export const PRO_PLAN_BOARDS = 50;
export const PRO_PLAN_STORAGE_MB = 5120; // 5 GB
export const PRO_PLAN_STORAGE_GB = 5;
export const PRO_PLAN_BLOCKS_PER_BOARD = null; // unlimited
export const PRO_PLAN_MESSAGES_PER_DAY = null; // unlimited
export const PRO_PLAN_SEATS = 1;

// ============================================
// TEAM PLAN LIMITS
// ============================================

export const TEAM_PLAN_BOARDS = 50;
export const TEAM_PLAN_STORAGE_MB = 20480; // 20 GB
export const TEAM_PLAN_STORAGE_GB = 20;
export const TEAM_PLAN_BLOCKS_PER_BOARD = null; // unlimited
export const TEAM_PLAN_MESSAGES_PER_DAY = null; // unlimited
export const TEAM_PLAN_SEATS = 10;

// ============================================
// PRICING
// ============================================

export const PRO_MONTHLY_PRICE = 19;
export const PRO_ANNUAL_PRICE = 182;
export const PRO_ANNUAL_SAVINGS = 46;

export const TEAM_MONTHLY_PRICE = 49;
export const TEAM_ANNUAL_PRICE = 470;
export const TEAM_ANNUAL_SAVINGS = 118;

export const TRIAL_DAYS = 3; // Monthly plans only

// ============================================
// POLAR PRODUCT IDS
// ============================================

export const POLAR_PRODUCT_IDS = {
  'pro-monthly': '8756df4f-5d81-4e88-8f9f-0e8d2dfe03a3',
  'pro-annual': '7ce03e88-d1a3-45f7-a60d-f282aa83e94a',
  'team-monthly': 'bbace997-28ad-4afe-877e-b932e41e29c6',
  'team-annual': '4bf80645-0f04-4cac-b614-35af721dc294',
} as const;

// ============================================
// CONVERSION UTILITIES
// ============================================

export const gbToMb = (gb: number): number => gb * 1024;
export const mbToGb = (mb: number): number => mb / 1024;

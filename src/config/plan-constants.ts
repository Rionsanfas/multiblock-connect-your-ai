/**
 * Plan Constants - Single Source of Truth
 * 
 * The Free plan storage is exactly 100 MB.
 */

// ============================================
// FREE PLAN STORAGE
// ============================================

export const FREE_PLAN_STORAGE_MB = 100;

// Display string for UI
export const FREE_PLAN_STORAGE_DISPLAY = `${FREE_PLAN_STORAGE_MB} MB`;

// ============================================
// FREE PLAN OTHER LIMITS
// ============================================

export const FREE_PLAN_BOARDS = 1;
export const FREE_PLAN_BLOCKS_PER_BOARD = 3;
export const FREE_PLAN_SEATS = 1;
export const FREE_PLAN_MESSAGES_PER_DAY = 50;
export const FREE_PLAN_API_KEYS = 3;

// ============================================
// CONVERSION UTILITIES
// ============================================

export const gbToMb = (gb: number): number => gb * 1024;
export const mbToGb = (mb: number): number => mb / 1024;

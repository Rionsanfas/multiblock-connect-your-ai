/**
 * Plan Constants - Single Source of Truth
 * 
 * All plan limits should derive from these constants.
 * This ensures consistency across frontend, backend, and database.
 */

// ============================================
// FREE PLAN STORAGE
// ============================================

/**
 * Free plan storage in gigabytes (canonical value)
 * This is the marketing/display value
 */
export const FREE_PLAN_STORAGE_GB = 0.1;

/**
 * Free plan storage in megabytes (derived)
 * 0.1 GB = 102.4 MB
 * 
 * NOTE: The database column `storage_mb` is INTEGER, so we store 102.
 * For enforcement, we use 102 MB (rounded down from 102.4).
 * This is a conservative approach - users get slightly less than 0.1 GB.
 */
export const FREE_PLAN_STORAGE_MB_EXACT = FREE_PLAN_STORAGE_GB * 1024; // 102.4

/**
 * Free plan storage as stored in database (integer)
 * We round down to be conservative with limits
 */
export const FREE_PLAN_STORAGE_MB_DB = Math.floor(FREE_PLAN_STORAGE_MB_EXACT); // 102

// ============================================
// FREE PLAN OTHER LIMITS
// ============================================

export const FREE_PLAN_BOARDS = 1;
export const FREE_PLAN_BLOCKS_PER_BOARD = 3;
export const FREE_PLAN_SEATS = 1;
export const FREE_PLAN_MESSAGES_PER_DAY = 50;
export const FREE_PLAN_API_KEYS = 3;

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Returns the user-friendly storage display string
 * We display "0.1 GB" for marketing clarity, not "102 MB"
 */
export const FREE_PLAN_STORAGE_DISPLAY = `${FREE_PLAN_STORAGE_GB} GB`;

/**
 * Alternative MB display (for detailed views)
 */
export const FREE_PLAN_STORAGE_MB_DISPLAY = `${FREE_PLAN_STORAGE_MB_DB} MB`;

// ============================================
// CONVERSION UTILITIES
// ============================================

export const gbToMb = (gb: number): number => gb * 1024;
export const mbToGb = (mb: number): number => mb / 1024;

/**
 * Development-only Logger
 * 
 * Provides conditional logging that only outputs in development mode.
 * Prevents information leakage in production builds.
 */

const isDev = import.meta.env.DEV;

/**
 * Development-only console.log wrapper
 * Only logs when in development mode (import.meta.env.DEV === true)
 */
export const devLog = (...args: unknown[]): void => {
  if (isDev) {
    console.log(...args);
  }
};

/**
 * Development-only console.warn wrapper
 */
export const devWarn = (...args: unknown[]): void => {
  if (isDev) {
    console.warn(...args);
  }
};

/**
 * Development-only console.error wrapper
 * Note: In production, errors are still logged but without sensitive details
 */
export const devError = (...args: unknown[]): void => {
  if (isDev) {
    console.error(...args);
  }
};

/**
 * Production-safe error logging
 * Logs a sanitized error message in production, full details in dev
 */
export const safeError = (context: string, error: unknown): void => {
  if (isDev) {
    console.error(`[${context}]`, error);
  } else {
    // In production, log only the context without sensitive error details
    console.error(`[${context}] An error occurred`);
  }
};

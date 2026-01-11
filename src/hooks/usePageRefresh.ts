/**
 * usePageRefresh - Smart query refresh on page mount
 * 
 * Optimized to only invalidate stale data, not refetch everything.
 * Uses soft invalidation to mark as stale without blocking UI.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

interface PageRefreshConfig {
  /**
   * Query keys to invalidate when this page mounts
   */
  queryKeys: string[][];
  /**
   * Optional: Only invalidate if this condition is true
   */
  enabled?: boolean;
  /**
   * Soft invalidation - marks stale but doesn't force refetch (default: true)
   * This prevents blocking the UI while data refreshes in background
   */
  soft?: boolean;
}

/**
 * Invalidates specified queries when the page mounts
 * Optimized: Only runs once per mount, not on every route change
 */
export function usePageRefresh(config: PageRefreshConfig) {
  const queryClient = useQueryClient();
  const { queryKeys, enabled = true, soft = true } = config;
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (!enabled || hasRefreshed.current) return;
    hasRefreshed.current = true;

    // Use background invalidation to avoid blocking
    queryKeys.forEach((queryKey) => {
      if (soft) {
        // Mark as stale without triggering immediate refetch
        // Data will refetch on next access or window focus
        queryClient.invalidateQueries({ 
          queryKey,
          refetchType: 'none', // Don't refetch immediately
        });
      } else {
        queryClient.invalidateQueries({ queryKey });
      }
    });
  }, [queryClient, enabled]);
  
  // Reset on unmount so next mount refreshes
  useEffect(() => {
    return () => {
      hasRefreshed.current = false;
    };
  }, []);
}

/**
 * Pre-configured page refresh for Dashboard
 * Soft invalidation - data refreshes in background
 */
export function useDashboardRefresh() {
  usePageRefresh({
    queryKeys: [
      ['workspace-boards'],
      ['user-subscription'],
      ['user-entitlements'],
    ],
    soft: true, // Background refresh - no blocking
  });
}

/**
 * Pre-configured page refresh for API Keys page
 */
export function useApiKeysRefresh() {
  usePageRefresh({
    queryKeys: [
      ['api-keys'],
      ['team-api-keys'],
    ],
    soft: true,
  });
}

/**
 * Pre-configured page refresh for Team Settings
 */
export function useTeamSettingsRefresh() {
  usePageRefresh({
    queryKeys: [
      ['team-members'],
      ['team-invitations'],
      ['user-teams'],
    ],
    soft: true,
  });
}

/**
 * Pre-configured page refresh for Pricing page
 */
export function usePricingRefresh() {
  usePageRefresh({
    queryKeys: [
      ['user-subscription'],
      ['user-entitlements'],
      ['ltd-inventory'],
    ],
    soft: true,
  });
}

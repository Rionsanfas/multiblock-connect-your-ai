/**
 * usePageRefresh - Invalidates relevant queries on page mount
 * 
 * This hook ensures fresh data is loaded when navigating to a page.
 * Prevents stale state issues across navigation.
 */

import { useEffect } from 'react';
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
}

/**
 * Invalidates specified queries when the page mounts
 * Use this to ensure fresh data on navigation
 */
export function usePageRefresh(config: PageRefreshConfig) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { queryKeys, enabled = true } = config;

  useEffect(() => {
    if (!enabled) return;

    // Invalidate all specified queries
    queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [location.pathname, queryClient, enabled]); // Re-run on route change
}

/**
 * Pre-configured page refresh for Dashboard
 */
export function useDashboardRefresh() {
  usePageRefresh({
    queryKeys: [
      ['workspace-boards'],
      ['user-boards'],
      ['user-subscription'],
      ['user-entitlements'],
      ['user-board-count'],
    ],
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
  });
}

/**
 * useEntitlements - Hook for fetching user entitlements from new billing system
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { UserEntitlements } from '@/types/database.types';

export function useEntitlements() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-entitlements', user?.id],
    queryFn: async (): Promise<UserEntitlements | null> => {
      if (!user?.id) return null;

      // Try to fetch from the new entitlements function
      const { data, error } = await supabase
        .rpc('get_user_entitlements', { p_user_id: user.id });

      if (error) {
        console.error('Failed to fetch entitlements:', error);
        // Return free tier defaults
        return {
          boards_limit: 1,
          storage_gb: 1,
          seats: 1,
          blocks_unlimited: false,
          source_plan: 'free',
          extra_boards: 0,
          extra_storage_gb: 0,
          total_boards: 1,
          total_storage_gb: 1,
        };
      }

      // RPC returns array, take first result
      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result) {
        return {
          boards_limit: 1,
          storage_gb: 1,
          seats: 1,
          blocks_unlimited: false,
          source_plan: 'free',
          extra_boards: 0,
          extra_storage_gb: 0,
          total_boards: 1,
          total_storage_gb: 1,
        };
      }

      return result as UserEntitlements;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes - entitlements rarely change
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
  });

  // Refresh entitlements (call after checkout success)
  const refreshEntitlements = () => {
    queryClient.invalidateQueries({ queryKey: ['user-entitlements', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
  };

  return {
    entitlements: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refreshEntitlements,
    refetch: query.refetch,
  };
}

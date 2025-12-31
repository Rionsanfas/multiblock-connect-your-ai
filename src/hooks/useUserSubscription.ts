/**
 * useUserSubscription - Hook for fetching and managing user subscription data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { subscriptionsDb } from '@/lib/database';

export function useUserSubscription() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: () => subscriptionsDb.getCurrent(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes - subscription rarely changes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
  });
  
  // Function to refresh subscription data (call after checkout)
  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['user-board-count', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['user-apikey-count', user?.id] });
  };
  
  return {
    subscription: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refreshSubscription,
    refetch: query.refetch,
  };
}

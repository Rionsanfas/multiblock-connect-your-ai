import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useCallback } from "react";

export interface BillingInfo {
  polar_customer_id: string | null;
  active_plan: string;
  subscription_status: string;
  current_period_end: string | null;
  is_lifetime: boolean;
  boards: number;
  blocks: number;
  storage_gb: number;
  seats: number;
}

export function useBilling() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['billing', user?.id],
    queryFn: async (): Promise<BillingInfo | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_billing')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // PGRST116 = no rows returned, which is fine for new users
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching billing:', error);
        throw error;
      }

      return {
        polar_customer_id: data.polar_customer_id,
        active_plan: data.active_plan ?? 'free',
        subscription_status: data.subscription_status ?? 'inactive',
        current_period_end: data.current_period_end,
        is_lifetime: data.is_lifetime ?? false,
        boards: data.boards ?? 3,
        blocks: data.blocks ?? 10,
        storage_gb: data.storage_gb ?? 1,
        seats: data.seats ?? 1,
      };
    },
    enabled: !!user,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Set up real-time subscription for billing updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('billing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_billing',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Billing update received:', payload);
          // Invalidate and refetch billing data
          queryClient.invalidateQueries({ queryKey: ['billing', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const refetchBilling = useCallback(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['billing', user.id] });
    }
  }, [user, queryClient]);

  return {
    ...query,
    refetchBilling,
  };
}

export function useCustomerPortal() {
  const openCustomerPortal = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await supabase.functions.invoke('polar-customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to get customer portal');
    }

    const data = response.data as { customerPortalUrl?: string; error?: string };

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.customerPortalUrl) {
      throw new Error('No portal URL returned');
    }

    // Redirect to Polar customer portal
    window.location.href = data.customerPortalUrl;
  };

  return { openCustomerPortal };
}

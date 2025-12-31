import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useCallback } from "react";

export interface BillingInfo {
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  product_id: string | null;
  active_plan: string;
  plan_category: 'individual' | 'team';
  billing_type: 'annual' | 'lifetime';
  subscription_status: string;
  current_period_end: string | null;
  access_expires_at: string | null;
  is_lifetime: boolean;
  boards: number;
  blocks: number;
  storage_gb: number;
  seats: number;
  applied_addons: AddonEntry[];
  // Computed totals (base + addons)
  total_boards: number;
  total_storage_gb: number;
}

interface AddonEntry {
  addon_id: string;
  extra_boards: number;
  extra_storage_gb: number;
  purchased_at: string;
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
        .maybeSingle();

      if (error) {
        // PGRST116 = no rows returned, which is fine for new users
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching billing:', error);
        throw error;
      }

      if (!data) return null;

      // Parse applied addons safely
      let appliedAddons: AddonEntry[] = [];
      if (Array.isArray(data.applied_addons)) {
        appliedAddons = (data.applied_addons as unknown as AddonEntry[]).filter(
          (a): a is AddonEntry => 
            typeof a === 'object' && a !== null && 'addon_id' in a
        );
      }

      // Calculate addon bonuses
      const addonBoards = appliedAddons.reduce((sum, a) => sum + (a.extra_boards || 0), 0);
      const addonStorage = appliedAddons.reduce((sum, a) => sum + (a.extra_storage_gb || 0), 0);

      const baseBoards = data.boards ?? 1;
      const baseStorage = data.storage_gb ?? 1;

      return {
        polar_customer_id: data.polar_customer_id,
        polar_subscription_id: data.polar_subscription_id,
        product_id: data.product_id,
        active_plan: data.active_plan ?? 'free',
        plan_category: (data.plan_category as 'individual' | 'team') ?? 'individual',
        billing_type: (data.billing_type as 'annual' | 'lifetime') ?? 'annual',
        subscription_status: data.subscription_status ?? 'inactive',
        current_period_end: data.current_period_end,
        access_expires_at: data.access_expires_at,
        is_lifetime: data.is_lifetime ?? false,
        boards: baseBoards,
        blocks: data.blocks ?? -1,
        storage_gb: baseStorage,
        seats: data.seats ?? 1,
        applied_addons: appliedAddons,
        // Totals with addons stacked
        total_boards: baseBoards === -1 ? -1 : baseBoards + addonBoards,
        total_storage_gb: baseStorage === -1 ? -1 : baseStorage + addonStorage,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - billing rarely changes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
  });

  // Real-time subscription for billing updates
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

  // Helper: check if subscription is active
  const isActive = query.data?.subscription_status === 'active';
  
  // Helper: check if access has expired (for annual plans)
  const isExpired = (() => {
    if (!query.data) return false;
    if (query.data.is_lifetime) return false;
    if (!query.data.access_expires_at) return false;
    return new Date(query.data.access_expires_at) < new Date();
  })();

  // Helper: get plan display name
  const planDisplayName = (() => {
    const plan = query.data?.active_plan ?? 'free';
    const category = query.data?.plan_category ?? 'individual';
    const isLifetime = query.data?.is_lifetime ?? false;
    
    const planNames: Record<string, string> = {
      'free': 'Free',
      'starter-individual-annual': 'Starter (Individual)',
      'pro-individual-annual': 'Pro (Individual)',
      'starter-team-annual': 'Starter (Team)',
      'pro-team-annual': 'Pro (Team)',
      'ltd-starter-individual': 'LTD Starter',
      'ltd-pro-individual': 'LTD Pro',
      'ltd-starter-team': 'LTD Starter (Team)',
      'ltd-pro-team': 'LTD Pro (Team)',
    };
    
    return planNames[plan] || plan;
  })();

  return {
    ...query,
    billing: query.data,
    isActive,
    isExpired,
    planDisplayName,
    refetchBilling,
  };
}

export function useCustomerPortal() {
  const openCustomerPortal = async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please sign in to access billing');
    }

    const response = await supabase.functions.invoke('polar-customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      console.error('Customer portal error:', response.error);
      throw new Error(response.error.message || 'Failed to open billing portal');
    }

    const data = response.data as { customerPortalUrl?: string; error?: string };

    if (data.error) {
      // Handle specific error cases
      if (data.error.includes('No active subscription')) {
        throw new Error('No subscription found. Please purchase a plan first.');
      }
      throw new Error(data.error);
    }

    if (!data.customerPortalUrl) {
      throw new Error('Unable to generate billing portal link. Please try again.');
    }

    // Redirect to pre-authenticated Polar customer portal
    window.location.href = data.customerPortalUrl;
  };

  return { openCustomerPortal };
}

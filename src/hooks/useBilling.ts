import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BillingInfo {
  polar_customer_id: string | null;
  active_plan: string;
  subscription_status: string;
  current_period_end: string | null;
  is_lifetime: boolean;
}

export function useBilling() {
  const { user } = useAuth();

  return useQuery({
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

      return data;
    },
    enabled: !!user,
  });
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

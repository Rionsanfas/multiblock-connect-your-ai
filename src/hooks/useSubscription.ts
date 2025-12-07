import { useState, useEffect } from 'react';
import { supabase, Subscription } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
      }
      
      setSubscription(data);
      setLoading(false);
    };

    fetchSubscription();
  }, [user]);

  const isPro = subscription?.plan === 'pro' || subscription?.plan === 'team';
  const isTeam = subscription?.plan === 'team';
  const isFree = !subscription || subscription.plan === 'free';

  return {
    subscription,
    loading,
    isPro,
    isTeam,
    isFree,
  };
}

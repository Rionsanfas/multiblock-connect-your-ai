import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface LtdInventory {
  total_seats: number;
  remaining_seats: number;
}

export function useLtdInventory() {
  const queryClient = useQueryClient();

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['ltd-inventory'],
    queryFn: async (): Promise<LtdInventory> => {
      const { data, error } = await supabase
        .from('ltd_inventory')
        .select('total_seats, remaining_seats')
        .limit(1)
        .single();

      if (error) {
        console.error('Failed to fetch LTD inventory:', error);
        // Return defaults on error
        return { total_seats: 250, remaining_seats: 250 };
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - inventory rarely changes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnWindowFocus: false,
  });

  // Subscribe to realtime updates for LTD inventory changes
  useEffect(() => {
    const channel = supabase
      .channel('ltd_inventory_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ltd_inventory' },
        (payload) => {
          // Update cache with new data
          queryClient.setQueryData(['ltd-inventory'], payload.new as LtdInventory);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    totalSeats: inventory?.total_seats ?? 250,
    remainingSeats: inventory?.remaining_seats ?? 250,
    soldOut: (inventory?.remaining_seats ?? 250) <= 0,
    isLoading,
    error: error ? 'Failed to load inventory' : null,
  };
}
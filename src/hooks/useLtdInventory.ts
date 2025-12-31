import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LtdInventory {
  total_seats: number;
  remaining_seats: number;
}

export function useLtdInventory() {
  const [inventory, setInventory] = useState<LtdInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase
          .from('ltd_inventory')
          .select('total_seats, remaining_seats')
          .limit(1)
          .single();

        if (error) throw error;
        
        setInventory(data);
      } catch (err) {
        console.error('Failed to fetch LTD inventory:', err);
        setError('Failed to load inventory');
        // Fallback to defaults
        setInventory({ total_seats: 250, remaining_seats: 250 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('ltd_inventory_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ltd_inventory' },
        (payload) => {
          setInventory(payload.new as LtdInventory);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    totalSeats: inventory?.total_seats ?? 250,
    remainingSeats: inventory?.remaining_seats ?? 250,
    soldOut: (inventory?.remaining_seats ?? 250) <= 0,
    isLoading,
    error,
  };
}

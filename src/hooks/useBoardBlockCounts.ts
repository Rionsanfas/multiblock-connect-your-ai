/**
 * Hook to fetch block counts for boards from the database
 * Used on dashboard to show accurate block counts without loading all blocks into memory
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BoardBlockCount {
  board_id: string;
  block_count: number;
}

/**
 * Fetches block counts for all accessible boards
 * Returns a Map for O(1) lookup by board_id
 */
export function useBoardBlockCounts() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: blockCountsMap = new Map<string, number>(), isLoading } = useQuery({
    queryKey: ['board-block-counts', user?.id],
    queryFn: async () => {
      // Get block counts grouped by board_id
      const { data, error } = await supabase
        .from('blocks')
        .select('board_id');
      
      if (error) {
        console.error('[useBoardBlockCounts] Error fetching blocks:', error);
        return new Map<string, number>();
      }
      
      // Count blocks per board
      const counts = new Map<string, number>();
      for (const block of data || []) {
        const current = counts.get(block.board_id) || 0;
        counts.set(block.board_id, current + 1);
      }
      
      return counts;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnMount: 'always',
  });
  
  return {
    getBlockCount: (boardId: string) => blockCountsMap.get(boardId) ?? 0,
    isLoading,
  };
}

/**
 * useDowngradeStatus - Hook for checking board/block/key lock status
 * Used throughout the app to show lock indicators and disable actions
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useBilling } from './useBilling';
import { supabase } from '@/integrations/supabase/client';

export interface DowngradeStatus {
  isDowngraded: boolean;
  gracePeriodEndsAt: string | null;
  isInGracePeriod: boolean;
  downgradedAt: string | null;
}

export function useDowngradeStatus(): DowngradeStatus {
  const { billing } = useBilling();

  const isDowngraded = !!billing?.downgraded_at;
  const gracePeriodEndsAt = billing?.grace_period_ends_at ?? null;
  const isInGracePeriod = gracePeriodEndsAt ? new Date(gracePeriodEndsAt) > new Date() : false;

  return {
    isDowngraded,
    gracePeriodEndsAt,
    isInGracePeriod,
    downgradedAt: billing?.downgraded_at ?? null,
  };
}

/**
 * Check if a specific board is locked
 */
export function useBoardLockStatus(boardId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['board-lock-status', boardId],
    queryFn: async () => {
      if (!boardId) return { is_locked: false, locked_reason: null };
      const { data, error } = await supabase
        .from('boards')
        .select('is_locked, locked_reason')
        .eq('id', boardId)
        .maybeSingle();
      if (error || !data) return { is_locked: false, locked_reason: null };
      return { is_locked: data.is_locked ?? false, locked_reason: data.locked_reason };
    },
    enabled: !!boardId && !!user,
    staleTime: 1000 * 30,
  });
}

/**
 * Check if a specific block is locked (either directly or via parent board)
 */
export function useBlockLockStatus(blockId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['block-lock-status', blockId],
    queryFn: async () => {
      if (!blockId) return false;
      const { data, error } = await supabase.rpc('is_block_locked', { p_block_id: blockId });
      if (error) return false;
      return data as boolean;
    },
    enabled: !!blockId && !!user,
    staleTime: 1000 * 30,
  });
}

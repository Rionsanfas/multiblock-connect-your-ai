/**
 * Block Data Hooks - Supabase-first block management
 * 
 * CRITICAL: All block data comes from Supabase.
 * This hook provides:
 * 1. Block fetching by ID from Supabase
 * 2. Block syncing to Zustand for UI state
 * 3. Optimistic delete with rollback
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { blocksDb } from '@/lib/database';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import type { Block } from '@/types/database.types';

/**
 * Fetch a single block by ID from Supabase
 */
export function useBlock(blockId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['block', blockId],
    queryFn: async () => {
      if (!blockId) return null;
      console.log('[useBlock] Fetching block:', blockId);
      const block = await blocksDb.getById(blockId);
      console.log('[useBlock] Fetched block:', block?.id, 'user_id:', block?.user_id);
      return block;
    },
    enabled: !authLoading && !!user?.id && !!blockId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for optimistic block deletion
 * DELETE is optimistic - remove from UI immediately, rollback on error
 */
export function useOptimisticBlockDelete(boardId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockId: string) => {
      console.log('[useOptimisticBlockDelete] Deleting block:', blockId);
      await blocksDb.delete(blockId);
      console.log('[useOptimisticBlockDelete] Block deleted successfully');
    },
    onMutate: async (blockId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board-blocks', boardId] });

      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(['board-blocks', boardId]);

      // Optimistically remove from cache
      queryClient.setQueryData<Block[]>(['board-blocks', boardId], (old) => 
        old?.filter((b) => b.id !== blockId) ?? []
      );

      // Remove from individual block cache
      queryClient.removeQueries({ queryKey: ['block', blockId] });

      // Return a context with the snapshotted value
      return { previousBlocks };
    },
    onError: (err, blockId, context) => {
      // Rollback on error
      console.error('[useOptimisticBlockDelete] Error, rolling back:', err);
      if (context?.previousBlocks) {
        queryClient.setQueryData(['board-blocks', boardId], context.previousBlocks);
      }
      toast.error('Failed to delete block');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
    },
  });
}

/**
 * Transform Supabase block to legacy Block format for UI compatibility
 */
export function transformBlock(block: Block): import('@/types').Block {
  return {
    id: block.id,
    board_id: block.board_id,
    title: block.title || 'Untitled Block',
    type: 'chat' as const,
    model_id: block.model_id,
    system_prompt: block.system_prompt || '',
    config: { 
      temperature: 0.7, 
      max_tokens: 2048,
      width: block.width,
      height: block.height,
    },
    position: { x: block.position_x, y: block.position_y },
    created_at: block.created_at,
    updated_at: block.updated_at,
  };
}

/**
 * Sync blocks from Supabase query to Zustand store
 * This is needed because some components (like BlockChatModal) still read from Zustand
 */
export function useSyncBlocksToStore(boardId: string | undefined, supabaseBlocks: Block[]) {
  const { updateBlock: storeUpdateBlock, blocks: storeBlocks } = useAppStore();

  // Sync effect handled by parent component
  return useMemo(() => {
    return supabaseBlocks.map(transformBlock);
  }, [supabaseBlocks]);
}

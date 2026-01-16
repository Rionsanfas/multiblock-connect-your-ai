/**
 * Block Data Hooks - Supabase-first block management with optimistic UI
 * 
 * CRITICAL: Supports optimistic blocks that exist in cache before DB confirms.
 * This hook provides:
 * 1. Block fetching by ID - checks cache first for optimistic data
 * 2. Optimistic delete with proper verification
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { blocksDb } from '@/lib/database';
import { devLog, devError } from '@/lib/logger';
import { toast } from 'sonner';
import type { Block } from '@/types/database.types';

/**
 * Fetch a single block by ID
 * IMPORTANT: Checks board-blocks cache first for optimistic blocks
 * This prevents "block not found" errors when opening newly created blocks
 */
export function useBlock(blockId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['block', blockId],
    queryFn: async () => {
      if (!blockId) return null;
      
      // OPTIMIZATION: Check if block exists in any board-blocks cache (optimistic data)
      // This prevents errors when opening a block before DB confirms creation
      const allCacheKeys = queryClient.getQueryCache().getAll();
      for (const query of allCacheKeys) {
        if (query.queryKey[0] === 'board-blocks') {
          const blocks = query.state.data as Block[] | undefined;
          const cachedBlock = blocks?.find(b => b.id === blockId);
          if (cachedBlock) {
            devLog('[useBlock] Found optimistic block in cache:', blockId);
            return cachedBlock;
          }
        }
      }
      
      devLog('[useBlock] Fetching block from DB:', blockId);
      const block = await blocksDb.getById(blockId);
      devLog('[useBlock] Fetched block:', block?.id);
      return block;
    },
    enabled: !authLoading && !!user?.id && !!blockId,
    staleTime: 30 * 1000,
    // Retry quickly for optimistic blocks that might not be in DB yet
    retry: (failureCount, error) => {
      // Only retry 2 times with short delay for potential race conditions
      return failureCount < 2;
    },
    retryDelay: 500,
  });
}

/**
 * Hook for block deletion with proper Supabase verification
 * DELETE only shows success AFTER Supabase confirms
 */
export function useBlockDelete(boardId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockId: string) => {
      devLog('[useBlockDelete] Starting delete for block:', blockId);
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const result = await blocksDb.delete(blockId);
      
      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }
      
      devLog('[useBlockDelete] Block deleted successfully:', blockId);
      return result.deletedId;
    },
    onMutate: async (blockId) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['board-blocks', boardId] });

      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData<Block[]>(['board-blocks', boardId]);

      // Optimistically remove from cache
      queryClient.setQueryData<Block[]>(['board-blocks', boardId], (old) => 
        old?.filter((b) => b.id !== blockId) ?? []
      );

      // Remove from individual block cache
      queryClient.removeQueries({ queryKey: ['block', blockId] });
      
      // Also invalidate messages for this block
      queryClient.removeQueries({ queryKey: ['block-messages', blockId] });

      return { previousBlocks, blockId };
    },
    onError: (error, blockId, context) => {
      // CRITICAL: Rollback on error
      devError('[useBlockDelete] Delete failed, rolling back:', error);
      
      if (context?.previousBlocks) {
        queryClient.setQueryData(['board-blocks', boardId], context.previousBlocks);
      }
      
      toast.error('Failed to delete block', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
    onSuccess: (deletedId) => {
      // Only show success AFTER Supabase confirms
      devLog('[useBlockDelete] Delete confirmed by Supabase:', deletedId);
      toast.success('Block deleted');
    },
    onSettled: () => {
      // Always refetch to ensure consistency with database
      devLog('[useBlockDelete] Refetching blocks to ensure consistency');
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

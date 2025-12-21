/**
 * Optimistic Delete Hooks
 * 
 * Provides instant UI feedback for delete operations:
 * - Immediately removes item from UI
 * - Runs Supabase delete in background
 * - Rolls back only on error
 */

import { useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { blocksDb, boardsDb } from '@/lib/database';
import { toast } from 'sonner';

/**
 * Optimistic block deletion
 * - Instant UI removal
 * - Background Supabase delete
 * - Rollback on error
 */
export function useOptimisticBlockDelete(boardId: string) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (blockId: string) => {
      console.log('[useOptimisticBlockDelete] Deleting block:', blockId);
      await blocksDb.delete(blockId);
    },
    onMutate: async (blockId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board-blocks', boardId] });

      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData(['board-blocks', boardId]);

      // Optimistically remove the block
      queryClient.setQueryData(['board-blocks', boardId], (old: any[] | undefined) => {
        return old?.filter((block) => block.id !== blockId) || [];
      });

      console.log('[useOptimisticBlockDelete] Optimistically removed block:', blockId);

      // Return context with previous value
      return { previousBlocks };
    },
    onError: (error, blockId, context) => {
      // Rollback on error
      console.error('[useOptimisticBlockDelete] Error, rolling back:', error);
      queryClient.setQueryData(['board-blocks', boardId], context?.previousBlocks);
      toast.error('Failed to delete block. Please try again.');
    },
    onSuccess: (_, blockId) => {
      console.log('[useOptimisticBlockDelete] Delete confirmed:', blockId);
      // No need to invalidate - we already updated optimistically
    },
    onSettled: () => {
      // Refetch to ensure sync with server (optional, for safety)
      queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
    },
  });

  const deleteBlock = useCallback((blockId: string) => {
    deleteMutation.mutate(blockId);
  }, [deleteMutation]);

  return {
    deleteBlock,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Optimistic board deletion
 * - Instant UI removal
 * - Background Supabase delete
 * - Rollback on error
 */
export function useOptimisticBoardDelete() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (boardId: string) => {
      console.log('[useOptimisticBoardDelete] Deleting board:', boardId);
      await boardsDb.delete(boardId);
    },
    onMutate: async (boardId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['boards'] });

      // Snapshot the previous value
      const previousBoards = queryClient.getQueryData(['boards']);

      // Optimistically remove the board
      queryClient.setQueryData(['boards'], (old: any[] | undefined) => {
        return old?.filter((board) => board.id !== boardId) || [];
      });

      console.log('[useOptimisticBoardDelete] Optimistically removed board:', boardId);

      return { previousBoards };
    },
    onError: (error, boardId, context) => {
      console.error('[useOptimisticBoardDelete] Error, rolling back:', error);
      queryClient.setQueryData(['boards'], context?.previousBoards);
      toast.error('Failed to delete board. Please try again.');
    },
    onSuccess: (_, boardId) => {
      console.log('[useOptimisticBoardDelete] Delete confirmed:', boardId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const deleteBoard = useCallback((boardId: string) => {
    deleteMutation.mutate(boardId);
  }, [deleteMutation]);

  return {
    deleteBoard,
    isDeleting: deleteMutation.isPending,
  };
}

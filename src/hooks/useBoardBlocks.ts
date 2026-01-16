import { useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanEnforcement } from './usePlanLimits';
import { blocksDb } from '@/lib/database';
import { devLog, devError } from '@/lib/logger';
import { getDragState } from '@/store/useDragStore';
import type { Block } from '@/types';
import type { LLMProvider } from '@/types/database.types';
import { toast } from 'sonner';

/**
 * Hook to get all blocks for a specific board from Supabase.
 * Supabase is the single source of truth - no Zustand for blocks.
 */
export function useBoardBlocks(boardId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: supabaseBlocks = [], isLoading } = useQuery({
    queryKey: ['board-blocks', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      // CRITICAL: Never refetch during drag operations
      if (getDragState().isDragging) {
        devLog('[useBoardBlocks] Skipping refetch - drag in progress');
        return [];
      }
      devLog('[useBoardBlocks] Fetching blocks for board:', boardId);
      const blocks = await blocksDb.getForBoard(boardId);
      devLog('[useBoardBlocks] Fetched:', blocks.length, 'blocks');
      return blocks;
    },
    enabled: !authLoading && !!user?.id && !!boardId,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer to prevent refetch interruptions
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Don't refetch on mount - use cache
    refetchOnReconnect: false, // Don't refetch on reconnect
    // Keep previous data during refetch (prevents flash)
    placeholderData: (previousData) => previousData,
    // CRITICAL: Disable automatic refetching entirely - only manual invalidation
    refetchInterval: false,
  });

  // Transform to legacy format and sort
  const boardBlocks = useMemo(() => {
    return supabaseBlocks
      .map((b) => ({
        id: b.id,
        board_id: b.board_id,
        title: b.title || 'Untitled Block',
        type: 'chat' as const,
        model_id: b.model_id,
        system_prompt: b.system_prompt || '',
        config: { temperature: 0.7, max_tokens: 2048 },
        position: { x: b.position_x, y: b.position_y },
        created_at: b.created_at,
        updated_at: b.updated_at,
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [supabaseBlocks]);

  return boardBlocks;
}

/**
 * Hook providing block operations with Supabase as source of truth.
 * Uses optimistic UI updates with rollback on failure.
 */
export function useBlockActions(boardId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enforceCreateBlock } = usePlanEnforcement();

  // User must be authenticated to modify
  const canModify = !!user?.id && !!boardId;

  /**
   * Create a block via Supabase with OPTIMISTIC UI
   * Block appears immediately, then syncs with server
   */
  const createBlock = useCallback(async (data: Partial<Block>): Promise<Block | null> => {
    if (!canModify) {
      devError('[useBlockActions.createBlock] Cannot create: no user or boardId');
      throw new Error('Cannot create block: Board access denied');
    }
    
    // Enforce plan limits
    if (!enforceCreateBlock(boardId)) {
      devLog('[useBlockActions.createBlock] Plan limit reached');
      return null;
    }

    // Get provider from model_id
    const { getProviderFromModel } = await import('@/config/models');
    const provider = data.model_id ? getProviderFromModel(data.model_id) : 'openai';
    
    // Map to Supabase enum
    const providerMap: Record<string, LLMProvider> = {
      openai: 'openai',
      anthropic: 'anthropic', 
      google: 'google',
      xai: 'xai',
      deepseek: 'deepseek',
    };
    
    const supabaseProvider = providerMap[provider] || 'openai';

    // Create optimistic block for immediate UI
    const optimisticId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticBlock = {
      id: optimisticId,
      board_id: boardId,
      user_id: user!.id,
      title: data.title || 'New Block',
      model_id: data.model_id || '',
      provider: supabaseProvider,
      system_prompt: data.system_prompt || 'You are a helpful assistant.',
      position_x: data.position?.x || 100,
      position_y: data.position?.y || 100,
      width: 400,
      height: 300,
      is_collapsed: false,
      color: null,
      created_at: now,
      updated_at: now,
    };

    devLog('[useBlockActions.createBlock] Optimistic create:', optimisticId);

    // Optimistic update - add to cache immediately
    queryClient.setQueryData(['board-blocks', boardId], (old: unknown) => {
      const arr = Array.isArray(old) ? old : [];
      return [...arr, optimisticBlock];
    });

    try {
      // INSERT into Supabase - returns full row
      const block = await blocksDb.create({
        board_id: boardId,
        title: data.title || 'New Block',
        model_id: data.model_id || '',
        provider: supabaseProvider,
        system_prompt: data.system_prompt || 'You are a helpful assistant.',
        position_x: data.position?.x || 100,
        position_y: data.position?.y || 100,
        width: 400,
        height: 300,
      });

      devLog('[useBlockActions.createBlock] Insert succeeded:', block.id);

      // Replace optimistic block with real block in cache
      queryClient.setQueryData(['board-blocks', boardId], (old: unknown) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.map((b: any) => b.id === optimisticId ? block : b);
      });

      // Return the block from Supabase
      return {
        id: block.id,
        board_id: block.board_id,
        title: block.title || 'Untitled Block',
        type: 'chat' as const,
        model_id: block.model_id,
        system_prompt: block.system_prompt || '',
        config: { temperature: 0.7, max_tokens: 2048 },
        position: { x: block.position_x, y: block.position_y },
        created_at: block.created_at,
        updated_at: block.updated_at,
      };
    } catch (error) {
      devError('[useBlockActions.createBlock] Failed:', error);
      // Rollback optimistic update
      queryClient.setQueryData(['board-blocks', boardId], (old: unknown) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.filter((b: any) => b.id !== optimisticId);
      });
      throw error;
    }
  }, [boardId, canModify, user, enforceCreateBlock, queryClient]);

  /**
   * Update a block via Supabase with optimistic UI
   */
  const updateBlock = useCallback(async (blockId: string, updates: Partial<Block>) => {
    if (!canModify) {
      throw new Error('Cannot update block: Board access denied');
    }

    devLog('[useBlockActions.updateBlock] Updating:', blockId);

    // Get current cache for rollback
    const previousBlocks = queryClient.getQueryData(['board-blocks', boardId]);

    // Optimistic update - apply changes immediately
    queryClient.setQueryData(['board-blocks', boardId], (old: unknown) => {
      const arr = Array.isArray(old) ? old : [];
      return arr.map((b: any) => {
        if (b?.id !== blockId) return b;
        return {
          ...b,
          title: updates.title ?? b.title,
          system_prompt: updates.system_prompt ?? b.system_prompt,
          model_id: updates.model_id ?? b.model_id,
          position_x: updates.position?.x ?? b.position_x,
          position_y: updates.position?.y ?? b.position_y,
          updated_at: new Date().toISOString(),
        };
      });
    });

    try {
      await blocksDb.update(blockId, {
        title: updates.title,
        system_prompt: updates.system_prompt,
        model_id: updates.model_id,
        position_x: updates.position?.x,
        position_y: updates.position?.y,
      });
    } catch (error) {
      // Rollback on failure
      queryClient.setQueryData(['board-blocks', boardId], previousBlocks);
      throw error;
    }
  }, [boardId, canModify, queryClient]);

  /**
   * Delete a block via Supabase with optimistic UI
   */
  const deleteBlock = useCallback(async (blockId: string) => {
    if (!canModify) {
      throw new Error('Cannot delete block: Board access denied');
    }

    devLog('[useBlockActions.deleteBlock] request', { boardId, blockId });

    // Get current cache data for rollback
    const previousBlocks = queryClient.getQueryData(['board-blocks', boardId]);

    // Optimistic update - remove from cache immediately
    queryClient.setQueryData(['board-blocks', boardId], (old: unknown) => {
      const arr = Array.isArray(old) ? old : [];
      return arr.filter((b: any) => b?.id !== blockId);
    });

    try {
      const result = await blocksDb.delete(blockId);

      if (!result.success) {
        devError('[useBlockActions.deleteBlock] failed', { boardId, blockId, error: result.error });
        queryClient.setQueryData(['board-blocks', boardId], previousBlocks);
        toast.error(result.error || 'Failed to delete block');
        throw new Error(result.error || 'Delete failed');
      }

      devLog('[useBlockActions.deleteBlock] success', { boardId, blockId, deletedId: result.deletedId });
      // IMPORTANT: no refetch here; optimistic cache is the UI source of truth.
    } catch (error) {
      devError('[useBlockActions.deleteBlock] error', { boardId, blockId });
      queryClient.setQueryData(['board-blocks', boardId], previousBlocks);
      throw error;
    }
  }, [boardId, canModify, queryClient, user?.id]);

  /**
   * Duplicate a block
   */
  const duplicateBlock = useCallback(async (blockId: string) => {
    if (!canModify) {
      throw new Error('Cannot duplicate block: Board access denied');
    }

    devLog('[useBlockActions.duplicateBlock] Duplicating:', blockId);
    
    // Get the original block
    const original = await blocksDb.getById(blockId);
    if (!original) throw new Error('Block not found');

    // Create duplicate with offset position
    const duplicate = await blocksDb.create({
      board_id: original.board_id,
      title: `${original.title || 'Block'} (copy)`,
      model_id: original.model_id,
      provider: original.provider,
      system_prompt: original.system_prompt || '',
      position_x: original.position_x + 50,
      position_y: original.position_y + 50,
      width: original.width || 400,
      height: original.height || 300,
    });

    // Invalidate cache
    await queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
    return duplicate;
  }, [boardId, canModify, queryClient]);

  /**
   * Update block position - optimistic UI first, then persist to Supabase
   * This is designed for drag operations where smooth UI is critical.
   * 
   * CRITICAL: Uses direct cache mutation without triggering React re-renders.
   * The position is stored in the cache but React Query won't notify subscribers
   * during drag because we use setQueryData without invalidation.
   */
  const updateBlockPosition = useCallback((blockId: string, position: { x: number; y: number }) => {
    if (!canModify) return;

    // CRITICAL: Direct cache mutation - no invalidation, no subscribers notified
    // This prevents re-renders during drag
    queryClient.setQueryData(['board-blocks', boardId], (old: unknown) => {
      const arr = Array.isArray(old) ? old : [];
      return arr.map((b: any) => 
        b?.id === blockId ? { ...b, position_x: position.x, position_y: position.y } : b
      );
    });
  }, [boardId, canModify, queryClient]);

  /**
   * Persist block position to Supabase - call this when drag ends
   */
  const persistBlockPosition = useCallback(async (blockId: string, position: { x: number; y: number }) => {
    if (!canModify) return;

    try {
      await blocksDb.update(blockId, {
        position_x: position.x,
        position_y: position.y,
      });
      devLog('[useBlockActions.persistBlockPosition] Saved position:', blockId);
    } catch (error) {
      devError('[useBlockActions.persistBlockPosition] Error:', error);
      // Refetch to get correct position
      queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
    }
  }, [boardId, canModify, queryClient]);

  return {
    canModify,
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    updateBlockPosition,
    persistBlockPosition,
  };
}

/**
 * Hook to get block statistics for a board.
 */
export function useBoardBlockStats(boardId: string | undefined) {
  const blocks = useBoardBlocks(boardId);
  
  return useMemo(() => ({
    total: blocks.length,
    byModel: blocks.reduce((acc, block) => {
      acc[block.model_id] = (acc[block.model_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    lastUpdated: blocks.length > 0
      ? blocks.reduce((latest, block) => {
          const blockTime = new Date(block.updated_at).getTime();
          return blockTime > latest ? blockTime : latest;
        }, 0)
      : null,
  }), [blocks]);
}
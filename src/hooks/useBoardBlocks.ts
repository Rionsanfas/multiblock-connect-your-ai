import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanEnforcement } from './usePlanLimits';
import { blocksDb } from '@/lib/database';
import { api } from '@/api';
import type { Block } from '@/types';
import type { LLMProvider } from '@/types/database.types';

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
      console.log('[useBoardBlocks] Fetching blocks for board:', boardId);
      const blocks = await blocksDb.getForBoard(boardId);
      console.log('[useBoardBlocks] Fetched:', blocks.length, 'blocks');
      return blocks;
    },
    enabled: !authLoading && !!user?.id && !!boardId,
    staleTime: 10 * 1000, // Reduced to 10 seconds for fresher data
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
 * All mutations go through Supabase and invalidate the query cache.
 */
export function useBlockActions(boardId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enforceCreateBlock } = usePlanEnforcement();

  // User must be authenticated to modify
  const canModify = !!user?.id && !!boardId;

  /**
   * Create a block via Supabase, then invalidate query cache.
   * No optimistic UI - only render from Supabase SELECT.
   */
  const createBlock = useCallback(async (data: Partial<Block>): Promise<Block | null> => {
    if (!canModify) {
      console.error('[useBlockActions.createBlock] Cannot create: no user or boardId');
      throw new Error('Cannot create block: Board access denied');
    }
    
    // Enforce plan limits
    if (!enforceCreateBlock(boardId)) {
      console.log('[useBlockActions.createBlock] Plan limit reached');
      return null;
    }

    // Validate required fields
    if (!data.model_id) {
      console.log('[useBlockActions.createBlock] No model selected, creating placeholder block');
      // For blocks without model, we still need a provider - use 'openai' as default
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

    console.log('[useBlockActions.createBlock] Payload:', {
      board_id: boardId,
      user_id: user!.id,
      model_id: data.model_id || '',
      provider: supabaseProvider,
      position: data.position,
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

      console.log('[useBlockActions.createBlock] Insert succeeded:', {
        id: block.id,
        board_id: block.board_id,
        user_id: block.user_id,
      });

      // Verify board_id matches
      if (block.board_id !== boardId) {
        console.error('[useBlockActions.createBlock] BOARD ID MISMATCH!', {
          expected: boardId,
          actual: block.board_id,
        });
      }

      // CRITICAL: Invalidate query cache to trigger re-fetch
      console.log('[useBlockActions.createBlock] Invalidating query cache for board:', boardId);
      await queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });

      // Return the block from Supabase (not mock)
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
      console.error('[useBlockActions.createBlock] Failed:', error);
      throw error;
    }
  }, [boardId, canModify, user, enforceCreateBlock, queryClient]);

  /**
   * Update a block via Supabase
   */
  const updateBlock = useCallback(async (blockId: string, updates: Partial<Block>) => {
    if (!canModify) {
      throw new Error('Cannot update block: Board access denied');
    }

    console.log('[useBlockActions.updateBlock] Updating:', blockId, updates);

    await blocksDb.update(blockId, {
      title: updates.title,
      system_prompt: updates.system_prompt,
      model_id: updates.model_id,
      position_x: updates.position?.x,
      position_y: updates.position?.y,
    });

    // Invalidate cache
    await queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
  }, [boardId, canModify, queryClient]);

  /**
   * Delete a block via Supabase
   */
  const deleteBlock = useCallback(async (blockId: string) => {
    if (!canModify) {
      throw new Error('Cannot delete block: Board access denied');
    }

    console.log('[useBlockActions.deleteBlock] Deleting:', blockId);
    await blocksDb.delete(blockId);

    // Invalidate cache
    await queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
  }, [boardId, canModify, queryClient]);

  /**
   * Duplicate a block via API
   */
  const duplicateBlock = useCallback(async (blockId: string) => {
    if (!canModify) {
      throw new Error('Cannot duplicate block: Board access denied');
    }

    console.log('[useBlockActions.duplicateBlock] Duplicating:', blockId);
    const block = await api.blocks.duplicate(blockId);

    // Invalidate cache
    await queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
    return block;
  }, [boardId, canModify, queryClient]);

  /**
   * Update block position via Supabase
   */
  const updateBlockPosition = useCallback(async (blockId: string, position: { x: number; y: number }) => {
    if (!canModify) {
      throw new Error('Cannot update position: Board access denied');
    }

    await blocksDb.update(blockId, {
      position_x: position.x,
      position_y: position.y,
    });

    // Invalidate cache
    await queryClient.invalidateQueries({ queryKey: ['board-blocks', boardId] });
  }, [boardId, canModify, queryClient]);

  return {
    canModify,
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    updateBlockPosition,
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
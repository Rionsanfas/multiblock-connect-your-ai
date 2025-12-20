import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanEnforcement } from './usePlanLimits';
import { blocksDb } from '@/lib/database';
import type { Block } from '@/types';

/**
 * Hook to get all blocks for a specific board from Supabase.
 * Supabase is the single source of truth - no Zustand boards for ownership checks.
 */
export function useBoardBlocks(boardId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: supabaseBlocks = [] } = useQuery({
    queryKey: ['board-blocks', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      console.log('[useBoardBlocks] Fetching blocks for board:', boardId);
      const blocks = await blocksDb.getForBoard(boardId);
      console.log('[useBoardBlocks] Fetched:', blocks.length, 'blocks');
      return blocks;
    },
    enabled: !authLoading && !!user?.id && !!boardId,
    staleTime: 30 * 1000,
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
 * Hook providing block operations with proper ownership validation and plan limits enforcement.
 * Uses Supabase as the source of truth - no Zustand boards for ownership.
 */
export function useBlockActions(boardId: string) {
  const { user } = useAuth();
  const { enforceCreateBlock } = usePlanEnforcement();
  const { 
    createBlock: storeCreateBlock, 
    updateBlock: storeUpdateBlock, 
    deleteBlock: storeDeleteBlock,
    duplicateBlock: storeDuplicateBlock,
    updateBlockPosition: storeUpdateBlockPosition,
    blocks
  } = useAppStore();

  // User must be authenticated to modify
  const canModify = !!user?.id && !!boardId;

  const createBlock = useCallback((data: Partial<Block>) => {
    if (!canModify) {
      throw new Error('Cannot create block: Board access denied');
    }
    
    // Enforce plan limits
    if (!enforceCreateBlock(boardId)) {
      return null;
    }
    
    return storeCreateBlock(boardId, data);
  }, [boardId, canModify, storeCreateBlock, enforceCreateBlock]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    if (!canModify) {
      throw new Error('Cannot update block: Board access denied');
    }
    // Verify block belongs to this board
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.board_id !== boardId) {
      throw new Error('Cannot update block: Block not found in board');
    }
    storeUpdateBlock(blockId, updates);
  }, [boardId, blocks, canModify, storeUpdateBlock]);

  const deleteBlock = useCallback((blockId: string) => {
    if (!canModify) {
      throw new Error('Cannot delete block: Board access denied');
    }
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.board_id !== boardId) {
      throw new Error('Cannot delete block: Block not found in board');
    }
    storeDeleteBlock(blockId);
  }, [boardId, blocks, canModify, storeDeleteBlock]);

  const duplicateBlock = useCallback((blockId: string) => {
    if (!canModify) {
      throw new Error('Cannot duplicate block: Board access denied');
    }
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.board_id !== boardId) {
      throw new Error('Cannot duplicate block: Block not found in board');
    }
    return storeDuplicateBlock(blockId);
  }, [boardId, blocks, canModify, storeDuplicateBlock]);

  const updateBlockPosition = useCallback((blockId: string, position: { x: number; y: number }) => {
    if (!canModify) {
      throw new Error('Cannot update position: Board access denied');
    }
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.board_id !== boardId) {
      throw new Error('Cannot update position: Block not found in board');
    }
    storeUpdateBlockPosition(blockId, position);
  }, [boardId, blocks, canModify, storeUpdateBlockPosition]);

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

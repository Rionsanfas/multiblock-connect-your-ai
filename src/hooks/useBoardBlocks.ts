import { useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCurrentUser } from './useCurrentUser';
import { usePlanEnforcement } from './usePlanLimits';
import type { Block } from '@/types';

/**
 * Hook to get all blocks for a specific board with ownership validation.
 * Ensures blocks are only accessible if the board belongs to the current user.
 */
export function useBoardBlocks(boardId: string | undefined) {
  const { user } = useCurrentUser();
  const { blocks, boards } = useAppStore();

  const boardBlocks = useMemo(() => {
    if (!boardId || !user) return [];
    
    // Verify board ownership before returning blocks
    const board = boards.find((b) => b.id === boardId);
    if (!board || board.user_id !== user.id) return [];
    
    return blocks
      .filter((b) => b.board_id === boardId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [blocks, boards, boardId, user]);

  return boardBlocks;
}

/**
 * Hook to get a single block by ID with ownership validation.
 */
export function useBlock(blockId: string | undefined) {
  const { user } = useCurrentUser();
  const { blocks, boards } = useAppStore();

  const block = useMemo(() => {
    if (!blockId || !user) return null;
    
    const foundBlock = blocks.find((b) => b.id === blockId);
    if (!foundBlock) return null;
    
    // Verify ownership through board
    const board = boards.find((b) => b.id === foundBlock.board_id);
    if (!board || board.user_id !== user.id) return null;
    
    return foundBlock;
  }, [blocks, boards, blockId, user]);

  return block;
}

/**
 * Hook providing block operations with proper ownership validation and plan limits enforcement.
 */
export function useBlockActions(boardId: string) {
  const { user } = useCurrentUser();
  const { enforceCreateBlock } = usePlanEnforcement();
  const { 
    boards,
    createBlock: storeCreateBlock, 
    updateBlock: storeUpdateBlock, 
    deleteBlock: storeDeleteBlock,
    duplicateBlock: storeDuplicateBlock,
    updateBlockPosition: storeUpdateBlockPosition,
    blocks
  } = useAppStore();

  // Verify board ownership
  const canModify = useMemo(() => {
    if (!user || !boardId) return false;
    const board = boards.find((b) => b.id === boardId);
    return board?.user_id === user.id;
  }, [boards, boardId, user]);

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

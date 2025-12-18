import { useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCurrentUser } from './useCurrentUser';
import type { Message, BlockUsage, BoardUsage } from '@/types';

/**
 * Calculate byte size of a string (UTF-8)
 */
export const calculateByteSize = (content: string): number => {
  return new TextEncoder().encode(content).length;
};

/**
 * Hook to get messages for a specific block with ownership validation
 */
export const useBlockMessages = (blockId: string | null) => {
  const { user } = useCurrentUser();
  const { blocks, messages, boards } = useAppStore();

  return useMemo(() => {
    if (!blockId || !user) return [];

    // Find the block
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return [];

    // Verify ownership through board
    const board = boards.find((b) => b.id === block.board_id);
    if (!board || board.user_id !== user.id) return [];

    // Return messages for this block, sorted by creation time
    return messages
      .filter((m) => m.block_id === blockId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [blockId, user, blocks, messages, boards]);
};

/**
 * Hook to get usage statistics for a specific block
 */
export const useBlockUsage = (blockId: string | null): BlockUsage | null => {
  const { user } = useCurrentUser();
  const { blocks, messages, boards } = useAppStore();

  return useMemo(() => {
    if (!blockId || !user) return null;

    // Find the block
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return null;

    // Verify ownership through board
    const board = boards.find((b) => b.id === block.board_id);
    if (!board || board.user_id !== user.id) return null;

    // Calculate usage
    const blockMessages = messages.filter((m) => m.block_id === blockId);
    const totalBytes = blockMessages.reduce((sum, m) => sum + (m.size_bytes || 0), 0);

    return {
      block_id: blockId,
      message_count: blockMessages.length,
      total_bytes: totalBytes,
    };
  }, [blockId, user, blocks, messages, boards]);
};

/**
 * Hook to get aggregated usage statistics for a board
 */
export const useBoardUsage = (boardId: string | null): BoardUsage | null => {
  const { user } = useCurrentUser();
  const { blocks, messages, boards } = useAppStore();

  return useMemo(() => {
    if (!boardId || !user) return null;

    // Find and verify board ownership
    const board = boards.find((b) => b.id === boardId);
    if (!board || board.user_id !== user.id) return null;

    // Get all blocks for this board
    const boardBlocks = blocks.filter((b) => b.board_id === boardId);
    const blockIds = new Set(boardBlocks.map((b) => b.id));

    // Get all messages for these blocks
    const boardMessages = messages.filter((m) => blockIds.has(m.block_id));
    const totalBytes = boardMessages.reduce((sum, m) => sum + (m.size_bytes || 0), 0);

    return {
      board_id: boardId,
      block_count: boardBlocks.length,
      message_count: boardMessages.length,
      total_bytes: totalBytes,
    };
  }, [boardId, user, blocks, messages, boards]);
};

/**
 * Hook for message actions with ownership validation
 */
export const useMessageActions = () => {
  const { user } = useCurrentUser();
  const { blocks, boards, addMessage, updateMessage, deleteMessage } = useAppStore();

  // Verify ownership before action
  const verifyOwnership = useCallback(
    (blockId: string): boolean => {
      if (!user) return false;
      
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return false;
      
      const board = boards.find((b) => b.id === block.board_id);
      return board?.user_id === user.id;
    },
    [user, blocks, boards]
  );

  const sendMessage = useCallback(
    (blockId: string, content: string, role: 'user' | 'assistant' | 'system' = 'user'): Message | null => {
      if (!verifyOwnership(blockId)) {
        console.error('Cannot send message: Ownership verification failed');
        return null;
      }

      return addMessage({
        block_id: blockId,
        role,
        content,
      });
    },
    [verifyOwnership, addMessage]
  );

  const editMessage = useCallback(
    (messageId: string, content: string): boolean => {
      // Get the message to find its block
      const { messages, updateMessage: storeUpdateMessage } = useAppStore.getState();
      const message = messages.find((m) => m.id === messageId);
      if (!message) return false;

      if (!verifyOwnership(message.block_id)) {
        console.error('Cannot edit message: Ownership verification failed');
        return false;
      }

      // Recalculate size_bytes
      const sizeBytes = calculateByteSize(content);
      storeUpdateMessage(messageId, { content, size_bytes: sizeBytes });
      return true;
    },
    [verifyOwnership]
  );

  const removeMessage = useCallback(
    (messageId: string): boolean => {
      // Get the message to find its block
      const { messages, deleteMessage: storeDeleteMessage } = useAppStore.getState();
      const message = messages.find((m) => m.id === messageId);
      if (!message) return false;

      if (!verifyOwnership(message.block_id)) {
        console.error('Cannot delete message: Ownership verification failed');
        return false;
      }

      storeDeleteMessage(messageId);
      return true;
    },
    [verifyOwnership]
  );

  const clearBlockMessages = useCallback(
    (blockId: string): boolean => {
      if (!verifyOwnership(blockId)) {
        console.error('Cannot clear messages: Ownership verification failed');
        return false;
      }

      const { messages, deleteMessage: storeDeleteMessage } = useAppStore.getState();
      const blockMessages = messages.filter((m) => m.block_id === blockId);
      blockMessages.forEach((m) => storeDeleteMessage(m.id));
      return true;
    },
    [verifyOwnership]
  );

  return {
    sendMessage,
    editMessage,
    removeMessage,
    clearBlockMessages,
    verifyOwnership,
  };
};

/**
 * Hook to get total usage across all user's boards
 */
export const useTotalUsage = () => {
  const { user } = useCurrentUser();
  const { blocks, messages, boards } = useAppStore();

  return useMemo(() => {
    if (!user) {
      return { board_count: 0, block_count: 0, message_count: 0, total_bytes: 0 };
    }

    // Get user's boards
    const userBoards = boards.filter((b) => b.user_id === user.id);
    const boardIds = new Set(userBoards.map((b) => b.id));

    // Get blocks for user's boards
    const userBlocks = blocks.filter((b) => boardIds.has(b.board_id));
    const blockIds = new Set(userBlocks.map((b) => b.id));

    // Get messages for user's blocks
    const userMessages = messages.filter((m) => blockIds.has(m.block_id));
    const totalBytes = userMessages.reduce((sum, m) => sum + (m.size_bytes || 0), 0);

    return {
      board_count: userBoards.length,
      block_count: userBlocks.length,
      message_count: userMessages.length,
      total_bytes: totalBytes,
    };
  }, [user, blocks, messages, boards]);
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};

/**
 * Block Messages Hooks - Supabase-backed message management
 * 
 * CRITICAL: All message data comes from Supabase.
 * NO local-only state for messages.
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { messagesDb } from '@/lib/database';
import { toast } from 'sonner';
import type { Message } from '@/types/database.types';

export interface BlockUsage {
  block_id: string;
  message_count: number;
  total_bytes: number;
}

/**
 * Calculate byte size of a string (UTF-8)
 */
export const calculateByteSize = (content: string): number => {
  return new TextEncoder().encode(content).length;
};

/**
 * Hook to get messages for a specific block from Supabase
 * Supabase is the source of truth - not Zustand
 */
export function useBlockMessages(blockId: string | null) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['block-messages', blockId],
    queryFn: async () => {
      if (!blockId) return [];
      console.log('[useBlockMessages] Fetching messages for block:', blockId);
      const msgs = await messagesDb.getForBlock(blockId);
      console.log('[useBlockMessages] Fetched:', msgs.length, 'messages');
      return msgs;
    },
    enabled: !authLoading && !!user?.id && !!blockId,
    staleTime: 5 * 1000, // 5 seconds
  });

  return {
    messages,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get usage statistics for a specific block
 */
export function useBlockUsage(blockId: string | null): BlockUsage | null {
  const { messages } = useBlockMessages(blockId);

  return useMemo(() => {
    if (!blockId || !messages.length) return null;

    const totalBytes = messages.reduce((sum, m) => sum + (m.size_bytes || 0), 0);

    return {
      block_id: blockId,
      message_count: messages.length,
      total_bytes: totalBytes,
    };
  }, [blockId, messages]);
}

/**
 * Hook for message mutations with Supabase persistence
 */
export function useMessageActions(blockId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ role, content, meta }: { 
      role: 'user' | 'assistant' | 'system'; 
      content: string; 
      meta?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      console.log('[useMessageActions.send] Sending message:', { blockId, role, content_length: content.length });
      
      const message = await messagesDb.create(blockId, role, content, meta);
      console.log('[useMessageActions.send] Message persisted:', message.id);
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['block-messages', blockId] });
    },
    onError: (error) => {
      console.error('[useMessageActions.send] Error:', error);
      toast.error('Failed to send message');
    },
  });

  // Update a message
  const updateMessageMutation = useMutation({
    mutationFn: async ({ messageId, content, meta }: { 
      messageId: string; 
      content: string;
      meta?: Record<string, unknown>;
    }) => {
      console.log('[useMessageActions.update] Updating message:', messageId);
      return messagesDb.update(messageId, content, meta);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['block-messages', blockId] });
    },
    onError: (error) => {
      console.error('[useMessageActions.update] Error:', error);
      toast.error('Failed to update message');
    },
  });

  // Delete a message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      console.log('[useMessageActions.delete] Deleting message:', messageId);
      await messagesDb.delete(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['block-messages', blockId] });
    },
    onError: (error) => {
      console.error('[useMessageActions.delete] Error:', error);
      toast.error('Failed to delete message');
    },
  });

  // Clear all messages for block
  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      console.log('[useMessageActions.clear] Clearing all messages for block:', blockId);
      await messagesDb.deleteForBlock(blockId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['block-messages', blockId] });
      toast.success('Messages cleared');
    },
    onError: (error) => {
      console.error('[useMessageActions.clear] Error:', error);
      toast.error('Failed to clear messages');
    },
  });

  const sendMessage = useCallback(
    async (role: 'user' | 'assistant' | 'system', content: string, meta?: Record<string, unknown>) => {
      return sendMessageMutation.mutateAsync({ role, content, meta });
    },
    [sendMessageMutation]
  );

  const updateMessage = useCallback(
    async (messageId: string, content: string, meta?: Record<string, unknown>) => {
      return updateMessageMutation.mutateAsync({ messageId, content, meta });
    },
    [updateMessageMutation]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      return deleteMessageMutation.mutateAsync(messageId);
    },
    [deleteMessageMutation]
  );

  const clearMessages = useCallback(
    async () => {
      return clearMessagesMutation.mutateAsync();
    },
    [clearMessagesMutation]
  );

  return {
    sendMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    isSending: sendMessageMutation.isPending,
    isUpdating: updateMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    isClearing: clearMessagesMutation.isPending,
  };
}

/**
 * Hook to get aggregated usage statistics for a board (stub for compatibility)
 */
export function useBoardUsage(boardId: string | null) {
  return null; // TODO: Implement with Supabase aggregation
}

/**
 * Hook to get total usage across all user's boards (stub for compatibility)
 */
export function useTotalUsage() {
  return { board_count: 0, block_count: 0, message_count: 0, total_bytes: 0 };
}

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

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
import { devLog, devError } from '@/lib/logger';
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
      devLog('[useBlockMessages] Fetching messages for block:', blockId);
      const msgs = await messagesDb.getForBlock(blockId);
      devLog('[useBlockMessages] Fetched:', msgs.length, 'messages');
      return msgs;
    },
    enabled: !authLoading && !!user?.id && !!blockId,
    staleTime: 60 * 1000, // 60s - avoid mid-chat refetch flicker
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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

  const key = ['block-messages', blockId] as const;

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      optimisticId,
      role,
      content,
      meta,
    }: {
      optimisticId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      meta?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      devLog('[useMessageActions.send] request', { blockId, role, optimisticId });
      const message = await messagesDb.create(blockId, role, content, meta);
      return { optimisticId, message };
    },
    onSuccess: ({ optimisticId, message }) => {
      devLog('[useMessageActions.send] success', { optimisticId, persistedId: message.id });
      queryClient.setQueryData(key, (old: unknown) => {
        const arr = Array.isArray(old) ? (old as Message[]) : [];
        const idx = arr.findIndex((m) => m.id === optimisticId);
        if (idx === -1) return [...arr, message];
        const next = [...arr];
        next[idx] = message;
        return next;
      });
    },
    onError: (error, variables) => {
      devError('[useMessageActions.send] error', error);
      // Roll back optimistic message
      queryClient.setQueryData(key, (old: unknown) => {
        const arr = Array.isArray(old) ? (old as Message[]) : [];
        return arr.filter((m) => m.id !== variables.optimisticId);
      });
      toast.error('Failed to send message');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      devLog('[useMessageActions.delete] request', { blockId, messageId });
      await messagesDb.delete(messageId);
      return messageId;
    },
    onError: (error) => {
      devError('[useMessageActions.delete] error', error);
      toast.error('Failed to delete message');
    },
  });

  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      devLog('[useMessageActions.clear] request', { blockId });
      await messagesDb.deleteForBlock(blockId);
    },
    onSuccess: () => {
      queryClient.setQueryData(key, []);
      toast.success('Messages cleared');
    },
    onError: (error) => {
      devError('[useMessageActions.clear] error', error);
      toast.error('Failed to clear messages');
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      content,
      meta,
    }: {
      messageId: string;
      content: string;
      meta?: Record<string, unknown>;
    }) => {
      devLog('[useMessageActions.update] request', { messageId });
      return messagesDb.update(messageId, content, meta);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(key, (old: unknown) => {
        const arr = Array.isArray(old) ? (old as Message[]) : [];
        const idx = arr.findIndex((m) => m.id === updated.id);
        if (idx === -1) return arr;
        const next = [...arr];
        next[idx] = updated;
        return next;
      });
    },
    onError: (error) => {
      devError('[useMessageActions.update] error', error);
      toast.error('Failed to update message');
    },
  });

  const sendMessage = useCallback(
    async (role: 'user' | 'assistant' | 'system', content: string, meta?: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');

      const optimisticId = `optimistic_${crypto.randomUUID()}`;
      const optimistic: Message = {
        id: optimisticId,
        block_id: blockId,
        user_id: user.id,
        role,
        content,
        meta: meta ?? {},
        size_bytes: calculateByteSize(content),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic append (NEVER refetch mid-chat)
      queryClient.setQueryData(key, (old: unknown) => {
        const arr = Array.isArray(old) ? (old as Message[]) : [];
        return [...arr, optimistic];
      });

      // Persist in background; replace optimistic by id when done
      sendMessageMutation.mutate({ optimisticId, role, content, meta });

      return optimistic;
    },
    [blockId, key, queryClient, sendMessageMutation, user]
  );

  const updateMessage = useCallback(
    async (messageId: string, content: string, meta?: Record<string, unknown>) => {
      return updateMessageMutation.mutateAsync({ messageId, content, meta });
    },
    [updateMessageMutation]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic remove
      const prev = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: unknown) => {
        const arr = Array.isArray(old) ? (old as Message[]) : [];
        return arr.filter((m) => m.id !== messageId);
      });

      try {
        await deleteMessageMutation.mutateAsync(messageId);
      } catch (e) {
        // Rollback
        queryClient.setQueryData(key, prev);
        throw e;
      }
    },
    [deleteMessageMutation, key, queryClient]
  );

  const clearMessages = useCallback(async () => {
    return clearMessagesMutation.mutateAsync();
  }, [clearMessagesMutation]);

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
 * Hook to get aggregated usage statistics for a board
 * Returns null to avoid extra queries - usage is shown per-block only when needed
 */
export function useBoardUsage(boardId: string | null): { message_count: number; total_bytes: number } | null {
  // Return null to avoid N+1 queries on dashboard
  // Per-block usage is calculated in useBlockUsage when viewing individual blocks
  return null;
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

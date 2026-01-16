/**
 * Block Connections hooks - Supabase-backed connections
 * 
 * CRITICAL: Connections are DIRECTIONAL context inheritance.
 * If Block A → Block B: B receives A's full chat history as context. A does NOT receive B's.
 * 
 * All connections are stored in Supabase. Zustand is NOT used.
 * All context is fetched from Supabase messages.
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { connectionsDb, blocksDb, messagesDb } from '@/lib/database';
import { getDragState } from '@/store/useDragStore';
import type { Message, Block } from '@/types/database.types';
import type { BlockConnection } from '@/types/database.types';

/**
 * Context limit in characters to prevent token overflow
 */
const MAX_CONTEXT_CHARS = 8000;
const MAX_MESSAGES_PER_SOURCE = 20;

// Tracks optimistic connections that the user deleted before the create mutation finished.
// When the create eventually succeeds, we immediately delete the server row to prevent "ghost" re-appears.
const cancelledOptimisticConnectionIds = new Set<string>();

export type ConnectionContextType = 'full' | 'summary';

/**
 * Transformed connection for UI use
 *
 * IMPORTANT: `id` is the UI-stable identifier used as the React key.
 * For confirmed connections, `server_id` is the real Supabase row id.
 * During optimistic create, `server_id` is undefined until confirmation.
 */
export interface Connection {
  id: string;
  server_id?: string;
  from_block: string;
  to_block: string;
  label?: string | null;
  enabled: boolean;
  context_type: ConnectionContextType;
  transform_template?: string;
  created_at: string;
}

/**
 * Transform Supabase BlockConnection to UI Connection
 */
function transformConnection(c: BlockConnection): Connection {
  return {
    id: c.id,
    server_id: c.id,
    from_block: c.source_block_id,
    to_block: c.target_block_id,
    label: c.label,
    enabled: true, // All Supabase connections are enabled
    context_type: 'full', // Default to full context
    created_at: c.created_at,
  };
}

/**
 * Get all connections for a specific board from Supabase
 */
export function useBoardConnections(boardId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['board-connections', boardId] as const;

  const { data: connections = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!boardId) return [];

      // CRITICAL: never *change* the connections list during drag.
      // Returning [] here causes lines to disappear mid-drag.
      if (getDragState().isDragging) {
        return (queryClient.getQueryData<Connection[]>(queryKey) ?? []);
      }

      const existing = (queryClient.getQueryData<Connection[]>(queryKey) ?? []);

      console.log('[useBoardConnections] Fetching connections for board:', boardId);
      const conns = await connectionsDb.getForBoard(boardId);
      console.log('[useBoardConnections] Fetched:', conns.length, 'connections');

      const server = conns.map(transformConnection);

      // Merge server data INTO the existing cache so React keys remain stable.
      // This prevents: optimistic create -> confirm -> key change -> flicker/remount.
      if (existing.length === 0) return server;

      const existingByServerId = new Map<string, Connection>();
      for (const c of existing) {
        if (c.server_id) existingByServerId.set(c.server_id, c);
      }

      const merged: Connection[] = [];

      for (const s of server) {
        const prev = s.server_id ? existingByServerId.get(s.server_id) : undefined;
        if (prev) {
          merged.push({
            ...prev,
            ...s,
            // Preserve UI id (React key)
            id: prev.id,
            server_id: s.server_id,
          });
        } else {
          merged.push(s);
        }
      }

      // Keep optimistic (unconfirmed) connections that the server doesn't know about yet.
      for (const c of existing) {
        if (!c.server_id && !cancelledOptimisticConnectionIds.has(c.id)) {
          merged.push(c);
        }
      }

      return merged;
    },
    enabled: !authLoading && !!user?.id && !!boardId,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer to prevent refetch interruptions
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });

  return { connections, isLoading };
}

/**
 * Get incoming connections TO a specific block (blocks that feed INTO this block)
 * These source blocks provide context to the target block.
 */
export function useBlockIncomingConnections(blockId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['block-incoming-connections', blockId],
    queryFn: async () => {
      if (!blockId) return [];
      console.log('[useBlockIncomingConnections] Fetching for block:', blockId);
      const conns = await connectionsDb.getIncoming(blockId);
      console.log('[useBlockIncomingConnections] Found:', conns.length, 'incoming connections');
      return conns.map(transformConnection);
    },
    enabled: !authLoading && !!user?.id && !!blockId,
    staleTime: 10 * 1000,
  });

  return { connections, isLoading };
}

/**
 * Get outgoing connections FROM a specific block (blocks this block feeds INTO)
 */
export function useBlockOutgoingConnections(blockId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['block-outgoing-connections', blockId],
    queryFn: async () => {
      if (!blockId) return [];
      const conns = await connectionsDb.getOutgoing(blockId);
      return conns.map(transformConnection);
    },
    enabled: !authLoading && !!user?.id && !!blockId,
    staleTime: 10 * 1000,
  });

  return { connections, isLoading };
}

/**
 * Context from a connected block for prompt injection
 */
export interface BlockContext {
  connection_id: string;
  source_block_id: string;
  source_block_title: string;
  context_type: ConnectionContextType;
  content: string;
  created_at: string;
}

/**
 * Get the FULL incoming context for a block from all connected source blocks.
 * This includes the entire chat history from source blocks.
 * 
 * CRITICAL: Fetches from Supabase, NOT from Zustand.
 * 
 * Rule: If Block A → Block B, then B receives A's chat history as context.
 */
export function useBlockIncomingContext(blockId: string | undefined): BlockContext[] {
  const { user, isLoading: authLoading } = useAuth();
  const { connections } = useBlockIncomingConnections(blockId);

  // Fetch source blocks and their messages from Supabase
  const { data: contextList = [] } = useQuery({
    queryKey: ['block-incoming-context', blockId, connections.map(c => c.from_block).join(',')],
    queryFn: async () => {
      if (!blockId || connections.length === 0) return [];

      console.log('[useBlockIncomingContext] Building context for block:', blockId);
      console.log('[useBlockIncomingContext] Incoming connections:', connections.length);

      const results: BlockContext[] = [];

      for (const conn of connections) {
        try {
          // Fetch the source block from Supabase
          const sourceBlock = await blocksDb.getById(conn.from_block);
          if (!sourceBlock) {
            console.log('[useBlockIncomingContext] Source block not found:', conn.from_block);
            continue;
          }

          // Fetch messages from the source block from Supabase
          const sourceMessages = await messagesDb.getForBlock(conn.from_block);
          
          // Sort and limit messages
          const sortedMessages = sourceMessages
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(-MAX_MESSAGES_PER_SOURCE);

          if (sortedMessages.length === 0) {
            console.log('[useBlockIncomingContext] No messages in source block:', sourceBlock.title);
            continue;
          }

          console.log('[useBlockIncomingContext] Injecting', sortedMessages.length, 'messages from:', sourceBlock.title);

          // Build context content from source block's chat history
          let content = '';
          
          if (conn.context_type === 'summary') {
            // For summary mode, only include the last assistant response
            const lastAssistant = sortedMessages
              .filter(m => m.role === 'assistant')
              .pop();
            
            if (lastAssistant) {
              content = lastAssistant.content.length > 500
                ? lastAssistant.content.substring(0, 500) + '...'
                : lastAssistant.content;
            }
          } else {
            // For full mode, include entire conversation history
            content = sortedMessages
              .filter(m => m.role === 'user' || m.role === 'assistant')
              .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
              .join('\n\n');
            
            // Truncate if too long
            if (content.length > MAX_CONTEXT_CHARS) {
              content = content.substring(content.length - MAX_CONTEXT_CHARS);
              content = '...[truncated]\n\n' + content;
            }
          }

          // Apply transform template if present
          if (conn.transform_template && content) {
            content = conn.transform_template.replace('{{output}}', content);
          }

          if (content) {
            results.push({
              connection_id: conn.id,
              source_block_id: conn.from_block,
              source_block_title: sourceBlock.title || 'Untitled Block',
              context_type: conn.context_type,
              content,
              created_at: sortedMessages[sortedMessages.length - 1]?.created_at || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('[useBlockIncomingContext] Error fetching context from block:', conn.from_block, error);
        }
      }

      console.log('[useBlockIncomingContext] Total context sources:', results.length);
      return results;
    },
    enabled: !authLoading && !!user?.id && !!blockId && connections.length > 0,
    staleTime: 5 * 1000, // Refresh context frequently
  });

  return contextList;
}

/**
 * Connection actions with Supabase persistence
 */
export function useConnectionActions(boardId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const boardConnectionsKey = ['board-connections', boardId] as const;

  const createMutation = useMutation({
    mutationFn: async ({ from_block, to_block }: { from_block: string; to_block: string }) => {
      // Prevent self-connections
      if (from_block === to_block) {
        throw new Error('Cannot create self-connection');
      }

      console.log('[useConnectionActions] Creating connection:', from_block, '->', to_block);
      return connectionsDb.create({
        source_block_id: from_block,
        target_block_id: to_block,
      });
    },
    onMutate: async ({ from_block, to_block }) => {
      // CRITICAL: cancel any in-flight connection fetch so it can't overwrite optimistic state: 
      // "drag only ends on mouse-up".
      await queryClient.cancelQueries({ queryKey: boardConnectionsKey });

      const previous = (queryClient.getQueryData<Connection[]>(boardConnectionsKey) ?? []);

      // If we already have this connection locally, do nothing (idempotent UX).
      if (previous.some((c) => c.from_block === from_block && c.to_block === to_block)) {
        return { previous, optimisticId: null as string | null, from_block, to_block };
      }

      const optimisticId = `temp-${crypto.randomUUID()}`;
      const optimistic: Connection = {
        id: optimisticId,
        server_id: undefined,
        from_block,
        to_block,
        label: null,
        enabled: true,
        context_type: 'full',
        created_at: new Date().toISOString(),
      };

      // Optimistically insert into the board list (this is what fixes flicker).
      queryClient.setQueryData<Connection[]>(boardConnectionsKey, [...previous, optimistic]);

      // Also update per-block connection lists if they exist in cache (no refetch required).
      queryClient.setQueryData<Connection[]>(['block-incoming-connections', to_block], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.some((c) => c.from_block === from_block && c.to_block === to_block)
          ? arr
          : [...arr, optimistic];
      });
      queryClient.setQueryData<Connection[]>(['block-outgoing-connections', from_block], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.some((c) => c.from_block === from_block && c.to_block === to_block)
          ? arr
          : [...arr, optimistic];
      });

      return { previous, optimisticId, from_block, to_block };
    },
    onError: (error, _vars, ctx) => {
      console.error('[useConnectionActions] Create failed:', error);

      if (!ctx) return;

      // Rollback board list
      queryClient.setQueryData(boardConnectionsKey, ctx.previous);

      // Rollback incoming/outgoing lists by removing the optimistic connection only
      if (ctx.optimisticId) {
        queryClient.setQueryData(['block-incoming-connections', ctx.to_block], (old: unknown) => {
          const arr = Array.isArray(old) ? old : [];
          return arr.filter((c: any) => c?.id !== ctx.optimisticId);
        });
        queryClient.setQueryData(['block-outgoing-connections', ctx.from_block], (old: unknown) => {
          const arr = Array.isArray(old) ? old : [];
          return arr.filter((c: any) => c?.id !== ctx.optimisticId);
        });
      }
    },
    onSuccess: async (createdRow, _vars, ctx) => {
      // If we no-oped due to local duplicate, nothing to reconcile.
      if (!ctx?.optimisticId) return;

      // If the user deleted the optimistic connection before the server replied,
      // immediately delete the newly-created row to prevent "ghost" reappears.
      if (cancelledOptimisticConnectionIds.has(ctx.optimisticId)) {
        cancelledOptimisticConnectionIds.delete(ctx.optimisticId);
        try {
          await connectionsDb.delete(createdRow.id);
        } catch (e) {
          console.warn('[useConnectionActions] Failed to cleanup cancelled connection:', e);
        }
        return;
      }

      // IMPORTANT: keep the optimistic `id` stable (React key), only attach `server_id`.
      queryClient.setQueryData<Connection[]>(boardConnectionsKey, (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.map((c) =>
          c.id === ctx.optimisticId
            ? {
                ...c,
                server_id: createdRow.id,
                label: createdRow.label,
                created_at: createdRow.created_at,
              }
            : c
        );
      });

      queryClient.setQueryData<Connection[]>(['block-incoming-connections', ctx.to_block], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.map((c) =>
          c.id === ctx.optimisticId
            ? {
                ...c,
                server_id: createdRow.id,
                label: createdRow.label,
                created_at: createdRow.created_at,
              }
            : c
        );
      });
      queryClient.setQueryData<Connection[]>(['block-outgoing-connections', ctx.from_block], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.map((c) =>
          c.id === ctx.optimisticId
            ? {
                ...c,
                server_id: createdRow.id,
                label: createdRow.label,
                created_at: createdRow.created_at,
              }
            : c
        );
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ serverId }: { connectionId: string; serverId: string }) => {
      console.log('[useConnectionActions] Deleting connection (server):', serverId);
      await connectionsDb.delete(serverId);
      return serverId;
    },
    onMutate: async ({ connectionId }) => {
      await queryClient.cancelQueries({ queryKey: boardConnectionsKey });
      const previous = (queryClient.getQueryData<Connection[]>(boardConnectionsKey) ?? []);
      const removed = previous.find((c) => c.id === connectionId);

      queryClient.setQueryData<Connection[]>(boardConnectionsKey, (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.filter((c) => c.id !== connectionId);
      });

      if (removed) {
        queryClient.setQueryData<Connection[]>(['block-incoming-connections', removed.to_block], (old) => {
          const arr = Array.isArray(old) ? old : [];
          return arr.filter((c) => c.id !== connectionId);
        });
        queryClient.setQueryData<Connection[]>(['block-outgoing-connections', removed.from_block], (old) => {
          const arr = Array.isArray(old) ? old : [];
          return arr.filter((c) => c.id !== connectionId);
        });
      }

      return { previous, removed };
    },
    onError: (error, _vars, ctx) => {
      console.error('[useConnectionActions] Delete failed:', error);
      if (!ctx) return;

      // Restore board list
      queryClient.setQueryData(boardConnectionsKey, ctx.previous);

      // Best-effort restore per-block lists (only if we know what we removed)
      if (ctx.removed) {
        queryClient.setQueryData<Connection[]>(['block-incoming-connections', ctx.removed.to_block], (old) => {
          const arr = Array.isArray(old) ? old : [];
          return arr.some((c) => c.id === ctx.removed!.id) ? arr : [...arr, ctx.removed!];
        });
        queryClient.setQueryData<Connection[]>(['block-outgoing-connections', ctx.removed.from_block], (old) => {
          const arr = Array.isArray(old) ? old : [];
          return arr.some((c) => c.id === ctx.removed!.id) ? arr : [...arr, ctx.removed!];
        });
      }
    },
  });

  const create = useCallback((fromBlockId: string, toBlockId: string): void => {
    if (!user) {
      console.error('Connection creation denied: not authenticated');
      return;
    }

    // Fast client-side de-dupe (prevents create→rollback flicker).
    const existing = queryClient.getQueryData<Connection[]>(boardConnectionsKey) ?? [];
    if (existing.some((c) => c.from_block === fromBlockId && c.to_block === toBlockId)) {
      return;
    }

    createMutation.mutate({ from_block: fromBlockId, to_block: toBlockId });
  }, [user, createMutation, queryClient, boardConnectionsKey]);

  const remove = useCallback((connectionId: string): void => {
    const existing = queryClient.getQueryData<Connection[]>(boardConnectionsKey) ?? [];
    const conn = existing.find((c) => c.id === connectionId);
    if (!conn) return;

    // If this is still optimistic (no server_id), treat delete as a cancellation.
    if (!conn.server_id) {
      cancelledOptimisticConnectionIds.add(conn.id);

      queryClient.setQueryData<Connection[]>(boardConnectionsKey, existing.filter((c) => c.id !== conn.id));
      queryClient.setQueryData<Connection[]>(['block-incoming-connections', conn.to_block], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.filter((c) => c.id !== conn.id);
      });
      queryClient.setQueryData<Connection[]>(['block-outgoing-connections', conn.from_block], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.filter((c) => c.id !== conn.id);
      });

      return;
    }

    deleteMutation.mutate({ connectionId: conn.id, serverId: conn.server_id });
  }, [deleteMutation, queryClient, boardConnectionsKey]);

  return {
    create,
    remove,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Check if a connection already exists between two blocks
 */
export function useConnectionExists(fromBlockId: string, toBlockId: string): boolean {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: exists = false } = useQuery({
    queryKey: ['connection-exists', fromBlockId, toBlockId],
    queryFn: async () => {
      return connectionsDb.exists(fromBlockId, toBlockId);
    },
    enabled: !authLoading && !!user?.id && !!fromBlockId && !!toBlockId,
    staleTime: 10 * 1000,
  });
  
  return exists;
}

/**
 * Get connection statistics for a block
 */
export function useBlockConnectionStats(blockId: string | undefined) {
  const { connections: incoming } = useBlockIncomingConnections(blockId);
  const { connections: outgoing } = useBlockOutgoingConnections(blockId);
  const incomingContext = useBlockIncomingContext(blockId);

  return useMemo(() => ({
    incoming_count: incoming.length,
    outgoing_count: outgoing.length,
    has_context: incomingContext.length > 0,
    context_sources: incomingContext.map((ctx) => ctx.source_block_title),
    total_context_bytes: incomingContext.reduce(
      (sum, ctx) => sum + new TextEncoder().encode(ctx.content).length,
      0
    ),
  }), [incoming, outgoing, incomingContext]);
}
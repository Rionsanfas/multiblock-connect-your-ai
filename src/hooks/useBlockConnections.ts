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

export type ConnectionContextType = 'full' | 'summary';

/**
 * Transformed connection for UI use
 */
export interface Connection {
  id: string;
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

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['board-connections', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      // CRITICAL: Never refetch during drag operations
      if (getDragState().isDragging) {
        console.log('[useBoardConnections] Skipping refetch - drag in progress');
        return [];
      }
      console.log('[useBoardConnections] Fetching connections for board:', boardId);
      const conns = await connectionsDb.getForBoard(boardId);
      console.log('[useBoardConnections] Fetched:', conns.length, 'connections');
      return conns.map(transformConnection);
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

  const createMutation = useMutation({
    mutationFn: async ({ from_block, to_block }: { from_block: string; to_block: string }) => {
      // Prevent self-connections
      if (from_block === to_block) {
        throw new Error('Cannot create self-connection');
      }

      // Check if connection already exists
      const exists = await connectionsDb.exists(from_block, to_block);
      if (exists) {
        throw new Error('Connection already exists');
      }

      console.log('[useConnectionActions] Creating connection:', from_block, '->', to_block);
      return connectionsDb.create({
        source_block_id: from_block,
        target_block_id: to_block,
      });
    },
    onSuccess: (_, { to_block }) => {
      queryClient.invalidateQueries({ queryKey: ['board-connections', boardId] });
      queryClient.invalidateQueries({ queryKey: ['block-incoming-connections', to_block] });
      queryClient.invalidateQueries({ queryKey: ['block-incoming-context', to_block] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ connectionId, targetBlockId }: { connectionId: string; targetBlockId: string }) => {
      console.log('[useConnectionActions] Deleting connection:', connectionId);
      await connectionsDb.delete(connectionId);
      return targetBlockId;
    },
    onSuccess: (targetBlockId) => {
      queryClient.invalidateQueries({ queryKey: ['board-connections', boardId] });
      queryClient.invalidateQueries({ queryKey: ['block-incoming-connections', targetBlockId] });
      queryClient.invalidateQueries({ queryKey: ['block-incoming-context', targetBlockId] });
    },
  });

  const create = useCallback((
    fromBlockId: string,
    toBlockId: string,
  ): void => {
    if (!user) {
      console.error('Connection creation denied: not authenticated');
      return;
    }
    createMutation.mutate({ from_block: fromBlockId, to_block: toBlockId });
  }, [user, createMutation]);

  const remove = useCallback((connectionId: string, targetBlockId?: string): void => {
    deleteMutation.mutate({ connectionId, targetBlockId: targetBlockId || '' });
  }, [deleteMutation]);

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
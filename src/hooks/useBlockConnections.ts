// Block Connections hooks - Ownership-aware access to connections
// These hooks manage explicit context passing between blocks

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCurrentUser } from './useCurrentUser';
import type { Connection, BlockContext, ConnectionContextType } from '@/types';

/**
 * Get all connections for a specific board (via its blocks)
 */
export function useBoardConnections(boardId: string | undefined) {
  const { blocks, connections } = useAppStore();
  const { user } = useCurrentUser();

  return useMemo(() => {
    if (!boardId || !user) return [];
    
    const boardBlockIds = blocks
      .filter((b) => b.board_id === boardId)
      .map((b) => b.id);
    
    return connections.filter(
      (c) => boardBlockIds.includes(c.from_block) || boardBlockIds.includes(c.to_block)
    );
  }, [blocks, connections, boardId, user]);
}

/**
 * Get incoming connections to a specific block
 */
export function useBlockIncomingConnections(blockId: string | undefined) {
  const { connections } = useAppStore();

  return useMemo(() => {
    if (!blockId) return [];
    return connections.filter((c) => c.to_block === blockId && c.enabled);
  }, [connections, blockId]);
}

/**
 * Get outgoing connections from a specific block
 */
export function useBlockOutgoingConnections(blockId: string | undefined) {
  const { connections } = useAppStore();

  return useMemo(() => {
    if (!blockId) return [];
    return connections.filter((c) => c.from_block === blockId && c.enabled);
  }, [connections, blockId]);
}

/**
 * Get the incoming context for a block from connected source blocks
 * This is the structured external input that should be treated separately from message history
 */
export function useBlockIncomingContext(blockId: string | undefined): BlockContext[] {
  const { blocks, messages, connections } = useAppStore();

  return useMemo(() => {
    if (!blockId) return [];

    const incomingConnections = connections.filter(
      (c) => c.to_block === blockId && c.enabled
    );

    return incomingConnections.map((conn) => {
      const sourceBlock = blocks.find((b) => b.id === conn.from_block);
      if (!sourceBlock) return null;

      // Get the last assistant message from the source block as the output
      const sourceMessages = messages
        .filter((m) => m.block_id === conn.from_block && m.role === 'assistant')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const lastOutput = sourceMessages[0];
      
      let content = '';
      if (lastOutput) {
        if (conn.context_type === 'summary') {
          // In production, this would call an AI to summarize
          // For now, truncate to first 200 chars as mock summary
          content = lastOutput.content.length > 200
            ? lastOutput.content.substring(0, 200) + '...'
            : lastOutput.content;
        } else {
          content = lastOutput.content;
        }

        // Apply transform template if present
        if (conn.transform_template && content) {
          content = conn.transform_template.replace('{{output}}', content);
        }
      }

      return {
        connection_id: conn.id,
        source_block_id: conn.from_block,
        source_block_title: sourceBlock.title,
        context_type: conn.context_type,
        content,
        created_at: lastOutput?.created_at || new Date().toISOString(),
      };
    }).filter((ctx): ctx is BlockContext => ctx !== null && ctx.content !== '');
  }, [blocks, messages, connections, blockId]);
}

/**
 * Check if a connection already exists between two blocks
 */
export function useConnectionExists(fromBlockId: string, toBlockId: string): boolean {
  const { connections } = useAppStore();
  
  return useMemo(() => {
    return connections.some(
      (c) => c.from_block === fromBlockId && c.to_block === toBlockId
    );
  }, [connections, fromBlockId, toBlockId]);
}

/**
 * Connection actions with ownership validation
 */
export function useConnectionActions(boardId: string) {
  const { user } = useCurrentUser();

  const validateBlockOwnership = (blockId: string): boolean => {
    if (!user) return false;
    const { blocks, boards } = useAppStore.getState();
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return false;
    const board = boards.find((b) => b.id === block.board_id);
    return board?.user_id === user.id;
  };

  const create = (
    fromBlockId: string,
    toBlockId: string,
    contextType: ConnectionContextType = 'full',
    transformTemplate?: string
  ): Connection | null => {
    if (!validateBlockOwnership(fromBlockId) || !validateBlockOwnership(toBlockId)) {
      console.error('Connection creation denied: ownership validation failed');
      return null;
    }

    // Prevent self-connections
    if (fromBlockId === toBlockId) {
      console.error('Cannot create self-connection');
      return null;
    }

    const { createConnection } = useAppStore.getState();
    return createConnection({
      from_block: fromBlockId,
      to_block: toBlockId,
      context_type: contextType,
      transform_template: transformTemplate,
      enabled: true,
    });
  };

  const update = (
    connectionId: string,
    updates: Partial<Pick<Connection, 'context_type' | 'transform_template' | 'enabled'>>
  ): void => {
    const { updateConnection } = useAppStore.getState();
    updateConnection(connectionId, updates);
  };

  const remove = (connectionId: string): void => {
    const { deleteConnection } = useAppStore.getState();
    deleteConnection(connectionId);
  };

  const toggle = (connectionId: string): void => {
    const { connections, updateConnection } = useAppStore.getState();
    const conn = connections.find((c) => c.id === connectionId);
    if (conn) {
      updateConnection(connectionId, { enabled: !conn.enabled });
    }
  };

  return {
    create,
    update,
    remove,
    toggle,
  };
}

/**
 * Get connection statistics for a block
 */
export function useBlockConnectionStats(blockId: string | undefined) {
  const incoming = useBlockIncomingConnections(blockId);
  const outgoing = useBlockOutgoingConnections(blockId);
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

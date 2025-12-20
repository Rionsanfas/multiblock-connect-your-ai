/**
 * Block Connections hooks - Ownership-aware access to connections
 * 
 * CRITICAL: Connections are DIRECTIONAL context inheritance.
 * If Block A → Block B: B receives A's full chat history as context. A does NOT receive B's.
 */

import { useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCurrentUser } from './useCurrentUser';
import type { Connection, BlockContext, ConnectionContextType, Message } from '@/types';

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
 * Get incoming connections TO a specific block (blocks that feed INTO this block)
 * These source blocks provide context to the target block.
 */
export function useBlockIncomingConnections(blockId: string | undefined) {
  const { connections } = useAppStore();

  return useMemo(() => {
    if (!blockId) return [];
    return connections.filter((c) => c.to_block === blockId && c.enabled);
  }, [connections, blockId]);
}

/**
 * Get outgoing connections FROM a specific block (blocks this block feeds INTO)
 * This block provides context to those target blocks.
 */
export function useBlockOutgoingConnections(blockId: string | undefined) {
  const { connections } = useAppStore();

  return useMemo(() => {
    if (!blockId) return [];
    return connections.filter((c) => c.from_block === blockId && c.enabled);
  }, [connections, blockId]);
}

/**
 * Context limit in characters to prevent token overflow
 */
const MAX_CONTEXT_CHARS = 8000;
const MAX_MESSAGES_PER_SOURCE = 20;

/**
 * Get the FULL incoming context for a block from all connected source blocks.
 * This includes the entire chat history from source blocks, not just the last message.
 * 
 * Rule: If Block A → Block B, then B receives A's chat history as context.
 */
export function useBlockIncomingContext(blockId: string | undefined): BlockContext[] {
  const { blocks, messages, connections } = useAppStore();

  return useMemo(() => {
    if (!blockId) return [];

    const incomingConnections = connections.filter(
      (c) => c.to_block === blockId && c.enabled
    );

    const contextList: BlockContext[] = [];

    for (const conn of incomingConnections) {
      const sourceBlock = blocks.find((b) => b.id === conn.from_block);
      if (!sourceBlock) continue;

      // Get ALL messages from the source block (not just last assistant message)
      const sourceMessages = messages
        .filter((m) => m.block_id === conn.from_block)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-MAX_MESSAGES_PER_SOURCE); // Limit to recent messages

      if (sourceMessages.length === 0) continue;

      // Build context content from source block's chat history
      let content = '';
      
      if (conn.context_type === 'summary') {
        // For summary mode, only include the last assistant response
        const lastAssistant = sourceMessages
          .filter(m => m.role === 'assistant')
          .pop();
        
        if (lastAssistant) {
          content = lastAssistant.content.length > 500
            ? lastAssistant.content.substring(0, 500) + '...'
            : lastAssistant.content;
        }
      } else {
        // For full mode, include entire conversation history
        content = sourceMessages
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
        contextList.push({
          connection_id: conn.id,
          source_block_id: conn.from_block,
          source_block_title: sourceBlock.title,
          context_type: conn.context_type,
          content,
          created_at: sourceMessages[sourceMessages.length - 1]?.created_at || new Date().toISOString(),
        });
      }
    }

    return contextList;
  }, [blocks, messages, connections, blockId]);
}

/**
 * Check if a connection already exists between two blocks (in either direction)
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
 * Check if a bidirectional connection exists
 */
export function useBidirectionalConnectionExists(blockA: string, blockB: string): boolean {
  const { connections } = useAppStore();
  
  return useMemo(() => {
    const hasAtoB = connections.some(c => c.from_block === blockA && c.to_block === blockB);
    const hasBtoA = connections.some(c => c.from_block === blockB && c.to_block === blockA);
    return hasAtoB && hasBtoA;
  }, [connections, blockA, blockB]);
}

/**
 * Connection actions with ownership validation
 */
export function useConnectionActions(boardId: string) {
  const { user } = useCurrentUser();

  const validateBlockOwnership = useCallback((blockId: string): boolean => {
    if (!user) return false;
    const { blocks, boards } = useAppStore.getState();
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return false;
    const board = boards.find((b) => b.id === block.board_id);
    return board?.user_id === user.id;
  }, [user]);

  const create = useCallback((
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

    // Check if connection already exists
    const { connections, createConnection } = useAppStore.getState();
    const exists = connections.some(
      c => c.from_block === fromBlockId && c.to_block === toBlockId
    );
    
    if (exists) {
      console.error('Connection already exists');
      return null;
    }

    return createConnection({
      from_block: fromBlockId,
      to_block: toBlockId,
      context_type: contextType,
      transform_template: transformTemplate,
      enabled: true,
    });
  }, [validateBlockOwnership]);

  const makeBidirectional = useCallback((connectionId: string): Connection | null => {
    const { connections, createConnection } = useAppStore.getState();
    const conn = connections.find(c => c.id === connectionId);
    if (!conn) return null;

    // Check if reverse already exists
    const reverseExists = connections.some(
      c => c.from_block === conn.to_block && c.to_block === conn.from_block
    );
    
    if (reverseExists) {
      console.log('Connection is already bidirectional');
      return null;
    }

    // Create reverse connection
    return createConnection({
      from_block: conn.to_block,
      to_block: conn.from_block,
      context_type: conn.context_type,
      transform_template: conn.transform_template,
      enabled: true,
    });
  }, []);

  const update = useCallback((
    connectionId: string,
    updates: Partial<Pick<Connection, 'context_type' | 'transform_template' | 'enabled'>>
  ): void => {
    const { updateConnection } = useAppStore.getState();
    updateConnection(connectionId, updates);
  }, []);

  const remove = useCallback((connectionId: string): void => {
    const { deleteConnection } = useAppStore.getState();
    deleteConnection(connectionId);
  }, []);

  const toggle = useCallback((connectionId: string): void => {
    const { connections, updateConnection } = useAppStore.getState();
    const conn = connections.find((c) => c.id === connectionId);
    if (conn) {
      updateConnection(connectionId, { enabled: !conn.enabled });
    }
  }, []);

  return {
    create,
    makeBidirectional,
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

/**
 * useConnectionSync - Live sync for connected blocks
 * 
 * When a message is sent in Block A, all blocks connected FROM A (A → B, A → C)
 * automatically receive the update in their incoming context.
 * 
 * This uses Supabase Realtime to listen for message inserts and
 * invalidates the relevant React Query caches for connected blocks.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { connectionsDb } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface MessagePayload {
  id: string;
  block_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
}

/**
 * Hook to enable live sync for a specific board.
 * Subscribes to message inserts and updates connected blocks' context caches.
 */
export function useBoardConnectionSync(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Cache outgoing connections to avoid repeated DB calls
  const outgoingConnectionsCache = useRef<Map<string, string[]>>(new Map());

  // Fetch outgoing connections for a block (with caching)
  const getOutgoingTargets = useCallback(async (blockId: string): Promise<string[]> => {
    // Check cache first
    const cached = outgoingConnectionsCache.current.get(blockId);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const connections = await connectionsDb.getOutgoing(blockId);
      const targetBlockIds = connections.map(c => c.target_block_id);
      outgoingConnectionsCache.current.set(blockId, targetBlockIds);
      return targetBlockIds;
    } catch (error) {
      console.error('[useConnectionSync] Error fetching outgoing connections:', error);
      return [];
    }
  }, []);

  // Handle a new message insert
  const handleMessageInsert = useCallback(async (
    payload: RealtimePostgresInsertPayload<MessagePayload>
  ) => {
    const newMessage = payload.new;
    if (!newMessage?.block_id) return;

    console.log('[useConnectionSync] New message detected in block:', newMessage.block_id);

    // Find all blocks connected FROM this block (A → B means B needs update)
    const targetBlockIds = await getOutgoingTargets(newMessage.block_id);
    
    if (targetBlockIds.length === 0) {
      console.log('[useConnectionSync] No outgoing connections from block:', newMessage.block_id);
      return;
    }

    console.log('[useConnectionSync] Syncing to connected blocks:', targetBlockIds);

    // Invalidate the incoming context cache for each connected block
    // This triggers React Query to refetch the context with the new message
    for (const targetBlockId of targetBlockIds) {
      // Invalidate the incoming context query for the target block
      queryClient.invalidateQueries({
        queryKey: ['block-incoming-context', targetBlockId],
        exact: false,
      });
      
      console.log('[useConnectionSync] Invalidated context for block:', targetBlockId);
    }
  }, [queryClient, getOutgoingTargets]);

  // Clear connection cache when connections change
  const clearConnectionCache = useCallback(() => {
    outgoingConnectionsCache.current.clear();
  }, []);

  useEffect(() => {
    if (!boardId || !user?.id) return;

    console.log('[useConnectionSync] Setting up Realtime subscription for board:', boardId);

    // Subscribe to message inserts for this user
    const channel = supabase
      .channel(`board-messages-sync-${boardId}`)
      .on<MessagePayload>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${user.id}`,
        },
        handleMessageInsert
      )
      .subscribe((status) => {
        console.log('[useConnectionSync] Subscription status:', status);
      });

    // Also listen for connection changes to clear the cache
    const connectionChannel = supabase
      .channel(`board-connections-sync-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'block_connections',
        },
        () => {
          console.log('[useConnectionSync] Connection change detected, clearing cache');
          clearConnectionCache();
          // Also invalidate all connection queries
          queryClient.invalidateQueries({ queryKey: ['board-connections', boardId] });
        }
      )
      .subscribe();

    return () => {
      console.log('[useConnectionSync] Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
      supabase.removeChannel(connectionChannel);
      outgoingConnectionsCache.current.clear();
    };
  }, [boardId, user?.id, handleMessageInsert, clearConnectionCache, queryClient]);
}

/**
 * Hook to sync a specific block's incoming context in real-time.
 * Use this in BlockChatModal to ensure context stays fresh.
 */
export function useBlockContextSync(blockId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Track source blocks we're connected from
  const sourceBlocksRef = useRef<string[]>([]);

  // Update source blocks when incoming connections change
  const updateSourceBlocks = useCallback(async () => {
    if (!blockId) {
      sourceBlocksRef.current = [];
      return;
    }

    try {
      const connections = await connectionsDb.getIncoming(blockId);
      sourceBlocksRef.current = connections.map(c => c.source_block_id);
      console.log('[useBlockContextSync] Watching source blocks:', sourceBlocksRef.current);
    } catch (error) {
      console.error('[useBlockContextSync] Error fetching incoming connections:', error);
    }
  }, [blockId]);

  useEffect(() => {
    updateSourceBlocks();
  }, [updateSourceBlocks]);

  useEffect(() => {
    if (!blockId || !user?.id) return;

    console.log('[useBlockContextSync] Setting up context sync for block:', blockId);

    // Subscribe to message inserts from source blocks
    const channel = supabase
      .channel(`block-context-sync-${blockId}`)
      .on<MessagePayload>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new;
          
          // Check if this message is from one of our source blocks
          if (sourceBlocksRef.current.includes(newMessage.block_id)) {
            console.log('[useBlockContextSync] Source block message detected:', newMessage.block_id);
            
            // Invalidate our incoming context to pick up the new message
            queryClient.invalidateQueries({
              queryKey: ['block-incoming-context', blockId],
              exact: false,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [blockId, user?.id, queryClient]);
}

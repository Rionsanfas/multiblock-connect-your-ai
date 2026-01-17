/**
 * Board-level API key management hooks
 * 
 * Handles fetching available keys for a board and updating board's linked key
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { LLMProvider } from '@/types/database.types';

export interface AvailableApiKey {
  id: string;
  provider: LLMProvider;
  key_hint: string | null;
  is_valid: boolean | null;
  team_id: string | null;
  user_id: string;
  created_at: string;
}

/**
 * Get all API keys available for a specific board
 * For team boards: returns team keys
 * For personal boards: returns user's personal keys
 */
export function useAvailableKeysForBoard(boardId: string | null) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['available-keys-for-board', boardId],
    queryFn: async (): Promise<AvailableApiKey[]> => {
      if (!boardId) return [];
      
      const { data, error } = await supabase
        .rpc('get_available_keys_for_board', { p_board_id: boardId });
      
      if (error) {
        console.error('[useBoardApiKeys] Error fetching available keys:', error);
        throw error;
      }
      
      return (data || []) as AvailableApiKey[];
    },
    enabled: isAuthenticated && !!boardId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get available keys grouped by provider for a board
 */
export function useAvailableKeysByProvider(boardId: string | null) {
  const query = useAvailableKeysForBoard(boardId);
  const keys = query.data || [];
  
  const keysByProvider = keys.reduce((acc, key) => {
    if (!acc[key.provider]) {
      acc[key.provider] = [];
    }
    acc[key.provider].push(key);
    return acc;
  }, {} as Record<LLMProvider, AvailableApiKey[]>);
  
  return { keysByProvider, keys, isLoading: query.isLoading, error: query.error };
}

/**
 * Get keys for a specific provider for the current board
 */
export function useKeysForProvider(boardId: string | null, provider: LLMProvider | null) {
  const { data: keys = [], isLoading } = useAvailableKeysForBoard(boardId);
  
  const providerKeys = provider 
    ? keys.filter(k => k.provider === provider) 
    : [];
  
  return { 
    providerKeys, 
    hasMultipleKeys: providerKeys.length > 1,
    hasSingleKey: providerKeys.length === 1,
    hasNoKey: providerKeys.length === 0,
    isLoading 
  };
}

/**
 * Get the current board's linked API key
 */
export function useBoardLinkedKey(boardId: string | null) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['board-linked-key', boardId],
    queryFn: async () => {
      if (!boardId) return null;
      
      const { data, error } = await supabase
        .from('boards')
        .select('api_key_id')
        .eq('id', boardId)
        .single();
      
      if (error) {
        console.error('[useBoardApiKeys] Error fetching linked key:', error);
        return null;
      }
      
      return data?.api_key_id || null;
    },
    enabled: isAuthenticated && !!boardId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to update a board's linked API key
 */
export function useUpdateBoardApiKey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ boardId, apiKeyId }: { boardId: string; apiKeyId: string | null }) => {
      const { data, error } = await supabase
        .from('boards')
        .update({ api_key_id: apiKeyId })
        .eq('id', boardId)
        .select()
        .single();
      
      if (error) {
        console.error('[useBoardApiKeys] Error updating board API key:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['board-linked-key', data.id] });
      queryClient.invalidateQueries({ queryKey: ['board', data.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-boards'] });
    },
  });
}

/**
 * Auto-link single key or return keys for selection
 * Returns { needsSelection, keys, autoKey } 
 */
export function useResolveKeyForBoard(boardId: string | null, provider: LLMProvider | null) {
  const { providerKeys, hasMultipleKeys, hasSingleKey, hasNoKey, isLoading } = useKeysForProvider(boardId, provider);
  const { data: linkedKeyId } = useBoardLinkedKey(boardId);
  
  // If board already has a linked key for this provider, use it
  const linkedKey = providerKeys.find(k => k.id === linkedKeyId);
  
  return {
    isLoading,
    linkedKey,
    hasLinkedKey: !!linkedKey,
    needsSelection: hasMultipleKeys && !linkedKey,
    autoKey: hasSingleKey ? providerKeys[0] : null,
    providerKeys,
    hasNoKey,
  };
}

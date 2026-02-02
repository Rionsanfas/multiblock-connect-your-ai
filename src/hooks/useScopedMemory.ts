import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MemoryItemType } from './useBoardMemory';
import type { MemoryScope, ScopedMemoryItem, MemoryFilterOptions } from '@/services/memoryInjectionService';
import { filterMemoryItems, getMemoryForBlock, extractKeywords } from '@/services/memoryInjectionService';

export interface CreateScopedMemoryInput {
  type: MemoryItemType;
  content: string;
  scope: MemoryScope;
  sourceBlockId?: string;
  sourceMessageId?: string;
  keywords?: string[];
}

export interface UpdateScopedMemoryInput {
  type?: MemoryItemType;
  content?: string;
  scope?: MemoryScope;
  keywords?: string[];
}

/**
 * Fetch all memory items for a board with scope support
 */
export function useScopedBoardMemory(boardId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['scoped-board-memory', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      
      const { data, error } = await supabase
        .from('board_memory')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Cast to ScopedMemoryItem with defaults for new fields
      return (data || []).map(item => ({
        ...item,
        scope: (item.scope as MemoryScope) || 'board',
        keywords: (item.keywords as string[]) || [],
      })) as ScopedMemoryItem[];
    },
    enabled: !!boardId && !!user && !authLoading,
    staleTime: 30_000,
  });
}

/**
 * Get filtered memory items for a specific block
 */
export function useBlockMemory(
  boardId: string | undefined,
  blockId: string | undefined,
  filterOptions?: Omit<MemoryFilterOptions, 'sourceBlockId'>
) {
  const { data: allMemory = [], isLoading, error } = useScopedBoardMemory(boardId);

  // Filter to relevant items for this block
  const blockMemory = blockId ? getMemoryForBlock(allMemory, blockId, filterOptions) : {
    formattedContent: '',
    includedItems: [],
    excludedItems: [],
    charCount: 0,
    wasTruncated: false,
  };

  return {
    ...blockMemory,
    allItems: allMemory,
    isLoading,
    error,
  };
}

/**
 * Get memory filtered by custom options
 */
export function useFilteredMemory(
  boardId: string | undefined,
  options: MemoryFilterOptions
) {
  const { data: allMemory = [], isLoading, error } = useScopedBoardMemory(boardId);
  
  const filtered = filterMemoryItems(allMemory, options);

  return {
    items: filtered,
    allItems: allMemory,
    isLoading,
    error,
  };
}

/**
 * Hook for scoped memory CRUD operations
 */
export function useScopedMemoryActions(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMemory = useMutation({
    mutationFn: async (input: CreateScopedMemoryInput) => {
      if (!boardId || !user) throw new Error('Not authenticated or no board');

      // Auto-extract keywords if not provided
      const keywords = input.keywords ?? extractKeywords(input.content);

      const { data, error } = await supabase
        .from('board_memory')
        .insert({
          board_id: boardId,
          user_id: user.id,
          type: input.type,
          content: input.content,
          scope: input.scope,
          source_block_id: input.sourceBlockId || null,
          source_message_id: input.sourceMessageId || null,
          keywords,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ScopedMemoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoped-board-memory', boardId] });
      // Also invalidate the old query for backwards compatibility
      queryClient.invalidateQueries({ queryKey: ['board-memory', boardId] });
    },
  });

  const updateMemory = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateScopedMemoryInput & { id: string }) => {
      // If content is updated, re-extract keywords
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.content && !updates.keywords) {
        updateData.keywords = extractKeywords(updates.content);
      }

      const { data, error } = await supabase
        .from('board_memory')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ScopedMemoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoped-board-memory', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board-memory', boardId] });
    },
  });

  const deleteMemory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('board_memory')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoped-board-memory', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board-memory', boardId] });
    },
  });

  return {
    createMemory: createMemory.mutateAsync,
    updateMemory: updateMemory.mutateAsync,
    deleteMemory: deleteMemory.mutateAsync,
    isCreating: createMemory.isPending,
    isUpdating: updateMemory.isPending,
    isDeleting: deleteMemory.isPending,
  };
}

/**
 * Format memory for context injection - re-export for convenience
 */
export { formatMemoryForPrompt, buildMemoryContext, getMemoryForBlock } from '@/services/memoryInjectionService';
export type { MemoryScope, ScopedMemoryItem, MemoryFilterOptions, InjectedMemoryResult } from '@/services/memoryInjectionService';

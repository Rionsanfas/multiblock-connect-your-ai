import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MemoryItemType = 'fact' | 'decision' | 'constraint' | 'note';

export interface MemoryItem {
  id: string;
  board_id: string;
  user_id: string;
  type: MemoryItemType;
  content: string;
  source_block_id: string | null;
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryItemInput {
  board_id: string;
  type: MemoryItemType;
  content: string;
  source_block_id?: string;
  source_message_id?: string;
}

export interface UpdateMemoryItemInput {
  type?: MemoryItemType;
  content?: string;
}

/**
 * Fetch all memory items for a board
 */
export function useBoardMemory(boardId: string | undefined) {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['board-memory', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      
      const { data, error } = await supabase
        .from('board_memory')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as MemoryItem[];
    },
    enabled: !!boardId && !!user && !authLoading,
    staleTime: 30_000,
  });
}

/**
 * Format memory items for injection into LLM context
 */
export function formatMemoryForContext(items: MemoryItem[]): string {
  if (items.length === 0) return '';

  const grouped = {
    fact: items.filter(i => i.type === 'fact'),
    decision: items.filter(i => i.type === 'decision'),
    constraint: items.filter(i => i.type === 'constraint'),
    note: items.filter(i => i.type === 'note'),
  };

  const lines: string[] = ['## Board Memory'];

  if (grouped.fact.length > 0) {
    lines.push('\n### Facts');
    grouped.fact.forEach(f => lines.push(`- ${f.content}`));
  }

  if (grouped.decision.length > 0) {
    lines.push('\n### Decisions');
    grouped.decision.forEach(d => lines.push(`- ${d.content}`));
  }

  if (grouped.constraint.length > 0) {
    lines.push('\n### Constraints');
    grouped.constraint.forEach(c => lines.push(`- ${c.content}`));
  }

  if (grouped.note.length > 0) {
    lines.push('\n### Notes');
    grouped.note.forEach(n => lines.push(`- ${n.content}`));
  }

  return lines.join('\n');
}

/**
 * Hook for memory CRUD operations
 */
export function useMemoryActions(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMemory = useMutation({
    mutationFn: async (input: Omit<CreateMemoryItemInput, 'board_id'>) => {
      if (!boardId || !user) throw new Error('Not authenticated or no board');

      const { data, error } = await supabase
        .from('board_memory')
        .insert({
          board_id: boardId,
          user_id: user.id,
          type: input.type,
          content: input.content,
          source_block_id: input.source_block_id || null,
          source_message_id: input.source_message_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MemoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-memory', boardId] });
    },
  });

  const updateMemory = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateMemoryItemInput & { id: string }) => {
      const { data, error } = await supabase
        .from('board_memory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MemoryItem;
    },
    onSuccess: () => {
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

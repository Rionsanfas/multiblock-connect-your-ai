/**
 * Workspace-aware board hooks
 * 
 * Fetches boards based on current workspace context (personal or team)
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { boardsDb } from '@/lib/database';
import type { Board as SupabaseBoard } from '@/types/database.types';
import type { Board as LegacyBoard } from '@/types';
import { toast } from 'sonner';

/**
 * Transform Supabase Board to legacy Board format
 */
function transformBoard(board: SupabaseBoard): LegacyBoard {
  return {
    id: board.id,
    title: board.name,
    user_id: board.user_id,
    metadata: {
      description: board.description || undefined,
    },
    created_at: board.created_at,
    updated_at: board.updated_at,
  };
}

/**
 * Get boards for the current workspace (personal or team)
 */
export function useWorkspaceBoards(): LegacyBoard[] {
  const { user: authUser, isAuthenticated } = useAuth();
  const { currentWorkspace, isTeamWorkspace } = useTeamContext();

  const { data: boards = [] } = useQuery({
    queryKey: ['workspace-boards', currentWorkspace.type, currentWorkspace.teamId, authUser?.id],
    queryFn: async () => {
      if (isTeamWorkspace && currentWorkspace.teamId) {
        return boardsDb.getForTeam(currentWorkspace.teamId);
      }
      return boardsDb.getAll();
    },
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes - reduce refetches
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  return useMemo(() => boards.map(transformBoard), [boards]);
}

/**
 * Get personal boards only (for transfer dialog)
 */
export function usePersonalBoards(): LegacyBoard[] {
  const { user: authUser, isAuthenticated } = useAuth();

  const { data: boards = [] } = useQuery({
    queryKey: ['personal-boards', authUser?.id],
    queryFn: () => boardsDb.getAll(),
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 30 * 1000,
  });

  return useMemo(() => boards.map(transformBoard), [boards]);
}

/**
 * Hook to transfer a board to a team
 */
export function useBoardTransfer() {
  const queryClient = useQueryClient();

  const transferMutation = useMutation({
    mutationFn: async ({ boardId, teamId }: { boardId: string; teamId: string }) => {
      return boardsDb.transferToTeam(boardId, teamId);
    },
    onSuccess: () => {
      // Invalidate all board-related queries
      queryClient.invalidateQueries({ queryKey: ['workspace-boards'] });
      queryClient.invalidateQueries({ queryKey: ['personal-boards'] });
      queryClient.invalidateQueries({ queryKey: ['user-boards'] });
      toast.success('Board transferred to team');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to transfer board');
    },
  });

  return {
    transferBoard: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
  };
}

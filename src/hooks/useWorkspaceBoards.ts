/**
 * Workspace-aware board hooks
 * 
 * Fetches boards based on current workspace context (personal or team)
 * 
 * IMPORTANT: No aggressive caching - data must always be fresh on context switch
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
    team_id: board.team_id,
    is_locked: (board as any).is_locked ?? false,
    locked_reason: (board as any).locked_reason ?? null,
    metadata: {
      description: board.description || undefined,
    },
    created_at: board.created_at,
    updated_at: board.updated_at,
  };
}

/**
 * Get boards for the current workspace (personal or team)
 * 
 * Key behavior:
 * - Refetches on workspace change (queryKey includes workspace info)
 * - No stale time caching - always validates freshness
 * - Filters strictly by workspace type
 */
export function useWorkspaceBoards(): LegacyBoard[] {
  const { user: authUser, isAuthenticated } = useAuth();
  const { currentWorkspace, isTeamWorkspace } = useTeamContext();

  const { data: boards = [] } = useQuery({
    // CRITICAL: queryKey must include all workspace context to trigger refetch
    queryKey: ['workspace-boards', currentWorkspace.type, currentWorkspace.teamId, authUser?.id],
    queryFn: async () => {
      if (isTeamWorkspace && currentWorkspace.teamId) {
        // Team workspace: fetch ONLY team boards
        const teamBoards = await boardsDb.getForTeam(currentWorkspace.teamId);
        return teamBoards;
      }
      // Personal workspace: fetch ONLY personal boards (no team_id)
      const allBoards = await boardsDb.getAll();
      // Filter to only personal boards (team_id is null)
      return allBoards.filter(b => !b.team_id);
    },
    enabled: isAuthenticated && !!authUser?.id,
    // Longer stale time for perceived speed - data stays fresh in cache
    staleTime: 1000 * 30, // 30 seconds - prevents refetch on every navigation
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    // Only refetch if data is actually stale (not on every mount)
    refetchOnMount: true, // Will only fetch if stale
    refetchOnWindowFocus: false, // Disable aggressive refetch
    // Keep previous data while fetching new data (prevents flash)
    placeholderData: (previousData) => previousData,
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
    queryFn: async () => {
      const allBoards = await boardsDb.getAll();
      // Filter to only personal boards
      return allBoards.filter(b => !b.team_id);
    },
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 1000 * 10, // 10 seconds
    refetchOnMount: 'always',
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
      // Invalidate all board-related queries - force complete refresh
      queryClient.invalidateQueries({ queryKey: ['workspace-boards'] });
      queryClient.invalidateQueries({ queryKey: ['personal-boards'] });
      queryClient.invalidateQueries({ queryKey: ['user-boards'] });
      // Remove from cache to force refetch
      queryClient.removeQueries({ queryKey: ['workspace-boards'] });
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

/**
 * useCurrentUser Hook
 * 
 * Compatibility layer that wraps useAuth for components
 * that expect the legacy User type.
 * 
 * For new code, prefer using useAuth directly.
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { boardsDb } from '@/lib/database';
import { usePlanLimits } from './usePlanLimits';
import type { Board as SupabaseBoard } from '@/types/database.types';
import type { Board as LegacyBoard } from '@/types';

interface LegacyUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  /** Display label (e.g. "Free", "Pro Team") */
  plan: string;
  boards_limit: number;
  boards_used: number;
  storage_limit_mb: number;
  storage_used_mb: number;
  seats?: number;
  seats_used?: number;
  created_at: string;
}

interface CurrentUserState {
  user: LegacyUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Transform Supabase Board to legacy Board format
 */
function transformBoard(board: SupabaseBoard): LegacyBoard {
  return {
    id: board.id,
    title: board.name, // Supabase uses 'name', legacy uses 'title'
    user_id: board.user_id,
    metadata: {
      description: board.description || undefined,
    },
    created_at: board.created_at,
    updated_at: board.updated_at,
  };
}

/**
 * Get the current user and authentication state (legacy compatibility)
 *
 * IMPORTANT: plan display and limits come from user_billing via usePlanLimits.
 * This prevents "Free" vs "Pro Team" mismatches across the app.
 */
export function useCurrentUser(): CurrentUserState {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const limits = usePlanLimits();

  const legacyUser = useMemo((): LegacyUser | null => {
    if (!authUser) return null;

    const boardsLimit = limits.boardsUnlimited ? -1 : limits.boardsLimit;

    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      avatar: authUser.user_metadata?.avatar_url || undefined,
      plan: limits.planName, // "Free", "Pro Team", ...
      boards_limit: boardsLimit,
      boards_used: limits.boardsUsed,
      storage_limit_mb: Math.round(limits.storageLimitMb),
      storage_used_mb: 0,
      seats: limits.seatsLimit,
      seats_used: 1,
      created_at: authUser.created_at || new Date().toISOString(),
    };
  }, [authUser, limits.boardsUnlimited, limits.boardsLimit, limits.boardsUsed, limits.planName, limits.seatsLimit, limits.storageLimitMb]);

  return {
    user: legacyUser,
    isAuthenticated,
    isLoading: authLoading || (isAuthenticated && limits.isLoading),
  };
}

/**
 * Get boards owned by the current user
 * Returns legacy Board format for backward compatibility
 */
export function useUserBoards(): LegacyBoard[] {
  const { user: authUser, isAuthenticated } = useAuth();
  
  const { data: boards = [] } = useQuery({
    queryKey: ['user-boards', authUser?.id],
    queryFn: () => boardsDb.getAll(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  // Transform to legacy format
  return useMemo(() => boards.map(transformBoard), [boards]);
}

/**
 * Get usage stats for the current user
 */
export function useUserStats() {
  const { user } = useCurrentUser();
  
  if (!user) {
    return null;
  }
  
  return {
    boardsUsed: user.boards_used,
    boardsLimit: user.boards_limit,
    boardsRemaining: Math.max(0, user.boards_limit - user.boards_used),
    totalBlocks: 0, // Will be calculated per-board
    storageUsedMb: user.storage_used_mb,
    storageLimitMb: user.storage_limit_mb,
    plan: user.plan,
    seatsUsed: user.seats_used,
    seatsLimit: user.seats,
  };
}

/**
 * Result type for useUserBoard hook
 */
interface UseUserBoardResult {
  board: LegacyBoard | null;
  isLoading: boolean;
  error: Error | null;
  isForbidden: boolean;
}

/**
 * Get a specific board with ownership validation
 * Returns legacy Board format for backward compatibility
 * Memoized to prevent infinite render loops
 */
export function useUserBoard(boardId: string | undefined): UseUserBoardResult {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: board, isLoading: queryLoading, error } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!boardId) return null;
      
      // OPTIMIZATION: Check workspace-boards cache first for optimistic boards
      // This enables instant navigation to newly created boards
      const allCacheKeys = queryClient.getQueryCache().getAll();
      for (const query of allCacheKeys) {
        if (query.queryKey[0] === 'workspace-boards') {
          const boards = query.state.data as any[] | undefined;
          const cachedBoard = boards?.find(b => b.id === boardId);
          if (cachedBoard) {
            console.log('[useUserBoard] Found optimistic board in cache:', boardId);
            return cachedBoard;
          }
        }
      }
      
      console.log('[useUserBoard] Fetching board from DB:', boardId);
      const result = await boardsDb.getById(boardId);
      console.log('[useUserBoard] Fetch result:', { 
        boardId, 
        found: !!result, 
        userId: result?.user_id 
      });
      return result;
    },
    enabled: !authLoading && isAuthenticated && !!authUser?.id && !!boardId,
    staleTime: 1000 * 60 * 5, // 5 minutes - board data rarely changes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
    // Keep previous board data during navigation
    placeholderData: (previousData) => previousData,
    // Quick retry for optimistic boards
    retry: (failureCount) => failureCount < 2,
    retryDelay: 500,
  });
  
  // Memoize the transformed board to ensure stable reference
  const transformedBoard = useMemo((): LegacyBoard | null => {
    if (!board) return null;
    return transformBoard(board);
  }, [board?.id, board?.name, board?.user_id, board?.description, board?.created_at, board?.updated_at]);
  
  // Check ownership - memoized
  const isForbidden = useMemo(() => {
    if (!board || !authUser) return false;
    return board.user_id !== authUser.id;
  }, [board?.user_id, authUser?.id]);
  
  // Return null board if forbidden
  const finalBoard = isForbidden ? null : transformedBoard;
  
  return {
    board: finalBoard,
    isLoading: authLoading || queryLoading,
    error: error as Error | null,
    isForbidden,
  };
}

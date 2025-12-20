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
import { useQuery } from '@tanstack/react-query';
import { subscriptionsDb, boardsDb } from '@/lib/database';
import type { Board as SupabaseBoard } from '@/types/database.types';
import type { Board as LegacyBoard } from '@/types';

interface LegacyUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
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
 */
export function useCurrentUser(): CurrentUserState {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['user-subscription', authUser?.id],
    queryFn: () => subscriptionsDb.getCurrent(),
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: boardCount = 0, isLoading: boardsLoading } = useQuery({
    queryKey: ['user-board-count', authUser?.id],
    queryFn: () => boardsDb.getCount(),
    enabled: !!authUser,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const legacyUser = useMemo((): LegacyUser | null => {
    if (!authUser) return null;
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      avatar: authUser.user_metadata?.avatar_url || undefined,
      plan: subscription?.tier || 'free',
      boards_limit: subscription?.max_boards || 3,
      boards_used: boardCount,
      storage_limit_mb: 100, // Default storage
      storage_used_mb: 0,
      seats: subscription?.max_seats || 1,
      seats_used: 1,
      created_at: authUser.created_at || new Date().toISOString(),
    };
  }, [authUser, subscription, boardCount]);

  return {
    user: legacyUser,
    isAuthenticated,
    isLoading: authLoading || (isAuthenticated && (subLoading || boardsLoading)),
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
    staleTime: 30 * 1000, // 30 seconds
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
 * Get a specific board with ownership validation
 * Returns legacy Board format for backward compatibility
 */
export function useUserBoard(boardId: string | undefined): LegacyBoard | null {
  const { user: authUser, isAuthenticated } = useAuth();
  
  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardsDb.getById(boardId!),
    enabled: isAuthenticated && !!boardId,
    staleTime: 30 * 1000,
  });
  
  // Verify ownership
  if (board && authUser && board.user_id !== authUser.id) {
    return null;
  }
  
  // Transform to legacy format
  return board ? transformBoard(board) : null;
}

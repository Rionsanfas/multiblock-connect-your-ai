/**
 * useCurrentUser Hook
 * 
 * Single source of truth for accessing the current authenticated user.
 * All components should use this hook instead of directly accessing
 * the store or importing mock data.
 * 
 * This abstraction allows easy swapping between mock and real auth.
 */

import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

interface CurrentUserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Get the current user and authentication state
 * 
 * Usage:
 * ```tsx
 * const { user, isAuthenticated } = useCurrentUser();
 * 
 * if (!isAuthenticated) {
 *   return <Navigate to="/auth" />;
 * }
 * 
 * return <div>Welcome, {user.name}</div>;
 * ```
 */
export function useCurrentUser(): CurrentUserState {
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  return {
    user,
    isAuthenticated,
    isLoading: false, // Will be true during real auth checks
  };
}

/**
 * Get boards owned by the current user
 * 
 * This ensures proper data isolation - users only see their own boards.
 * When real auth is added, this pattern ensures no data leaks.
 */
export function useUserBoards() {
  const { user } = useCurrentUser();
  const boards = useAppStore((state) => state.boards);
  
  // Filter boards by current user
  // If no user, return empty array (enforces auth requirement)
  if (!user) {
    return [];
  }
  
  return boards.filter((board) => board.user_id === user.id);
}

/**
 * Get usage stats for the current user
 * 
 * Calculates actual usage from data rather than stored values,
 * ensuring accuracy.
 */
export function useUserStats() {
  const { user } = useCurrentUser();
  const boards = useUserBoards();
  const allBlocks = useAppStore((state) => state.blocks);
  
  if (!user) {
    return null;
  }
  
  // Calculate actual boards used
  const boardsUsed = boards.length;
  
  // Calculate total blocks across user's boards
  const boardIds = new Set(boards.map((b) => b.id));
  const totalBlocks = allBlocks.filter((block) => boardIds.has(block.board_id)).length;
  
  return {
    boardsUsed,
    boardsLimit: user.boards_limit,
    boardsRemaining: Math.max(0, user.boards_limit - boardsUsed),
    totalBlocks,
    storageUsedMb: user.storage_used_mb,
    storageLimitMb: user.storage_limit_mb,
    plan: user.plan,
    seatsUsed: user.seats_used,
    seatsLimit: user.seats,
  };
}

/**
 * Get a specific board, with ownership validation
 * Returns null if the board doesn't exist or doesn't belong to current user
 */
export function useUserBoard(boardId: string | undefined) {
  const { user } = useCurrentUser();
  const boards = useAppStore((state) => state.boards);
  
  if (!user || !boardId) {
    return null;
  }
  
  const board = boards.find((b) => b.id === boardId);
  
  // Verify ownership
  if (board && board.user_id !== user.id) {
    return null;
  }
  
  return board || null;
}

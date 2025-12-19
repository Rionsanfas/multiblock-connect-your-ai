import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCurrentUser, useUserBoards } from './useCurrentUser';
import { pricingPlans } from '@/mocks/seed';
import { toast } from 'sonner';

// Plan limits configuration
const PLAN_LIMITS = {
  free: { boards: 1, blocksPerBoard: 3 },
  'pro-50': { boards: 50, blocksPerBoard: Infinity },
  'pro-100': { boards: 100, blocksPerBoard: Infinity },
  'team-50': { boards: 50, blocksPerBoard: Infinity },
  'team-100': { boards: 100, blocksPerBoard: Infinity },
} as const;

export function usePlanLimits() {
  const { user } = useCurrentUser();
  const boards = useUserBoards();
  const blocks = useAppStore((s) => s.blocks);
  
  return useMemo(() => {
    const plan = user?.plan || 'free';
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    const isFree = plan === 'free';
    
    // Get current plan details
    const planDetails = pricingPlans.find((p) => p.id === plan) || pricingPlans[0];
    
    return {
      plan,
      isFree,
      planName: planDetails.name,
      
      // Board limits
      boardsLimit: limits.boards,
      boardsUsed: boards.length,
      canCreateBoard: boards.length < limits.boards,
      boardsRemaining: Math.max(0, limits.boards - boards.length),
      
      // Block limits (per board)
      blocksPerBoard: limits.blocksPerBoard,
      
      // Helper to check if can create block on a board
      getBlocksOnBoard: (boardId: string) => blocks.filter((b) => b.board_id === boardId).length,
      canCreateBlockOnBoard: (boardId: string) => {
        const blocksOnBoard = blocks.filter((b) => b.board_id === boardId).length;
        return blocksOnBoard < limits.blocksPerBoard;
      },
      getBlocksRemaining: (boardId: string) => {
        const blocksOnBoard = blocks.filter((b) => b.board_id === boardId).length;
        return Math.max(0, limits.blocksPerBoard - blocksOnBoard);
      },
    };
  }, [user, boards, blocks]);
}

/**
 * Enforcement hook - use this to guard actions
 */
export function usePlanEnforcement() {
  const limits = usePlanLimits();
  
  const enforceCreateBoard = (): boolean => {
    if (!limits.canCreateBoard) {
      toast.error(`Board limit reached`, {
        description: limits.isFree 
          ? `Free plan allows only ${limits.boardsLimit} board. Upgrade to create more.`
          : `Your ${limits.planName} plan allows ${limits.boardsLimit} boards.`,
        action: limits.isFree ? {
          label: "Upgrade",
          onClick: () => window.location.href = "/pricing"
        } : undefined
      });
      return false;
    }
    return true;
  };
  
  const enforceCreateBlock = (boardId: string): boolean => {
    if (!limits.canCreateBlockOnBoard(boardId)) {
      const blocksOnBoard = limits.getBlocksOnBoard(boardId);
      toast.error(`Block limit reached`, {
        description: limits.isFree 
          ? `Free plan allows only ${limits.blocksPerBoard} blocks per board. Upgrade to add more.`
          : `You have ${blocksOnBoard} blocks on this board.`,
        action: limits.isFree ? {
          label: "Upgrade",
          onClick: () => window.location.href = "/pricing"
        } : undefined
      });
      return false;
    }
    return true;
  };
  
  return {
    ...limits,
    enforceCreateBoard,
    enforceCreateBlock,
  };
}

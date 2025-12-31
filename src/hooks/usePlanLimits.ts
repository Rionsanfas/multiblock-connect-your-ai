import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useBilling } from './useBilling';
import { boardsDb, apiKeysDb } from '@/lib/database';
import { toast } from 'sonner';

/**
 * Fetch real plan limits from user_billing table (Polar-synced)
 */
export function usePlanLimits() {
  const { user, isAuthenticated } = useAuth();
  const { data: billing, isLoading: billingLoading } = useBilling();
  
  // Fetch board count
  const { data: boardCount = 0, isLoading: boardsLoading } = useQuery({
    queryKey: ['user-board-count', user?.id],
    queryFn: () => boardsDb.getCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  // Fetch API key count
  const { data: apiKeyCount = 0, isLoading: keysLoading } = useQuery({
    queryKey: ['user-apikey-count', user?.id],
    queryFn: () => apiKeysDb.getCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes - API keys rarely change
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  const isLoading = billingLoading || boardsLoading || keysLoading;

  return useMemo(() => {
    // Get limits from billing (user_billing table from Polar)
    const isActive = billing?.subscription_status === 'active' || billing?.is_lifetime;
    const planName = billing?.active_plan ?? 'free';
    const isFree = !isActive || planName === 'free';
    
    // Board limits - use total_boards which includes addons
    const maxBoards = billing?.total_boards ?? 1;
    const maxBlocksPerBoard = billing?.blocks ?? -1; // -1 is unlimited
    const maxStorageMb = (billing?.total_storage_gb ?? 0.1) * 1024; // Convert GB to MB
    const maxSeats = billing?.seats ?? 1;
    
    // For free plan, use default limits
    const effectiveMaxBoards = isFree ? 1 : maxBoards;
    const effectiveMaxBlocks = isFree ? 3 : maxBlocksPerBoard;
    const effectiveStorageMb = isFree ? 100 : maxStorageMb;
    
    // -1 means unlimited
    const isUnlimited = (val: number) => val === -1;
    
    return {
      // Loading state
      isLoading,
      
      // Plan info
      plan: isFree ? 'free' : planName,
      planName: getPlanDisplayName(planName),
      isFree,
      isActive,
      isLifetime: billing?.is_lifetime ?? false,
      
      // Board limits
      boardsLimit: effectiveMaxBoards,
      boardsUsed: boardCount,
      canCreateBoard: isUnlimited(effectiveMaxBoards) || boardCount < effectiveMaxBoards,
      boardsRemaining: isUnlimited(effectiveMaxBoards) ? Infinity : Math.max(0, effectiveMaxBoards - boardCount),
      boardsUnlimited: isUnlimited(effectiveMaxBoards),
      
      // Block limits (per board) - checked at creation time
      blocksPerBoard: effectiveMaxBlocks,
      blocksUnlimited: isUnlimited(effectiveMaxBlocks),
      
      // Storage limits
      storageLimitMb: effectiveStorageMb,
      storageLimitGb: effectiveStorageMb / 1024,
      
      // Seats
      seatsLimit: maxSeats,
      
      // API key limits (default 2 for free, 10 for paid)
      apiKeysLimit: isFree ? 2 : 10,
      apiKeysUsed: apiKeyCount,
      canAddApiKey: apiKeyCount < (isFree ? 2 : 10),
      apiKeysRemaining: Math.max(0, (isFree ? 2 : 10) - apiKeyCount),
      apiKeysUnlimited: false,
      
      // Message limits - all paid plans have unlimited
      messagesPerDay: isFree ? 50 : -1,
      messagesUsedToday: 0,
      canSendMessage: true,
      messagesRemaining: isFree ? 50 : Infinity,
      messagesUnlimited: !isFree,
    };
  }, [billing, boardCount, apiKeyCount, isLoading]);
}

/**
 * Get human-readable plan name
 */
function getPlanDisplayName(planKey: string): string {
  const names: Record<string, string> = {
    'free': 'Free',
    'starter-individual-annual': 'Starter',
    'pro-individual-annual': 'Pro',
    'starter-team-annual': 'Starter Team',
    'pro-team-annual': 'Pro Team',
    'ltd-starter-individual': 'Starter LTD',
    'ltd-pro-individual': 'Pro LTD',
    'ltd-starter-team': 'Starter Team LTD',
    'ltd-pro-team': 'Pro Team LTD',
  };
  return names[planKey] || planKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Enforcement hook - use this to guard actions with proper user feedback
 */
export function usePlanEnforcement() {
  const limits = usePlanLimits();
  
  const enforceCreateBoard = (): boolean => {
    if (limits.isLoading) {
      // Allow while loading - actual check happens server-side
      return true;
    }
    
    if (!limits.canCreateBoard) {
      toast.error(`Board limit reached`, {
        description: limits.isFree 
          ? `Free plan allows ${limits.boardsLimit} board. Upgrade for more.`
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
    // Block limits are checked server-side via can_create_block RPC
    // This is a client-side hint only
    return true;
  };
  
  const enforceAddApiKey = (): boolean => {
    if (limits.isLoading) return true;
    
    if (!limits.canAddApiKey) {
      toast.error(`API key limit reached`, {
        description: limits.isFree 
          ? `Free plan allows ${limits.apiKeysLimit} API keys. Upgrade for more.`
          : `Your ${limits.planName} plan allows ${limits.apiKeysLimit} API keys.`,
        action: limits.isFree ? {
          label: "Upgrade",
          onClick: () => window.location.href = "/pricing"
        } : undefined
      });
      return false;
    }
    return true;
  };
  
  const enforceSendMessage = (): boolean => {
    if (limits.isLoading) return true;
    
    if (!limits.canSendMessage) {
      toast.error(`Daily message limit reached`, {
        description: limits.isFree 
          ? `Free plan allows ${limits.messagesPerDay} messages per day. Upgrade for more.`
          : `Your ${limits.planName} plan allows ${limits.messagesPerDay} messages per day.`,
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
    enforceAddApiKey,
    enforceSendMessage,
  };
}

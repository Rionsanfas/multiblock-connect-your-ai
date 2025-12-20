import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { subscriptionsDb, boardsDb, apiKeysDb } from '@/lib/database';
import { toast } from 'sonner';

/**
 * Fetch real plan limits from Supabase subscription
 */
export function usePlanLimits() {
  const { user, isAuthenticated } = useAuth();
  
  // Fetch subscription data
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: () => subscriptionsDb.getCurrent(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch board count
  const { data: boardCount = 0, isLoading: boardsLoading } = useQuery({
    queryKey: ['user-board-count', user?.id],
    queryFn: () => boardsDb.getCount(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch API key count
  const { data: apiKeyCount = 0, isLoading: keysLoading } = useQuery({
    queryKey: ['user-apikey-count', user?.id],
    queryFn: () => apiKeysDb.getCount(),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000,
  });

  const isLoading = subLoading || boardsLoading || keysLoading;

  return useMemo(() => {
    // Default limits for free tier if no subscription found
    const maxBoards = subscription?.max_boards ?? 3;
    const maxBlocksPerBoard = subscription?.max_blocks_per_board ?? 10;
    const maxApiKeys = subscription?.max_api_keys ?? 2;
    const maxMessagesPerDay = subscription?.max_messages_per_day ?? 50;
    const messagesUsedToday = subscription?.messages_used_today ?? 0;
    const tier = subscription?.tier ?? 'free';
    const planName = subscription?.plan_name ?? 'Free';

    // -1 means unlimited
    const isUnlimited = (val: number) => val === -1;
    const isFree = tier === 'free';
    
    return {
      // Loading state
      isLoading,
      
      // Plan info
      plan: tier,
      planName,
      isFree,
      
      // Board limits
      boardsLimit: maxBoards,
      boardsUsed: boardCount,
      canCreateBoard: isUnlimited(maxBoards) || boardCount < maxBoards,
      boardsRemaining: isUnlimited(maxBoards) ? Infinity : Math.max(0, maxBoards - boardCount),
      boardsUnlimited: isUnlimited(maxBoards),
      
      // Block limits (per board) - checked at creation time
      blocksPerBoard: maxBlocksPerBoard,
      blocksUnlimited: isUnlimited(maxBlocksPerBoard),
      
      // API key limits
      apiKeysLimit: maxApiKeys,
      apiKeysUsed: apiKeyCount,
      canAddApiKey: isUnlimited(maxApiKeys) || apiKeyCount < maxApiKeys,
      apiKeysRemaining: isUnlimited(maxApiKeys) ? Infinity : Math.max(0, maxApiKeys - apiKeyCount),
      apiKeysUnlimited: isUnlimited(maxApiKeys),
      
      // Message limits
      messagesPerDay: maxMessagesPerDay,
      messagesUsedToday,
      canSendMessage: isUnlimited(maxMessagesPerDay) || messagesUsedToday < maxMessagesPerDay,
      messagesRemaining: isUnlimited(maxMessagesPerDay) ? Infinity : Math.max(0, maxMessagesPerDay - messagesUsedToday),
      messagesUnlimited: isUnlimited(maxMessagesPerDay),
    };
  }, [subscription, boardCount, apiKeyCount, isLoading]);
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
          ? `Free plan allows ${limits.boardsLimit} boards. Upgrade for more.`
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

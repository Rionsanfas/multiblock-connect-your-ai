/**
 * Workspace-aware usage statistics hook
 * 
 * Computes usage stats based on current workspace context:
 * - Personal workspace: personal boards only
 * - Team workspace: team boards only
 * 
 * For team owners, team usage is aggregated into their totals
 * for billing/limit purposes.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { useBilling } from '@/hooks/useBilling';
import { supabase } from '@/integrations/supabase/client';
import { boardsDb } from '@/lib/database';

interface WorkspaceStats {
  // Boards
  boardsUsed: number;
  boardsLimit: number;
  boardsRemaining: number;
  isUnlimitedBoards: boolean;
  
  // Storage
  storageUsedMb: number;
  storageLimitMb: number;
  storageRemaining: number;
  isUnlimitedStorage: boolean;
  
  // Seats (only relevant for team context)
  seatsUsed: number;
  seatsLimit: number;
  
  // Context info
  isPersonal: boolean;
  isTeam: boolean;
  isTeamOwner: boolean;
  workspaceType: 'personal' | 'team';
  workspaceName: string;
}

interface StorageUsage {
  total_bytes: number;
  files_bytes: number;
  images_bytes: number;
  messages_bytes: number;
}

/**
 * Get usage stats for the CURRENT workspace context
 * 
 * Key behavior:
 * - Personal workspace: shows personal boards/storage only
 * - Team workspace: shows team boards/storage only
 * - Team owners: personal limits apply but team usage adds to their totals
 */
export function useWorkspaceStats(): WorkspaceStats & { isLoading: boolean } {
  const { user: authUser, isAuthenticated } = useAuth();
  const { currentWorkspace, isPersonalWorkspace, isTeamWorkspace, isTeamOwner } = useTeamContext();
  const { billing, isLoading: billingLoading } = useBilling();
  
  // Fetch boards for current workspace
  const { data: workspaceBoards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ['workspace-board-count', currentWorkspace.type, currentWorkspace.teamId, authUser?.id],
    queryFn: async () => {
      if (isTeamWorkspace && currentWorkspace.teamId) {
        // Team workspace: count team boards only
        const boards = await boardsDb.getForTeam(currentWorkspace.teamId);
        return boards;
      }
      // Personal workspace: count personal boards only
      const boards = await boardsDb.getAll();
      return boards.filter(b => !b.team_id);
    },
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 1000 * 10, // 10 seconds
    refetchOnMount: 'always',
  });
  
  // Fetch storage usage for current user
  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ['user-storage-usage', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;
      
      const { data, error } = await supabase
        .from('user_storage_usage')
        .select('total_bytes, files_bytes, images_bytes, messages_bytes')
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      if (error) {
        console.error('[useWorkspaceStats] Storage fetch error:', error);
        return null;
      }
      
      return data as StorageUsage | null;
    },
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: 'always',
  });
  
  // For team owners, also fetch their owned teams' board counts
  // This aggregates team usage into owner's totals
  const { data: ownedTeamBoardCount = 0 } = useQuery({
    queryKey: ['owned-team-board-count', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return 0;
      
      // Get all teams where user is owner
      const { data: ownedTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', authUser.id);
      
      if (teamsError || !ownedTeams?.length) return 0;
      
      // Count boards in owned teams
      const teamIds = ownedTeams.map(t => t.id);
      const { count, error: countError } = await supabase
        .from('boards')
        .select('*', { count: 'exact', head: true })
        .in('team_id', teamIds);
      
      if (countError) return 0;
      return count ?? 0;
    },
    enabled: isAuthenticated && !!authUser?.id && isPersonalWorkspace,
    staleTime: 1000 * 30, // 30 seconds
  });
  
  // Compute final stats
  const stats = useMemo((): WorkspaceStats => {
    const isActive = billing?.subscription_status === 'active' || billing?.is_lifetime;
    const isFree = !isActive || billing?.active_plan === 'free';
    
    // Board limits from billing (applies to personal context)
    const baseBoardsLimit = isFree ? 1 : (billing?.total_boards ?? 1);
    const isUnlimitedBoards = baseBoardsLimit === -1;
    
    // Storage limits
    const storageGb = isFree ? 0.1 : (billing?.total_storage_gb ?? 1);
    const storageLimitMb = storageGb === -1 ? -1 : storageGb * 1024;
    const isUnlimitedStorage = storageLimitMb === -1;
    
    // Current workspace boards
    const workspaceBoardsUsed = workspaceBoards.length;
    
    // For personal workspace + team owner, add team boards to their usage
    // This ensures team usage counts toward owner's limits
    const effectiveBoardsUsed = isPersonalWorkspace && isTeamOwner
      ? workspaceBoardsUsed + ownedTeamBoardCount
      : workspaceBoardsUsed;
    
    // Storage (always user-level for now)
    const storageUsedBytes = storageData?.total_bytes ?? 0;
    const storageUsedMb = storageUsedBytes / (1024 * 1024);
    
    return {
      boardsUsed: isPersonalWorkspace ? effectiveBoardsUsed : workspaceBoardsUsed,
      boardsLimit: isUnlimitedBoards ? -1 : baseBoardsLimit,
      boardsRemaining: isUnlimitedBoards ? 999 : Math.max(0, baseBoardsLimit - effectiveBoardsUsed),
      isUnlimitedBoards,
      
      storageUsedMb,
      storageLimitMb: isUnlimitedStorage ? -1 : storageLimitMb,
      storageRemaining: isUnlimitedStorage ? 999 : Math.max(0, storageLimitMb - storageUsedMb),
      isUnlimitedStorage,
      
      seatsUsed: billing?.seats ?? 1,
      seatsLimit: billing?.seats ?? 1,
      
      isPersonal: isPersonalWorkspace,
      isTeam: isTeamWorkspace,
      isTeamOwner,
      workspaceType: currentWorkspace.type,
      workspaceName: isPersonalWorkspace ? 'Personal' : (currentWorkspace.teamName ?? 'Team'),
    };
  }, [
    billing,
    workspaceBoards,
    storageData,
    isPersonalWorkspace,
    isTeamWorkspace,
    isTeamOwner,
    ownedTeamBoardCount,
    currentWorkspace,
  ]);
  
  return {
    ...stats,
    isLoading: billingLoading || boardsLoading || storageLoading,
  };
}

/**
 * Get just the board count for the current workspace
 * Lighter-weight than full stats
 */
export function useWorkspaceBoardCount(): { count: number; isLoading: boolean } {
  const { user: authUser, isAuthenticated } = useAuth();
  const { currentWorkspace, isTeamWorkspace } = useTeamContext();
  
  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['workspace-board-count-simple', currentWorkspace.type, currentWorkspace.teamId, authUser?.id],
    queryFn: async () => {
      if (isTeamWorkspace && currentWorkspace.teamId) {
        const { count, error } = await supabase
          .from('boards')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', currentWorkspace.teamId);
        
        if (error) return 0;
        return count ?? 0;
      }
      
      // Personal boards
      const { count, error } = await supabase
        .from('boards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser!.id)
        .is('team_id', null);
      
      if (error) return 0;
      return count ?? 0;
    },
    enabled: isAuthenticated && !!authUser?.id,
    staleTime: 1000 * 10,
    refetchOnMount: 'always',
  });
  
  return { count, isLoading };
}

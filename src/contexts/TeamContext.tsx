import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserTeams, TeamWithStats } from '@/hooks/useTeamsData';
import { useQueryClient } from '@tanstack/react-query';

// ============================================
// WORKSPACE CONTEXT
// Tracks which workspace (personal or team) is active
// Forces data refresh on workspace switch
// ============================================

export type WorkspaceType = 'personal' | 'team';

export interface WorkspaceContext {
  type: WorkspaceType;
  teamId: string | null;
  teamName: string | null;
  teamRole: 'owner' | 'admin' | 'member' | null;
}

interface TeamContextValue {
  // Current workspace
  currentWorkspace: WorkspaceContext;
  
  // Available teams
  teams: TeamWithStats[];
  teamsLoading: boolean;
  
  // Actions
  switchToPersonal: () => void;
  switchToTeam: (teamId: string) => void;
  
  // Force refresh all workspace data
  refreshWorkspaceData: () => void;
  
  // Convenience getters
  isPersonalWorkspace: boolean;
  isTeamWorkspace: boolean;
  currentTeam: TeamWithStats | null;
  currentTeamId: string | null;
  canManageTeam: boolean;
  isTeamOwner: boolean;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

const WORKSPACE_STORAGE_KEY = 'app-current-workspace';

export function TeamProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams();
  
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceContext>(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    return { type: 'personal', teamId: null, teamName: null, teamRole: null };
  });

  // Invalidate workspace queries with optimistic approach
  const invalidateWorkspaceQueries = useCallback(() => {
    // Mark queries as stale but don't force immediate refetch
    // This allows the new workspace data to load in background
    queryClient.invalidateQueries({ 
      queryKey: ['workspace-boards'],
      refetchType: 'active', // Only refetch if currently being observed
    });
    queryClient.invalidateQueries({ 
      queryKey: ['personal-boards'],
      refetchType: 'none', // Don't refetch - will be fresh on next access
    });
    queryClient.invalidateQueries({ 
      queryKey: ['api-keys'],
      refetchType: 'none',
    });
    queryClient.invalidateQueries({ 
      queryKey: ['team-api-keys'],
      refetchType: 'none',
    });
    // Don't remove queries - keep cache for instant back-navigation
  }, [queryClient]);

  // Persist workspace selection
  useEffect(() => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(currentWorkspace));
  }, [currentWorkspace]);

  // Validate that selected team still exists
  useEffect(() => {
    if (currentWorkspace.type === 'team' && currentWorkspace.teamId && teams.length > 0) {
      const teamExists = teams.some(t => t.team_id === currentWorkspace.teamId);
      if (!teamExists) {
        // Team no longer exists, switch to personal
        setCurrentWorkspace({ 
          type: 'personal', 
          teamId: null, 
          teamName: null, 
          teamRole: null 
        });
        invalidateWorkspaceQueries();
      }
    }
  }, [teams, currentWorkspace, invalidateWorkspaceQueries]);

  const switchToPersonal = useCallback(() => {
    // Clear queries BEFORE switching to ensure fresh data
    invalidateWorkspaceQueries();
    
    setCurrentWorkspace({ 
      type: 'personal', 
      teamId: null, 
      teamName: null, 
      teamRole: null 
    });
  }, [invalidateWorkspaceQueries]);

  const switchToTeam = useCallback((teamId: string) => {
    const team = teams.find(t => t.team_id === teamId);
    if (team) {
      // Clear queries BEFORE switching to ensure fresh data
      invalidateWorkspaceQueries();
      
      setCurrentWorkspace({
        type: 'team',
        teamId: team.team_id,
        teamName: team.team_name,
        teamRole: team.user_role,
      });
    }
  }, [teams, invalidateWorkspaceQueries]);

  const refreshWorkspaceData = useCallback(() => {
    invalidateWorkspaceQueries();
  }, [invalidateWorkspaceQueries]);

  const currentTeam = currentWorkspace.teamId 
    ? teams.find(t => t.team_id === currentWorkspace.teamId) || null
    : null;

  const value: TeamContextValue = {
    currentWorkspace,
    teams,
    teamsLoading,
    switchToPersonal,
    switchToTeam,
    refreshWorkspaceData,
    isPersonalWorkspace: currentWorkspace.type === 'personal',
    isTeamWorkspace: currentWorkspace.type === 'team',
    currentTeam,
    currentTeamId: currentWorkspace.teamId,
    canManageTeam: currentWorkspace.teamRole === 'owner' || currentWorkspace.teamRole === 'admin',
    isTeamOwner: currentWorkspace.teamRole === 'owner',
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext must be used within TeamProvider');
  }
  return context;
}

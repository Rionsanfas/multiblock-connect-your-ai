import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserTeams, TeamWithStats } from '@/hooks/useTeamsData';

// ============================================
// WORKSPACE CONTEXT
// Tracks which workspace (personal or team) is active
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
      }
    }
  }, [teams, currentWorkspace]);

  const switchToPersonal = () => {
    setCurrentWorkspace({ 
      type: 'personal', 
      teamId: null, 
      teamName: null, 
      teamRole: null 
    });
  };

  const switchToTeam = (teamId: string) => {
    const team = teams.find(t => t.team_id === teamId);
    if (team) {
      setCurrentWorkspace({
        type: 'team',
        teamId: team.team_id,
        teamName: team.team_name,
        teamRole: team.user_role,
      });
    }
  };

  const currentTeam = currentWorkspace.teamId 
    ? teams.find(t => t.team_id === currentWorkspace.teamId) || null
    : null;

  const value: TeamContextValue = {
    currentWorkspace,
    teams,
    teamsLoading,
    switchToPersonal,
    switchToTeam,
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

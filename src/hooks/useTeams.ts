import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Team, TeamMember, Seat, TeamRole } from '@/types';

// ============================================
// TEAM DATA HOOKS
// ============================================

/**
 * Get all teams the current user belongs to
 */
export function useUserTeams(): Team[] {
  const getUserTeams = useAppStore((s) => s.getUserTeams);
  return getUserTeams();
}

/**
 * Get a specific team by ID
 */
export function useTeam(teamId: string): Team | undefined {
  const teams = useAppStore((s) => s.teams);
  return useMemo(() => teams.find((t) => t.id === teamId), [teams, teamId]);
}

/**
 * Get the user's role in a specific team
 */
export function useUserTeamRole(teamId: string): TeamRole | undefined {
  const user = useAppStore((s) => s.user);
  const getTeamMembers = useAppStore((s) => s.getTeamMembers);
  
  return useMemo(() => {
    if (!user) return undefined;
    const members = getTeamMembers(teamId);
    const membership = members.find((m) => m.user_id === user.id && m.status === 'active');
    return membership?.role;
  }, [user, teamId, getTeamMembers]);
}

/**
 * Check if user is a team owner or admin
 */
export function useIsTeamAdmin(teamId: string): boolean {
  const role = useUserTeamRole(teamId);
  return role === 'owner' || role === 'admin';
}

/**
 * Check if user is the team owner
 */
export function useIsTeamOwner(teamId: string): boolean {
  const role = useUserTeamRole(teamId);
  return role === 'owner';
}

// ============================================
// TEAM MEMBERS HOOKS
// ============================================

/**
 * Get all members of a team
 */
export function useTeamMembers(teamId: string): TeamMember[] {
  const getTeamMembers = useAppStore((s) => s.getTeamMembers);
  return useMemo(() => getTeamMembers(teamId), [getTeamMembers, teamId]);
}

/**
 * Get active members of a team
 */
export function useActiveTeamMembers(teamId: string): TeamMember[] {
  const members = useTeamMembers(teamId);
  return useMemo(() => members.filter((m) => m.status === 'active'), [members]);
}

/**
 * Get pending invitations for a team
 */
export function usePendingInvitations(teamId: string): TeamMember[] {
  const members = useTeamMembers(teamId);
  return useMemo(() => members.filter((m) => m.status === 'pending'), [members]);
}

// ============================================
// SEATS HOOKS
// ============================================

/**
 * Get all seats for a team
 */
export function useTeamSeats(teamId: string): Seat[] {
  const getTeamSeats = useAppStore((s) => s.getTeamSeats);
  return useMemo(() => getTeamSeats(teamId), [getTeamSeats, teamId]);
}

/**
 * Get seat usage stats for a team
 */
export function useTeamSeatStats(teamId: string) {
  const seats = useTeamSeats(teamId);
  
  return useMemo(() => {
    const totalSeats = seats.filter((s) => s.is_active).length;
    const assignedSeats = seats.filter((s) => s.is_active && s.user_id).length;
    const availableSeats = totalSeats - assignedSeats;
    const includedSeats = seats.filter((s) => s.seat_type === 'included').length;
    const addonSeats = seats.filter((s) => s.seat_type === 'addon').length;
    
    return {
      totalSeats,
      assignedSeats,
      availableSeats,
      includedSeats,
      addonSeats,
      usagePercent: totalSeats > 0 ? (assignedSeats / totalSeats) * 100 : 0,
    };
  }, [seats]);
}

/**
 * Check if team has available seats
 */
export function useHasAvailableSeats(teamId: string): boolean {
  const { availableSeats } = useTeamSeatStats(teamId);
  return availableSeats > 0;
}

// ============================================
// TEAM UTILITIES
// ============================================

/**
 * Get the primary team for the current user (first owned or first joined)
 */
export function usePrimaryTeam(): Team | undefined {
  const user = useAppStore((s) => s.user);
  const teams = useUserTeams();
  
  return useMemo(() => {
    if (!user || teams.length === 0) return undefined;
    // Prefer owned team
    const ownedTeam = teams.find((t) => t.owner_id === user.id);
    return ownedTeam ?? teams[0];
  }, [user, teams]);
}

/**
 * Check if user is part of any team
 */
export function useIsInTeam(): boolean {
  const teams = useUserTeams();
  return teams.length > 0;
}

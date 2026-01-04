/**
 * Hook to determine if the current user has access to team features
 * Based on their plan (team plans only)
 */

import { useBilling } from './useBilling';
import { useUserTeams } from './useTeamsData';

export function useTeamAccess() {
  const { data: billing, isLoading: billingLoading } = useBilling();
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams();

  const isLoading = billingLoading || teamsLoading;

  // User has team access if:
  // 1. They have a team plan (plan_category === 'team'), OR
  // 2. They are already a member of at least one team (invited by someone else)
  const hasTeamPlan = billing?.plan_category === 'team';
  const isMemberOfTeam = teams.length > 0;
  
  const hasTeamAccess = hasTeamPlan || isMemberOfTeam;

  // Can create teams only if they have a team plan
  const canCreateTeam = hasTeamPlan;

  return {
    isLoading,
    hasTeamAccess,
    hasTeamPlan,
    isMemberOfTeam,
    canCreateTeam,
    teamCount: teams.length,
  };
}

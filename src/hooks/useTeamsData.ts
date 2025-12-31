import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamWithStats {
  team_id: string;
  team_name: string;
  team_slug: string;
  user_role: TeamRole;
  member_count: number;
  board_count: number;
  is_owner: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface TeamLimits {
  max_boards: number;
  max_blocks_per_board: number;
  max_seats: number;
  storage_gb: number;
  current_seats: number;
  current_boards: number;
}

// ============================================
// GET USER'S TEAMS
// ============================================

export function useUserTeams() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['teams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_teams', { p_user_id: user.id });
      
      if (error) throw error;
      return (data as TeamWithStats[]) || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - teams rarely change
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnWindowFocus: false,
  });
}

// Alias for convenience
export function useTeams() {
  const { data, isLoading, error } = useUserTeams();
  return { teams: data || [], isLoading, error };
}

// ============================================
// GET SINGLE TEAM
// ============================================

export function useTeam(teamId: string | null) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (error) throw error;
      return data as Team;
    },
    enabled: !!teamId,
  });
}

// ============================================
// GET TEAM MEMBERS
// ============================================

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profile:profiles!team_members_user_id_fkey(
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .order('role', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(member => ({
        ...member,
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
      })) as TeamMember[];
    },
    enabled: !!teamId,
  });
}

// ============================================
// GET TEAM INVITATIONS
// ============================================

export function useTeamInvitations(teamId: string | null) {
  return useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as TeamInvitation[];
    },
    enabled: !!teamId,
  });
}

// ============================================
// GET TEAM LIMITS
// ============================================

export function useTeamLimits(teamId: string | null) {
  return useQuery({
    queryKey: ['team-limits', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      
      const { data, error } = await supabase
        .rpc('get_team_limits', { p_team_id: teamId });
      
      if (error) throw error;
      return (data?.[0] || null) as TeamLimits | null;
    },
    enabled: !!teamId,
  });
}

// ============================================
// CREATE TEAM
// ============================================

export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const { data, error } = await supabase
        .rpc('create_team', { p_name: name, p_slug: slug });
      
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create team');
    },
  });
}

// ============================================
// UPDATE TEAM
// ============================================

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
      const { error } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', teamId);
      
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Team updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update team');
    },
  });
}

// ============================================
// DELETE TEAM
// ============================================

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete team');
    },
  });
}

// ============================================
// CREATE INVITATION
// ============================================

export function useCreateInvitation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      email, 
      role 
    }: { 
      teamId: string; 
      email: string; 
      role: TeamRole;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as TeamInvitation;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      toast.success('Invitation created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invitation');
    },
  });
}

// ============================================
// DELETE INVITATION
// ============================================

export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invitationId, teamId }: { invitationId: string; teamId: string }) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      toast.success('Invitation cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });
}

// ============================================
// ACCEPT INVITATION
// ============================================

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase
        .rpc('accept_team_invitation', { p_token: token });
      
      if (error) throw error;
      
      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.error_message || 'Failed to accept invitation');
      }
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(`Joined ${result.team_name}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to accept invitation');
    },
  });
}

// ============================================
// UPDATE MEMBER ROLE
// ============================================

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      teamId, 
      role 
    }: { 
      memberId: string; 
      teamId: string; 
      role: TeamRole;
    }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Member role updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

// ============================================
// REMOVE MEMBER
// ============================================

export function useRemoveMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, teamId }: { memberId: string; teamId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-limits', teamId] });
      toast.success('Member removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });
}

// ============================================
// LEAVE TEAM
// ============================================

export function useLeaveTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Left team');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to leave team');
    },
  });
}

// ============================================
// TRANSFER BOARD TO TEAM
// ============================================

export function useTransferBoardToTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ boardId, teamId }: { boardId: string; teamId: string }) => {
      const { data, error } = await supabase
        .rpc('transfer_board_to_team', { p_board_id: boardId, p_team_id: teamId });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-limits', teamId] });
      toast.success('Board transferred to team');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to transfer board');
    },
  });
}

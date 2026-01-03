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
      // Use RPC function for proper permission checks (RLS blocks direct updates)
      const { data, error } = await supabase
        .rpc('update_team_name', { p_team_id: teamId, p_name: name });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Team name updated');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to update team';
      if (message.includes('NOT_AUTHORIZED')) {
        toast.error('Only the team owner can rename the team');
      } else if (message.includes('INVALID_TEAM_NAME')) {
        toast.error('Team name must be at least 2 characters');
      } else {
        toast.error(message);
      }
    },
  });
}

// ============================================
// DELETE TEAM WITH OPTIONS
// ============================================

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, transferBoards = false }: { teamId: string; transferBoards?: boolean }) => {
      const { data, error } = await supabase
        .rpc('delete_team_with_options', { 
          p_team_id: teamId,
          p_transfer_boards: transferBoards 
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { transferBoards }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success(transferBoards 
        ? 'Team deleted, boards transferred to personal' 
        : 'Team and all boards deleted'
      );
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to delete team';
      if (message.includes('NOT_AUTHORIZED')) {
        toast.error('Only team owner or admin can delete the team');
      } else {
        toast.error(message);
      }
    },
  });
}

// ============================================
// CREATE INVITATION (via RPC for proper permissions)
// ============================================

export function useCreateInvitation() {
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
      const { data, error } = await supabase
        .rpc('create_team_invitation', {
          p_team_id: teamId,
          p_email: email,
          p_role: role,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
      toast.success('Invitation sent');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to create invitation';
      if (message.includes('SEAT_LIMIT_REACHED')) {
        toast.error('Team seat limit reached');
      } else if (message.includes('INVITATION_ALREADY_PENDING')) {
        toast.error('Invitation already pending for this email');
      } else if (message.includes('NOT_AUTHORIZED')) {
        toast.error('Only owner or admin can invite');
      } else {
        toast.error(message);
      }
    },
  });
}

// ============================================
// DELETE INVITATION (via RPC for proper permissions)
// ============================================

export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invitationId, teamId }: { invitationId: string; teamId: string }) => {
      const { data, error } = await supabase
        .rpc('delete_team_invitation', { p_invitation_id: invitationId });
      
      if (error) throw error;
      return data;
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
// UPDATE MEMBER ROLE (via RPC for proper permissions)
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
      // First get the user_id from the member record
      const { data: member, error: fetchError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', memberId)
        .single();
      
      if (fetchError || !member) throw new Error('Member not found');
      
      // Use the RPC for proper permission checks
      const { data, error } = await supabase
        .rpc('update_team_member_role', { 
          p_team_id: teamId, 
          p_member_user_id: member.user_id, 
          p_new_role: role 
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Member role updated');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to update role';
      if (message.includes('NOT_AUTHORIZED')) {
        toast.error('Only owner can modify admin roles');
      } else if (message.includes('CANNOT_MODIFY_OWNER')) {
        toast.error('Cannot modify owner role');
      } else {
        toast.error(message);
      }
    },
  });
}

// ============================================
// REMOVE MEMBER (via RPC for proper permissions)
// ============================================

export function useRemoveMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, teamId }: { memberId: string; teamId: string }) => {
      // First get the user_id from the member record
      const { data: member, error: fetchError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', memberId)
        .single();
      
      if (fetchError || !member) throw new Error('Member not found');
      
      // Use the RPC for proper permission checks
      const { data, error } = await supabase
        .rpc('remove_team_member', { 
          p_team_id: teamId, 
          p_member_user_id: member.user_id 
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-limits', teamId] });
      toast.success('Member removed');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to remove member';
      if (message.includes('NOT_AUTHORIZED')) {
        toast.error('Only owner can remove admins');
      } else if (message.includes('CANNOT_REMOVE_OWNER')) {
        toast.error('Cannot remove team owner');
      } else {
        toast.error(message);
      }
    },
  });
}

// ============================================
// LEAVE TEAM (with proper admin checks)
// ============================================

export function useLeaveTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { data, error } = await supabase
        .rpc('admin_leave_team', { p_team_id: teamId });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Left team');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to leave team';
      if (message.includes('OWNER_CANNOT_LEAVE')) {
        toast.error('Owner cannot leave. Transfer ownership first.');
      } else if (message.includes('ADMIN_REQUIRED')) {
        toast.error('Assign another admin before leaving');
      } else {
        toast.error(message);
      }
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

// ============================================
// PENDING INVITATIONS FOR CURRENT USER (Inbox)
// ============================================

export interface PendingInvitation {
  invitation_id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  role: TeamRole;
  invited_by_email: string;
  invited_by_name: string | null;
  token: string;
  expires_at: string;
  created_at: string;
}

export function useUserPendingInvitations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-pending-invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_pending_invitations');
      
      if (error) throw error;
      return (data || []) as PendingInvitation[];
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds - check for new invitations frequently
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

// ============================================
// DECLINE INVITATION
// ============================================

export function useDeclineInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .rpc('decline_team_invitation', { p_invitation_id: invitationId });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pending-invitations'] });
      toast.success('Invitation declined');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to decline invitation');
    },
  });
}

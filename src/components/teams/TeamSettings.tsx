import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  Crown, 
  Shield, 
  User,
  Copy,
  Trash2,
  LogOut,
  Loader2,
  Mail,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useTeamContext } from '@/contexts/TeamContext';
import {
  useTeam,
  useTeamMembers,
  useTeamInvitations,
  useTeamLimits,
  useUpdateTeam,
  useDeleteTeam,
  useCreateInvitation,
  useDeleteInvitation,
  useUpdateMemberRole,
  useRemoveMember,
  useLeaveTeam,
  TeamRole,
} from '@/hooks/useTeamsData';

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export function TeamSettings() {
  const navigate = useNavigate();
  const { currentWorkspace, isTeamOwner, canManageTeam, switchToPersonal } = useTeamContext();
  
  const teamId = currentWorkspace.teamId;
  
  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(teamId);
  const { data: invitations = [] } = useTeamInvitations(teamId);
  const { data: limits } = useTeamLimits(teamId);
  
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const leaveTeam = useLeaveTeam();

  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('member');

  // Initialize team name when loaded
  if (team && !teamName && teamName !== team.name) {
    setTeamName(team.name);
  }

  if (!teamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a team to view settings</p>
      </div>
    );
  }

  if (teamLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleUpdateName = () => {
    if (team && teamName !== team.name && teamName.trim()) {
      updateTeam.mutate({ teamId, name: teamName.trim() });
    }
  };

  const handleCreateInvitation = () => {
    if (!inviteEmail.trim()) return;
    
    createInvitation.mutate(
      { teamId, email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteEmail('');
          setInviteRole('member');
        },
      }
    );
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard');
  };

  const handleDeleteTeam = () => {
    deleteTeam.mutate(teamId, {
      onSuccess: () => {
        switchToPersonal();
        navigate('/dashboard');
      },
    });
  };

  const handleLeaveTeam = () => {
    leaveTeam.mutate(teamId, {
      onSuccess: () => {
        switchToPersonal();
        navigate('/dashboard');
      },
    });
  };

  const seatUsagePercent = limits 
    ? (limits.current_seats / limits.max_seats) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Team Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your team's settings and members</p>
      </div>

      {/* Team Info */}
      <Card className="settings-card-3d">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="key-icon-3d p-2 rounded-lg">
              <Settings className="h-4 w-4" />
            </div>
            General Settings
          </CardTitle>
          <CardDescription>
            Manage your team's settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">Team Name</Label>
            <div className="flex gap-2">
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={!isTeamOwner}
                className="bg-secondary/40 border-border/40 focus:border-primary/50"
              />
              {isTeamOwner && teamName !== team?.name && (
                <Button onClick={handleUpdateName} disabled={updateTeam.isPending} className="btn-3d-primary">
                  Save
                </Button>
              )}
            </div>
          </div>

          {limits && (
            <div className="space-y-4 pt-4">
              <Separator className="bg-border/30" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Seats
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {limits.current_seats} / {limits.max_seats}
                    </span>
                  </div>
                  <Progress value={seatUsagePercent} className="h-2" />
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                      Boards
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {limits.current_boards} / {limits.max_boards}
                    </span>
                  </div>
                  <Progress 
                    value={(limits.current_boards / limits.max_boards) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card className="settings-card-3d">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="key-icon-3d p-2 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
            Members
            <Badge variant="secondary" className="ml-2">
              {members.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Form */}
          {canManageTeam && (
            <div className="flex gap-2 pb-4 border-b border-border/30">
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-secondary/40 border-border/40 focus:border-primary/50"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                <SelectTrigger className="w-32 bg-secondary/40 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30">
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleCreateInvitation}
                disabled={!inviteEmail.trim() || createInvitation.isPending}
                className="btn-3d-primary"
              >
                {createInvitation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && canManageTeam && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Pending Invitations
              </h4>
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-xl glass-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-background">
                      <AvatarFallback className="text-xs bg-secondary/50">
                        {invite.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {invite.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="key-icon-3d h-8 w-8"
                      onClick={() => handleCopyInviteLink(invite.token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="key-icon-3d h-8 w-8 hover:text-destructive"
                      onClick={() => deleteInvitation.mutate({ 
                        invitationId: invite.id, 
                        teamId 
                      })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role];
              const isOwner = member.role === 'owner';
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl glass-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-background">
                      <AvatarFallback className="text-xs bg-secondary/50">
                        {(member.profile?.full_name || member.profile?.email || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.profile?.full_name || member.profile?.email || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {ROLE_LABELS[member.role]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManageTeam && !isOwner && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(role) => 
                          updateMemberRole.mutate({ 
                            memberId: member.id, 
                            teamId, 
                            role: role as TeamRole 
                          })
                        }
                      >
                        <SelectTrigger className="w-28 h-8 bg-secondary/30 border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30">
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="key-icon-3d h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeMember.mutate({ 
                          memberId: member.id, 
                          teamId 
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="settings-card-3d border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Trash2 className="h-4 w-4" />
            </div>
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isTeamOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/30">
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose access to all team boards and resources. 
                    You'll need a new invitation to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveTeam}>
                    Leave Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isTeamOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/30">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All team boards, blocks, and data 
                    will be permanently deleted. All members will lose access.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteTeam}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

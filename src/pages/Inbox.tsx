import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserPendingInvitations, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useTeamsData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox as InboxIcon, Check, X, Users, Loader2, Crown, Shield, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTeamContext } from '@/contexts/TeamContext';

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User,
};

export default function InboxPage() {
  const navigate = useNavigate();
  const { switchToTeam } = useTeamContext();
  const { data: invitations = [], isLoading } = useUserPendingInvitations();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  const handleAccept = async (token: string, teamId: string) => {
    acceptInvitation.mutate(token, {
      onSuccess: () => {
        switchToTeam(teamId);
        navigate('/dashboard');
      },
    });
  };

  const handleDecline = (invitationId: string) => {
    declineInvitation.mutate(invitationId);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inbox</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Your pending team invitations
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <Card className="settings-card-3d">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="key-icon-3d p-4 rounded-2xl mb-4">
                <InboxIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No pending invitations</h3>
              <p className="text-sm text-muted-foreground text-center">
                When you receive team invitations, they'll appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const RoleIcon = ROLE_ICONS[invitation.role];
              
              return (
                <Card key={invitation.invitation_id} className="settings-card-3d">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="key-icon-3d p-2 rounded-lg">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{invitation.team_name}</CardTitle>
                          <CardDescription className="text-sm">
                            Invited by {invitation.invited_by_name || invitation.invited_by_email}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                        <RoleIcon className="h-3 w-3" />
                        {invitation.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecline(invitation.invitation_id)}
                          disabled={declineInvitation.isPending}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          {declineInvitation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invitation.token, invitation.team_id)}
                          disabled={acceptInvitation.isPending}
                          className="btn-3d-primary"
                        >
                          {acceptInvitation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

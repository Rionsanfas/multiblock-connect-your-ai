import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAcceptInvitation } from '@/hooks/useTeamsData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface InvitationInfo {
  team_name: string;
  role: string;
  email: string;
  expires_at: string;
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const acceptInvitation = useAcceptInvitation();
  
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invitation info
  useEffect(() => {
    async function fetchInvitation() {
      if (!token) {
        setError('Invalid invitation link');
        setLoadingInfo(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('team_invitations')
          .select(`
            email,
            role,
            expires_at,
            accepted_at,
            team:teams(name)
          `)
          .eq('token', token)
          .single();

        if (error || !data) {
          setError('Invitation not found');
          return;
        }

        if (data.accepted_at) {
          setError('This invitation has already been used');
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired');
          return;
        }

        const teamData = Array.isArray(data.team) ? data.team[0] : data.team;

        setInvitationInfo({
          team_name: teamData?.name || 'Unknown Team',
          role: data.role,
          email: data.email,
          expires_at: data.expires_at,
        });
      } catch {
        setError('Failed to load invitation');
      } finally {
        setLoadingInfo(false);
      }
    }

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    
    try {
      await acceptInvitation.mutateAsync(token);
      navigate('/dashboard');
    } catch {
      // Error handled in mutation
    }
  };

  // Redirect to auth if not logged in
  if (!authLoading && !user && invitationInfo) {
    // Store token to use after auth
    sessionStorage.setItem('pending_invite_token', token || '');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              You've been invited to join <strong>{invitationInfo.team_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please sign in or create an account to accept this invitation.
            </p>
            <Button 
              className="w-full" 
              onClick={() => navigate('/auth', { state: { from: `/invite/${token}` } })}
            >
              Sign in to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingInfo || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (acceptInvitation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined {invitationInfo?.team_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitationInfo?.team_name}</strong> as a{' '}
            <span className="capitalize">{invitationInfo?.role}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-secondary/30 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Invited email</p>
            <p className="font-medium">{invitationInfo?.email}</p>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleAccept}
            disabled={acceptInvitation.isPending}
          >
            {acceptInvitation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Accept Invitation
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            Decline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

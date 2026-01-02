import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TeamSettings } from '@/components/teams/TeamSettings';
import { useParams, Navigate } from 'react-router-dom';
import { useTeamContext } from '@/contexts/TeamContext';
import { useUserTeams } from '@/hooks/useTeamsData';
import { Loader2 } from 'lucide-react';

export default function TeamSettingsPage() {
  const { teamId: paramTeamId } = useParams();
  const { currentWorkspace, isTeamWorkspace } = useTeamContext();
  const { data: teams = [], isLoading } = useUserTeams();
  
  // Priority: URL param > current workspace context
  const effectiveTeamId = paramTeamId || (isTeamWorkspace ? currentWorkspace.teamId : null);
  
  // If no team in URL and not in team workspace, show team selector
  if (!effectiveTeamId) {
    if (isLoading) {
      return (
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DashboardLayout>
      );
    }
    
    if (teams.length === 0) {
      return (
        <DashboardLayout>
          <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-foreground mb-2">No Teams Yet</h2>
              <p className="text-muted-foreground">
                Create or join a team to access team settings
              </p>
            </div>
          </div>
        </DashboardLayout>
      );
    }
    
    // Redirect to first team's settings
    return <Navigate to={`/team/settings/${teams[0].team_id}`} replace />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <TeamSettings teamIdOverride={effectiveTeamId} />
      </div>
    </DashboardLayout>
  );
}

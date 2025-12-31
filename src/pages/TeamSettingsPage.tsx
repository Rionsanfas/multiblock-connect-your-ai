import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TeamSettings } from '@/components/teams/TeamSettings';
import { useTeamContext } from '@/contexts/TeamContext';
import { Navigate } from 'react-router-dom';

export default function TeamSettingsPage() {
  const { isTeamWorkspace } = useTeamContext();

  if (!isTeamWorkspace) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        <TeamSettings />
      </div>
    </DashboardLayout>
  );
}

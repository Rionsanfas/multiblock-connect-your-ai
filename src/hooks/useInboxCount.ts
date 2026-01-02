import { useUserPendingInvitations } from './useTeamsData';

export function useInboxCount() {
  const { data: invitations = [], isLoading } = useUserPendingInvitations();
  
  return {
    count: invitations.length,
    isLoading,
  };
}

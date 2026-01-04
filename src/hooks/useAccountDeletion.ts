import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      // First, delete all user data via the database function
      const { data, error } = await supabase.rpc('delete_user_account');

      if (error) throw error;

      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.error_message || 'Failed to delete account');
      }

      return result;
    },
    onSuccess: async () => {
      // Clear all cached data
      queryClient.clear();
      
      // Sign out the user
      await signOut();
      
      toast.success('Account deleted successfully');
      navigate('/');
    },
    onError: (error: Error) => {
      const message = error.message;
      
      if (message.includes('MUST_TRANSFER_OR_DELETE_TEAMS')) {
        toast.error('Please transfer ownership or delete your teams first');
      } else {
        toast.error(message || 'Failed to delete account');
      }
    },
  });
}

export function useOwnedTeams() {
  const { user } = useAuth();
  
  return {
    // This is checked in the delete_user_account function,
    // but we can also check client-side for better UX
  };
}

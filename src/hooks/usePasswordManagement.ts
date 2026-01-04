import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePasswordManagement() {
  const [isLoading, setIsLoading] = useState(false);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Password reset email sent! Check your inbox.');
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send reset email');
      toast.error(error.message);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Password updated successfully');
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update password');
      toast.error(error.message);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    sendPasswordResetEmail,
    updatePassword,
  };
}

/**
 * Email Verification Page
 * 
 * Handles Supabase email verification flow:
 * 1. Reads access_token/refresh_token from URL hash
 * 2. Sets the session using Supabase
 * 3. Redirects to dashboard on success
 * 4. Shows error with resend option on failure
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type VerificationState = 'loading' | 'success' | 'error';

export default function AuthVerify() {
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Parse tokens from URL hash (Supabase sends them in hash fragment)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Try hash first, then query params
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');
        const errorCode = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        // Handle error from Supabase
        if (errorCode) {
          console.error('[AuthVerify] Error from Supabase:', errorCode, errorDescription);
          setErrorMessage(errorDescription || 'Verification link is invalid or expired.');
          setState('error');
          return;
        }

        // Check if we have tokens
        if (!accessToken || !refreshToken) {
          // Maybe the auth state listener already handled it - check session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Already authenticated, redirect to dashboard
            setState('success');
            setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
            return;
          }

          console.error('[AuthVerify] No tokens found in URL');
          setErrorMessage('Invalid verification link. Please request a new one.');
          setState('error');
          return;
        }

        console.log('[AuthVerify] Setting session with tokens, type:', type);

        // Set the session using the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[AuthVerify] Session error:', error);
          
          if (error.message.includes('expired')) {
            setErrorMessage('This verification link has expired. Please request a new one.');
          } else if (error.message.includes('invalid')) {
            setErrorMessage('This verification link is invalid. Please request a new one.');
          } else {
            setErrorMessage(error.message);
          }
          setState('error');
          return;
        }

        if (!data.session) {
          console.error('[AuthVerify] No session returned');
          setErrorMessage('Failed to verify email. Please try again.');
          setState('error');
          return;
        }

        // Store email for potential resend
        if (data.session.user?.email) {
          setEmail(data.session.user.email);
        }

        console.log('[AuthVerify] Email verified successfully, user:', data.session.user?.id);
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/auth/verify');
        
        // Show success and redirect
        setState('success');
        toast.success('Email verified successfully!');
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);

      } catch (err) {
        console.error('[AuthVerify] Unexpected error:', err);
        setErrorMessage('An unexpected error occurred. Please try again.');
        setState('error');
      }
    };

    verifyEmail();
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Please go back to signup and try again.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (err) {
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {state === 'loading' && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Verifying your email...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Email verified!
            </h1>
            <p className="text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="flex justify-center">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Verification failed
            </h1>
            <p className="text-muted-foreground">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3 pt-4">
              {email && (
                <Button 
                  onClick={handleResendEmail} 
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Resend verification email
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleBackToSignup}
                className="w-full"
              >
                Back to sign up
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

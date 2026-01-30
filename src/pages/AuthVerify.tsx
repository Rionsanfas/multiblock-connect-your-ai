/**
 * Email Verification Page (Signup Only)
 * 
 * SINGLE SOURCE OF TRUTH for email verification + auto login.
 * 
 * Flow:
 * 1. User signs up → receives verification email
 * 2. User clicks link → lands on /auth/verify with tokens
 * 3. This page validates tokens and type === 'signup'
 * 4. Sets session → redirects to /dashboard
 * 
 * NO fallbacks, NO guessing, NO ambiguity.
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type VerificationState = 'loading' | 'success' | 'error';

export default function AuthVerify() {
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyEmail = async () => {
      try {
        // Parse tokens from URL - Supabase sends them in hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Extract auth parameters (try hash first, then query)
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');
        const errorCode = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        // Handle Supabase-provided errors first
        if (errorCode) {
          console.error('[AuthVerify] Supabase error:', errorCode, errorDescription);
          setErrorMessage(errorDescription || 'Verification link is invalid or expired.');
          setState('error');
          return;
        }

        // STRICT: Require both tokens - no fallbacks
        if (!accessToken || !refreshToken) {
          console.error('[AuthVerify] Missing tokens in URL');
          setErrorMessage('Invalid verification link. The link may be incomplete or malformed.');
          setState('error');
          return;
        }

        // STRICT: Only accept signup verification type
        if (type !== 'signup') {
          console.error('[AuthVerify] Invalid verification type:', type);
          setErrorMessage('Invalid verification link. This page only handles email verification for new signups.');
          setState('error');
          return;
        }

        console.log('[AuthVerify] Processing signup verification...');

        // Set the session using tokens from URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[AuthVerify] Session error:', error);
          
          if (error.message.includes('expired') || error.message.includes('Refresh Token')) {
            setErrorMessage('This verification link has expired. Please request a new verification email.');
          } else if (error.message.includes('invalid')) {
            setErrorMessage('This verification link is invalid. Please request a new verification email.');
          } else {
            setErrorMessage(error.message);
          }
          setState('error');
          return;
        }

        if (!data.session) {
          console.error('[AuthVerify] No session returned after setSession');
          setErrorMessage('Failed to verify email. Please request a new verification email.');
          setState('error');
          return;
        }

        console.log('[AuthVerify] Email verified successfully, user:', data.session.user?.id);
        
        // Clean up URL immediately
        window.history.replaceState({}, document.title, '/auth/verify');
        
        // Show success state
        setState('success');
        toast.success('Email verified successfully!');
        
        // Redirect immediately - no timeout dependency for auth state
        navigate('/dashboard', { replace: true });

      } catch (err) {
        console.error('[AuthVerify] Unexpected error:', err);
        setErrorMessage('An unexpected error occurred. Please try again.');
        setState('error');
      }
    };

    verifyEmail();
  }, [navigate]);

  const handleResendEmail = async () => {
    const emailToUse = resendEmail.trim();
    
    if (!emailToUse || !emailToUse.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already confirmed')) {
          toast.error('This email is already verified. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Verification email sent! Check your inbox.');
        setResendEmail('');
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
            
            {/* Resend section with email input */}
            <div className="pt-4 space-y-4">
              <div className="text-left space-y-2">
                <Label htmlFor="resend-email" className="text-sm text-muted-foreground">
                  Enter your email to resend verification
                </Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResendEmail()}
                />
              </div>
              
              <Button 
                onClick={handleResendEmail} 
                disabled={isResending || !resendEmail.trim()}
                className="w-full"
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Resend verification email
              </Button>
              
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

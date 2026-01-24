/**
 * AuthContext - Global authentication provider
 * 
 * Single source of truth for auth state. Hydrates once on app load.
 * No re-checking on route changes.
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initRef = useRef(false);

  const setStoreUser = useAppStore((s) => s.setUser);

  // Sync user to Zustand store for legacy compatibility
  const syncUserToStore = useCallback((supabaseUser: User | null) => {
    if (supabaseUser) {
      setStoreUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        plan: 'free',
        boards_limit: 10,
        boards_used: 0,
        storage_limit_mb: 102.4,
        storage_used_mb: 0,
        created_at: supabaseUser.created_at || new Date().toISOString(),
      });
    } else {
      setStoreUser(null);
    }
  }, [setStoreUser]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const url = new URL(window.location.href);
    const hasOAuthCallback =
      url.searchParams.has('code') ||
      url.searchParams.has('error') ||
      url.hash.includes('access_token=');

    /**
     * Session persistence: ALWAYS persist sessions.
     * Users stay logged in until they explicitly sign out.
     * No "keep me logged in" opt-out - sessions persist across browser restarts.
     */

    // If we just returned from OAuth, give Supabase time to exchange the code
    let oauthSafetyTimeout: number | undefined;
    if (hasOAuthCallback) {
      oauthSafetyTimeout = window.setTimeout(() => {
        if (mounted) setIsLoading(false);
      }, 6000);
    }

    // Set up auth state listener FIRST (before checking session)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      console.log('[Auth] onAuthStateChange:', {
        event,
        userId: currentSession?.user?.id ?? null,
        hasSession: !!currentSession,
      });

      // Update state synchronously - no async operations here
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      syncUserToStore(currentSession?.user ?? null);

      // During OAuth redirect: do NOT "finish loading" on an empty INITIAL_SESSION,
      // otherwise ProtectedRoute can redirect to /auth before the code exchange completes.
      if (hasOAuthCallback && !currentSession) {
        return;
      }

      // Clean callback params once we're signed in (prevents re-processing on refresh)
      if (hasOAuthCallback && currentSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        try {
          const clean = new URL(window.location.href);
          clean.searchParams.delete('code');
          clean.searchParams.delete('state');
          clean.searchParams.delete('error');
          clean.searchParams.delete('error_description');
          clean.hash = '';
          window.history.replaceState({}, document.title, clean.pathname + clean.search);
        } catch {
          // ignore
        }
      }

      setIsLoading(false);
    });

    // THEN check for existing session (rehydrate from localStorage)
    console.log('[Auth] Rehydrating session from storage...');
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        if (!mounted) return;

        console.log('[Auth] Session rehydrated:', {
          userId: existingSession?.user?.id ?? null,
          hasSession: !!existingSession,
          expiresAt: existingSession?.expires_at,
        });

        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        syncUserToStore(existingSession?.user ?? null);

        // Only resolve loading if:
        // - we found a session, OR
        // - this is not an OAuth callback (normal navigation)
        if (existingSession || !hasOAuthCallback) {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('[Auth] Session rehydration error:', error);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (oauthSafetyTimeout) window.clearTimeout(oauthSafetyTimeout);
    };
  }, [syncUserToStore]);

  // Helper to get the correct redirect URL (production vs preview)
  const getRedirectUrl = useCallback((path: string = '/dashboard') => {
    const origin = window.location.origin;
    // Support both production domains
    if (origin.includes('multiblock.space') || origin.includes('multiblock.app')) {
      return `${origin}${path}`;
    }
    // For Lovable preview or other environments
    return `${origin}${path}`;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = getRedirectUrl('/auth/callback');
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      
      if (error) {
        return { error: new Error(error.message) };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') };
    }
  }, [getRedirectUrl]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password') };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: new Error('Please check your email and confirm your account') };
        }
        return { error: new Error(error.message) };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Always go through the dedicated callback route for deterministic OAuth hydration.
      const redirectUrl = getRedirectUrl('/auth/callback');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) {
        // Handle common OAuth errors
        if (error.message.includes('popup')) {
          return { error: new Error('Popup was blocked. Please allow popups and try again.') };
        }
        return { error: new Error(error.message) };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Google sign in failed') };
    }
  }, [getRedirectUrl]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setStoreUser(null);
  }, [setStoreUser]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        return { error: new Error(error.message) };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Password reset failed') };
    }
  }, []);

  const value = useMemo((): AuthContextValue => ({
    user,
    session,
    isAuthenticated: !!session,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }), [user, session, isLoading, signUp, signIn, signInWithGoogle, signOut, resetPassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}

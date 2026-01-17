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
  signUp: (email: string, password: string, fullName?: string, keepLoggedIn?: boolean) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, keepLoggedIn?: boolean) => Promise<{ error: Error | null }>;
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
        storage_limit_mb: 100,
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
     * Session persistence logic:
     * - Supabase persists sessions in localStorage (survives browser restarts)
     * - If user explicitly unchecked "Keep me logged in", we clear ONLY on a fresh browser session
     *
     * IMPORTANT: never clear during an OAuth callback, otherwise the code exchange can be interrupted.
     */
    const keepLoggedIn = localStorage.getItem('multiblock_keep_logged_in');
    const isNewBrowserSession = !sessionStorage.getItem('multiblock_session_active');

    if (keepLoggedIn === 'false' && isNewBrowserSession && !hasOAuthCallback) {
      console.log('[Auth] User opted out of persistent login + new browser session, clearing');
      sessionStorage.setItem('multiblock_session_active', 'true');
      supabase.auth.signOut().then(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
      return;
    }

    // Mark this browser session as active (so we don't clear on tab close/reopen)
    sessionStorage.setItem('multiblock_session_active', 'true');

    // If we just returned from OAuth, give Supabase a moment to exchange the code before we redirect.
    // We'll still resolve instantly if we already have a session.
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
          window.history.replaceState({}, document.title, clean.pathname + clean.search + clean.hash);
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
    // If we're on the production domain, use it; otherwise use current origin
    if (origin.includes('multiblock.space')) {
      return `https://multiblock.space${path}`;
    }
    // For Lovable preview
    return `${origin}${path}`;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string, keepLoggedIn: boolean = true) => {
    try {
      const redirectUrl = getRedirectUrl('/dashboard');
      
      // If user doesn't want to stay logged in, we'll handle session cleanup on browser close
      // by storing preference - Supabase will use localStorage by default
      // The actual session expiry is handled by checking this preference on page load
      
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

  const signIn = useCallback(async (email: string, password: string, keepLoggedIn: boolean = true) => {
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
      const redirectUrl = getRedirectUrl('/dashboard');
      
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

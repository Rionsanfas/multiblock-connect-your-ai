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

    /**
     * Session persistence logic:
     * - By default, Supabase persists sessions in localStorage (survives browser restarts)
     * - If user explicitly unchecked "Keep me logged in", we only clear on NEW browser sessions
     * - A "new browser session" = browser was closed and reopened (sessionStorage is cleared)
     */
    const keepLoggedIn = localStorage.getItem('multiblock_keep_logged_in');
    const isNewBrowserSession = !sessionStorage.getItem('multiblock_session_active');
    
    // Only clear session if user EXPLICITLY opted out AND this is a fresh browser session
    // If keepLoggedIn is null (never set) or 'true', sessions persist normally
    if (keepLoggedIn === 'false' && isNewBrowserSession) {
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

    // Set up auth state listener FIRST (before checking session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
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
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[Auth] Session rehydration error:', error);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

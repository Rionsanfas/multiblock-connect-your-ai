/**
 * Auth Service - Abstraction layer for authentication
 * 
 * This service provides a single point of access for the current user.
 * Currently uses mock data, but designed to be swapped with real
 * Supabase auth without changing the interface.
 * 
 * TODO: Replace with Supabase auth when ready
 */

import type { User } from '@/types';
import { mockUser } from '@/mocks/seed';

export interface AuthService {
  getCurrentUser: () => Promise<User | null>;
  login: (email: string, password?: string) => Promise<User>;
  logout: () => Promise<void>;
  onAuthStateChange: (callback: (user: User | null) => void) => () => void;
}

// Store subscriptions for auth state changes
type AuthCallback = (user: User | null) => void;
const subscribers = new Set<AuthCallback>();

// Mock current user state - simulates what would come from Supabase session
let currentMockUser: User | null = null;

/**
 * Mock Auth Service
 * 
 * Simulates authentication behavior. The interface matches what we'd
 * use with Supabase auth, making the swap seamless.
 */
export const authService: AuthService = {
  /**
   * Get the currently authenticated user
   * Returns null if not authenticated
   */
  getCurrentUser: async (): Promise<User | null> => {
    // Simulate async behavior like real auth
    await new Promise(resolve => setTimeout(resolve, 10));
    return currentMockUser;
  },

  /**
   * Authenticate a user
   * In production: calls supabase.auth.signInWithPassword()
   */
  login: async (email: string, _password?: string): Promise<User> => {
    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create user based on mock template with provided email
    const user: User = {
      ...mockUser,
      id: mockUser.id, // Keep consistent ID for data ownership
      email,
      name: email.split('@')[0],
    };
    
    currentMockUser = user;
    
    // Notify subscribers
    subscribers.forEach(cb => cb(user));
    
    return user;
  },

  /**
   * Sign out the current user
   * In production: calls supabase.auth.signOut()
   */
  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    currentMockUser = null;
    subscribers.forEach(cb => cb(null));
  },

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   * 
   * In production: wraps supabase.auth.onAuthStateChange()
   */
  onAuthStateChange: (callback: AuthCallback): (() => void) => {
    subscribers.add(callback);
    
    // Immediately call with current state
    callback(currentMockUser);
    
    return () => {
      subscribers.delete(callback);
    };
  },
};

/**
 * Initialize auth with mock user for development
 * Call this at app startup if you want auto-login
 */
export const initializeMockAuth = async (): Promise<User> => {
  currentMockUser = mockUser;
  subscribers.forEach(cb => cb(mockUser));
  return mockUser;
};

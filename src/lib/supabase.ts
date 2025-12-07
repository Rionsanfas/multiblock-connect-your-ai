import { createClient } from '@supabase/supabase-js';

// These are loaded from environment variables
// Set in Vercel: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file or Vercel dashboard.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Type definitions for database
export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  provider: 'polar' | 'stripe' | 'internal';
  provider_subscription_id: string | null;
  plan: 'free' | 'pro' | 'team';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type Block = {
  id: string;
  user_id: string;
  board_id: string | null;
  title: string;
  model: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
};

export type Board = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

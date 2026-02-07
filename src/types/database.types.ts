// ============================================
// THINKBLOCKS DATABASE TYPES
// TypeScript types matching Supabase schema
// Version: 2.1.0 - Added Messages table
// ============================================

// ============================================
// ENUMS
// ============================================

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'cohere' | 'together' | 'perplexity' | 'openrouter';

export type AppRole = 'user' | 'admin' | 'super_admin';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'team' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';

export type MessageRole = 'user' | 'assistant' | 'system';

// ============================================
// TABLE TYPES: PROFILES
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

// ============================================
// TABLE TYPES: USER ROLES
// ============================================

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserRoleInsert {
  user_id: string;
  role?: AppRole;
}

// ============================================
// TABLE TYPES: SUBSCRIPTION PLANS
// ============================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_boards: number;
  max_blocks_per_board: number;
  max_messages_per_day: number;
  max_api_keys: number;
  max_seats: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanInsert {
  name: string;
  tier: SubscriptionTier;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number;
  max_boards?: number;
  max_blocks_per_board?: number;
  max_messages_per_day?: number;
  max_api_keys?: number;
  max_seats?: number;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface SubscriptionPlanUpdate {
  name?: string;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number;
  max_boards?: number;
  max_blocks_per_board?: number;
  max_messages_per_day?: number;
  max_api_keys?: number;
  max_seats?: number;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
}

// ============================================
// TABLE TYPES: USER SUBSCRIPTIONS (Legacy - kept for compatibility)
// ============================================

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  seats_used: number;
  messages_used_today: number;
  messages_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionInsert {
  user_id: string;
  plan_id: string;
  status?: SubscriptionStatus;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  seats_used?: number;
  messages_used_today?: number;
}

export interface UserSubscriptionUpdate {
  plan_id?: string;
  status?: SubscriptionStatus;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  seats_used?: number;
  messages_used_today?: number;
  messages_reset_at?: string;
}

// ============================================
// TABLE TYPES: USER BILLING (Polar integration)
// ============================================

export interface UserBilling {
  user_id: string;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  product_id: string | null;
  product_price_id: string | null;
  active_plan: string;
  plan_category: 'individual' | 'team';
  billing_type: 'annual' | 'lifetime';
  subscription_status: string;
  is_lifetime: boolean;
  boards: number;
  blocks: number;
  storage_gb: number;
  seats: number;
  access_expires_at: string | null;
  current_period_end: string | null;
  applied_addons: AddonEntry[];
  last_event_type: string | null;
  last_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddonEntry {
  addon_id: string;
  extra_boards: number;
  extra_storage_gb: number;
  purchased_at: string;
}

export interface UserEntitlements {
  boards_limit: number;
  storage_gb: number;
  seats: number;
  blocks_unlimited: boolean;
  source_plan: string;
  extra_boards: number;
  extra_storage_gb: number;
  total_boards: number;
  total_storage_gb: number;
}

// ============================================
// TABLE TYPES: API KEYS
// ============================================

export interface ApiKey {
  id: string;
  user_id: string;
  provider: LLMProvider;
  api_key_encrypted: string;
  key_hint: string | null;
  is_valid: boolean;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyInsert {
  user_id: string;
  provider: LLMProvider;
  api_key_encrypted: string;
  key_hint?: string | null;
  is_valid?: boolean;
}

export interface ApiKeyUpdate {
  api_key_encrypted?: string;
  key_hint?: string | null;
  is_valid?: boolean;
  last_validated_at?: string | null;
}

// ============================================
// TABLE TYPES: BOARDS
// ============================================

export interface Board {
  id: string;
  user_id: string;
  team_id: string | null;
  api_key_id: string | null;
  name: string;
  description: string | null;
  is_archived: boolean;
  is_public: boolean;
  canvas_zoom: number;
  canvas_position_x: number;
  canvas_position_y: number;
  created_at: string;
  updated_at: string;
}

export interface BoardInsert {
  user_id: string;
  team_id?: string | null;
  api_key_id?: string | null;
  name?: string;
  description?: string | null;
  is_public?: boolean;
  canvas_zoom?: number;
  canvas_position_x?: number;
  canvas_position_y?: number;
}

export interface BoardUpdate {
  name?: string;
  description?: string | null;
  is_archived?: boolean;
  is_public?: boolean;
  team_id?: string | null;
  api_key_id?: string | null;
  canvas_zoom?: number;
  canvas_position_x?: number;
  canvas_position_y?: number;
}

// ============================================
// TABLE TYPES: BLOCKS
// ============================================

export interface Block {
  id: string;
  board_id: string;
  user_id: string;
  provider: LLMProvider;
  model_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  title: string;
  color: string | null;
  is_collapsed: boolean;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockInsert {
  board_id: string;
  user_id: string;
  provider: LLMProvider;
  model_id: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  title?: string;
  color?: string | null;
  system_prompt?: string | null;
}

export interface BlockUpdate {
  provider?: LLMProvider;
  model_id?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  title?: string;
  color?: string | null;
  is_collapsed?: boolean;
  system_prompt?: string | null;
}

// ============================================
// TABLE TYPES: BLOCK CONNECTIONS
// ============================================

export interface BlockConnection {
  id: string;
  source_block_id: string;
  target_block_id: string;
  user_id: string;
  label: string | null;
  created_at: string;
}

export interface BlockConnectionInsert {
  source_block_id: string;
  target_block_id: string;
  user_id: string;
  label?: string | null;
}

// ============================================
// TABLE TYPES: MESSAGES
// ============================================

export interface Message {
  id: string;
  user_id: string;
  block_id: string;
  role: MessageRole;
  content: string;
  meta: Record<string, unknown>;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface MessageInsert {
  user_id?: string; // Set automatically by RLS context
  block_id: string;
  role: MessageRole;
  content: string;
  meta?: Record<string, unknown>;
}

export interface MessageUpdate {
  content?: string;
  meta?: Record<string, unknown>;
}

// ============================================
// DATABASE SCHEMA TYPE (for Supabase client)
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      user_roles: {
        Row: UserRole;
        Insert: UserRoleInsert;
        Update: never;
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: SubscriptionPlanInsert;
        Update: SubscriptionPlanUpdate;
      };
      user_subscriptions: {
        Row: UserSubscription;
        Insert: UserSubscriptionInsert;
        Update: UserSubscriptionUpdate;
      };
      api_keys: {
        Row: ApiKey;
        Insert: ApiKeyInsert;
        Update: ApiKeyUpdate;
      };
      boards: {
        Row: Board;
        Insert: BoardInsert;
        Update: BoardUpdate;
      };
      blocks: {
        Row: Block;
        Insert: BlockInsert;
        Update: BlockUpdate;
      };
      block_connections: {
        Row: BlockConnection;
        Insert: BlockConnectionInsert;
        Update: never;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
    };
    Enums: {
      llm_provider: LLMProvider;
      app_role: AppRole;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
      get_user_role: {
        Args: { _user_id: string };
        Returns: AppRole;
      };
      get_user_board_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_board_block_count: {
        Args: { p_board_id: string };
        Returns: number;
      };
      user_has_api_key: {
        Args: { p_user_id: string; p_provider: LLMProvider };
        Returns: boolean;
      };
      get_user_api_key_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_block_incoming_connections: {
        Args: { p_block_id: string };
        Returns: {
          connection_id: string;
          source_block_id: string;
          source_title: string;
          source_provider: LLMProvider;
          source_model_id: string;
        }[];
      };
      get_user_subscription: {
        Args: { p_user_id: string };
        Returns: {
          subscription_id: string;
          plan_id: string;
          plan_name: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          max_boards: number;
          max_blocks_per_board: number;
          max_messages_per_day: number;
          max_api_keys: number;
          max_seats: number;
          messages_used_today: number;
          current_period_end: string | null;
        }[];
      };
      can_create_board: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      can_create_block: {
        Args: { p_user_id: string; p_board_id: string };
        Returns: boolean;
      };
      can_send_message: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      increment_message_count: {
        Args: { p_user_id: string };
        Returns: void;
      };
      user_owns_block: {
        Args: { p_user_id: string; p_block_id: string };
        Returns: boolean;
      };
    };
  };
}

// ============================================
// HELPER TYPES
// ============================================

/** User subscription with plan details (from get_user_subscription RPC) */
export interface UserSubscriptionWithPlan {
  subscription_id: string;
  plan_id: string;
  plan_name: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  max_boards: number;
  max_blocks_per_board: number;
  max_messages_per_day: number;
  max_api_keys: number;
  max_seats: number;
  messages_used_today: number;
  current_period_end: string | null;
}

/** Block with incoming connections */
export interface BlockWithConnections extends Block {
  incoming_connections: {
    connection_id: string;
    source_block_id: string;
    source_title: string;
    source_provider: LLMProvider;
    source_model_id: string;
  }[];
}

/** Board with blocks loaded */
export interface BoardWithBlocks extends Board {
  blocks: Block[];
}

/** API key display (safe for UI, no encrypted key) */
export interface ApiKeyDisplay {
  id: string;
  provider: LLMProvider;
  key_hint: string | null;
  is_valid: boolean;
  last_validated_at: string | null;
  created_at: string;
}

/** Usage limits for UI display */
export interface UsageLimits {
  boards: { used: number; max: number; unlimited: boolean };
  blocksPerBoard: { used: number; max: number; unlimited: boolean };
  messagesPerDay: { used: number; max: number; unlimited: boolean };
  apiKeys: { used: number; max: number; unlimited: boolean };
  seats: { used: number; max: number; unlimited: boolean };
}

// ============================================
// PROVIDER DISPLAY INFO
// ============================================

export const PROVIDER_INFO: Record<LLMProvider, { name: string; icon: string; color: string }> = {
  openai: { name: 'OpenAI', icon: '🟢', color: '#10a37f' },
  anthropic: { name: 'Anthropic', icon: '🟠', color: '#d97706' },
  google: { name: 'Google', icon: '🔵', color: '#4285f4' },
  xai: { name: 'xAI', icon: '⚫', color: '#000000' },
  deepseek: { name: 'DeepSeek', icon: '🟣', color: '#7c3aed' },
  mistral: { name: 'Mistral', icon: '🟡', color: '#f59e0b' },
  cohere: { name: 'Cohere', icon: '🟣', color: '#a855f7' },
  together: { name: 'Together.ai', icon: '🔵', color: '#3b82f6' },
  perplexity: { name: 'Perplexity', icon: '🔵', color: '#06b6d4' },
  openrouter: { name: 'OpenRouter', icon: '🟣', color: '#7c3aed' },
};

export const TIER_INFO: Record<SubscriptionTier, { name: string; color: string }> = {
  free: { name: 'Free', color: '#6b7280' },
  starter: { name: 'Starter', color: '#10b981' },
  pro: { name: 'Pro', color: '#3b82f6' },
  team: { name: 'Team', color: '#8b5cf6' },
  enterprise: { name: 'Enterprise', color: '#f59e0b' },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** Generate display hint for API key (first 4 + last 4 chars) */
export function getKeyHint(key: string): string {
  if (key.length <= 8) return key.slice(0, 4) + '...';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

/** Check if a limit value represents unlimited (-1) */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

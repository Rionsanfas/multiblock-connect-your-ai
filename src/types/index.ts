// Core data types matching production Supabase schema

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro-50' | 'pro-100' | 'team-50' | 'team-100';
  boards_limit: number;
  boards_used: number;
  storage_limit_mb: number;
  storage_used_mb: number;
  seats?: number;
  seats_used?: number;
  created_at: string;
}

export interface Board {
  id: string;
  title: string;
  user_id: string;
  metadata: {
    description?: string;
    thumbnail?: string;
    tags?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  board_id: string;
  title: string;
  type: 'chat' | 'prompt' | 'custom';
  model_id: string; // Reference to ModelConfig
  system_prompt: string;
  config: BlockConfig;
  position: { x: number; y: number };
  source_context?: SourceContext; // Context this block was created from
  created_at: string;
  updated_at: string;
}

// Represents text selected from another block that creates this block
export interface SourceContext {
  source_block_id: string;
  source_block_title: string;
  source_message_id: string;
  selected_text: string;
  created_at: string;
}

export interface BlockConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  width?: number;
  height?: number;
}

export interface Message {
  id: string;
  block_id: string;
  role: 'system' | 'user' | 'assistant' | 'context'; // 'context' for external input
  content: string;
  size_bytes: number;
  source_block_id?: string; // If role is 'context', tracks origin block
  meta?: {
    tokens?: number;
    cost?: number;
    model?: string;
    latency_ms?: number;
  };
  created_at: string;
}

// Usage tracking types
export interface BlockUsage {
  block_id: string;
  message_count: number;
  total_bytes: number;
}

export interface BoardUsage {
  board_id: string;
  block_count: number;
  message_count: number;
  total_bytes: number;
}

// ============================================
// CONNECTION SYSTEM - Explicit context passing
// ============================================

export type ConnectionContextType = 'full' | 'summary';

export interface Connection {
  id: string;
  from_block: string;
  to_block: string;
  context_type: ConnectionContextType; // What type of output to pass
  transform_template?: string; // Optional template for formatting context
  enabled: boolean; // Can be toggled on/off
  created_at: string;
  updated_at: string;
}

// Represents context passed from a source block to target
export interface BlockContext {
  connection_id: string;
  source_block_id: string;
  source_block_title: string;
  context_type: ConnectionContextType;
  content: string; // The actual output content
  created_at: string;
}

// ============================================
// MODEL & PROVIDER ABSTRACTION
// Re-export from canonical config
// ============================================

import type { Provider as ProviderType } from '@/config/models';

export type { Provider, ProviderInfo, ModelConfig } from '@/config/models';
export { 
  PROVIDERS, 
  MODEL_CONFIGS, 
  getModelConfig, 
  getProviderInfo, 
  getModelsByProvider,
  getProviderFromModel,
  getVisionModelForProvider,
  getImageGenModelForProvider,
  providerSupportsImageGeneration,
  providerSupportsVision
} from '@/config/models';

// Local type alias for use within this file
type Provider = ProviderType;

// ============================================
// API KEYS SYSTEM (BYOK)
// ============================================

export interface ApiKey {
  id: string;
  user_id: string; // Owner of the key
  provider: Provider;
  name: string; // User-defined label for the key
  key_value: string; // The actual API key value (stored for real API calls)
  key_masked: string; // Only last 4 chars visible: "sk-...Xk4m"
  key_hash: string; // Hash for validation (real impl would use bcrypt)
  encryption_method: 'aes-256-gcm' | 'mock'; // Mock for now, real encryption later
  is_valid: boolean;
  is_default: boolean; // Default key for this provider
  usage_count: number; // Track API calls made with this key
  last_used_at?: string;
  expires_at?: string; // Optional expiration
  created_at: string;
  updated_at: string;
}

// Block can optionally reference a specific API key
export interface BlockApiKeyReference {
  block_id: string;
  api_key_id: string; // Reference to ApiKey.id, not raw value
}

// ============================================
// PLANS & SUBSCRIPTIONS
// ============================================

export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';
export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';

export interface PricingPlan {
  id: string;
  name: string;
  tier: PlanTier;
  price_cents: number;
  billing_period: BillingPeriod;
  // Limits (placeholders - not enforced yet)
  boards: number;
  blocks_per_board: number | 'unlimited';
  storage_mb: number;
  seats: number;
  // Feature flags
  features: string[];
  capabilities: PlanCapabilities;
  highlight?: boolean;
  badge?: string;
  // Metadata
  sort_order: number;
  is_active: boolean;
}

export interface PlanCapabilities {
  api_access: boolean;
  custom_models: boolean;
  priority_support: boolean;
  export_json: boolean;
  export_pdf: boolean;
  sso_enabled: boolean;
  audit_logs: boolean;
  custom_branding: boolean;
  webhooks: boolean;
  advanced_analytics: boolean;
}

// ============================================
// TEAMS & SEATS
// ============================================

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  owner_id: string; // User ID of the team owner
  avatar_url?: string;
  settings: TeamSettings;
  created_at: string;
  updated_at: string;
}

export interface TeamSettings {
  default_model_id?: string;
  require_api_keys: boolean; // Force members to use their own keys
  allow_member_invites: boolean;
  shared_boards_enabled: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  invited_by: string; // User ID who invited
  invited_at: string;
  joined_at?: string; // null if pending
  status: 'pending' | 'active' | 'suspended';
}

export interface Seat {
  id: string;
  team_id: string;
  user_id?: string; // null if unassigned
  assigned_at?: string;
  seat_type: 'included' | 'addon'; // Whether it came with plan or was purchased
  is_active: boolean;
}

// ============================================
// SUBSCRIPTIONS
// ============================================

export interface Subscription {
  id: string;
  user_id?: string; // For individual subscriptions
  team_id?: string; // For team subscriptions
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  // Payment placeholder
  payment_method_id?: string;
  // Addons
  addon_ids: string[];
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================
// BOARD ADD-ONS
// ============================================

export interface BoardAddon {
  id: string;
  name: string;
  boards: number;
  storage_mb: number;
  price_cents: number;
  is_active: boolean;
}

// ============================================
// USER PLAN (Current state)
// ============================================

export interface UserPlan {
  id: string;
  user_id: string;
  plan_id: string;
  subscription_id?: string;
  team_id?: string; // If part of a team plan
  status: SubscriptionStatus;
  // Computed limits (from plan + addons)
  effective_boards_limit: number;
  effective_storage_mb: number;
  effective_seats: number;
  // Usage tracking
  boards_used: number;
  storage_used_mb: number;
  // Timestamps
  purchased_at: string;
  expires_at?: string;
  addon_ids: string[];
}

// Legacy LTD Offers (keeping for backward compatibility)
export interface LtdOffer {
  sku: string;
  title: string;
  description: string;
  price_cents: number;
  original_price_cents: number;
  limits: {
    boards: number;
    blocks_per_board: number;
    api_calls_month: number;
  };
  seats: number;
  features: string[];
  total_quantity: number;
  sold: number;
  highlight?: boolean;
}

// Legacy export for backward compatibility
export const MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    color: 'hsl(142 70% 45%)',
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    color: 'hsl(24 90% 55%)',
  },
  google: {
    name: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision'],
    color: 'hsl(217 90% 60%)',
  },
  perplexity: {
    name: 'Perplexity',
    models: ['pplx-7b-online', 'pplx-70b-online'],
    color: 'hsl(280 70% 60%)',
  },
  xai: {
    name: 'xAI',
    models: ['grok-2', 'grok-3'],
    color: 'hsl(0 0% 70%)',
  },
} as const;

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
  model: string;
  system_prompt: string;
  config: BlockConfig;
  position: { x: number; y: number };
  created_at: string;
  updated_at: string;
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
  role: 'system' | 'user' | 'assistant';
  content: string;
  meta?: {
    tokens?: number;
    cost?: number;
    model?: string;
    latency_ms?: number;
  };
  created_at: string;
}

export interface Connection {
  id: string;
  from_block: string;
  to_block: string;
  mode: 'append' | 'replace' | 'summarize';
  transform_template?: string;
}

export interface ApiKey {
  id: string;
  provider: string;
  key_masked: string;
  is_valid: boolean;
  client_only: boolean;
  created_at: string;
}

// Subscription Plans
export interface PricingPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'team';
  price_cents: number;
  billing_period: 'monthly' | 'yearly';
  boards: number;
  blocks_per_board: number | 'unlimited';
  storage_mb: number;
  seats: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

// Board Add-ons
export interface BoardAddon {
  id: string;
  name: string;
  boards: number;
  storage_mb: number;
  price_cents: number;
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

export interface UserPlan {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'pending' | 'cancelled';
  purchased_at: string;
  expires_at?: string;
  addons?: string[]; // addon IDs
}

// Model providers
export const MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
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

export type Provider = keyof typeof MODEL_PROVIDERS;

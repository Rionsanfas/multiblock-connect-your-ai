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
// ============================================

export type Provider = 'openai' | 'anthropic' | 'google' | 'perplexity' | 'xai';

export interface ModelConfig {
  id: string; // e.g., 'gpt-4o', 'claude-3-sonnet'
  provider: Provider;
  name: string; // Display name
  description: string;
  context_window: number; // Max tokens
  max_output_tokens: number;
  input_cost_per_1k: number; // Cost per 1000 input tokens (placeholder)
  output_cost_per_1k: number; // Cost per 1000 output tokens (placeholder)
  supports_vision: boolean;
  supports_functions: boolean;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'premium';
}

export interface ProviderInfo {
  id: Provider;
  name: string;
  color: string;
  logo?: string;
  website: string;
}

// ============================================
// MODEL CONFIGURATIONS - Data-driven
// ============================================

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    color: 'hsl(142 70% 45%)',
    website: 'https://openai.com',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    color: 'hsl(24 90% 55%)',
    website: 'https://anthropic.com',
  },
  google: {
    id: 'google',
    name: 'Google',
    color: 'hsl(217 90% 60%)',
    website: 'https://ai.google',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    color: 'hsl(280 70% 60%)',
    website: 'https://perplexity.ai',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    color: 'hsl(0 0% 70%)',
    website: 'https://x.ai',
  },
};

export const MODEL_CONFIGS: ModelConfig[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    description: 'Most capable OpenAI model. Great for complex tasks.',
    context_window: 128000,
    max_output_tokens: 16384,
    input_cost_per_1k: 0.005,
    output_cost_per_1k: 0.015,
    supports_vision: true,
    supports_functions: true,
    speed: 'medium',
    quality: 'premium',
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable. Best for simple tasks.',
    context_window: 128000,
    max_output_tokens: 16384,
    input_cost_per_1k: 0.00015,
    output_cost_per_1k: 0.0006,
    supports_vision: true,
    supports_functions: true,
    speed: 'fast',
    quality: 'standard',
  },
  {
    id: 'gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    description: 'Powerful with large context window.',
    context_window: 128000,
    max_output_tokens: 4096,
    input_cost_per_1k: 0.01,
    output_cost_per_1k: 0.03,
    supports_vision: true,
    supports_functions: true,
    speed: 'medium',
    quality: 'high',
  },
  // Anthropic Models
  {
    id: 'claude-3-opus',
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    description: 'Most intelligent Claude model. Exceptional reasoning.',
    context_window: 200000,
    max_output_tokens: 4096,
    input_cost_per_1k: 0.015,
    output_cost_per_1k: 0.075,
    supports_vision: true,
    supports_functions: true,
    speed: 'slow',
    quality: 'premium',
  },
  {
    id: 'claude-3-sonnet',
    provider: 'anthropic',
    name: 'Claude 3 Sonnet',
    description: 'Balanced performance and speed.',
    context_window: 200000,
    max_output_tokens: 4096,
    input_cost_per_1k: 0.003,
    output_cost_per_1k: 0.015,
    supports_vision: true,
    supports_functions: true,
    speed: 'medium',
    quality: 'high',
  },
  {
    id: 'claude-3-haiku',
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    description: 'Fastest Claude model. Great for quick tasks.',
    context_window: 200000,
    max_output_tokens: 4096,
    input_cost_per_1k: 0.00025,
    output_cost_per_1k: 0.00125,
    supports_vision: true,
    supports_functions: true,
    speed: 'fast',
    quality: 'standard',
  },
  // Google Models
  {
    id: 'gemini-pro',
    provider: 'google',
    name: 'Gemini Pro',
    description: 'Google\'s most capable model.',
    context_window: 1000000,
    max_output_tokens: 8192,
    input_cost_per_1k: 0.00125,
    output_cost_per_1k: 0.005,
    supports_vision: false,
    supports_functions: true,
    speed: 'medium',
    quality: 'high',
  },
  {
    id: 'gemini-pro-vision',
    provider: 'google',
    name: 'Gemini Pro Vision',
    description: 'Multimodal with image understanding.',
    context_window: 1000000,
    max_output_tokens: 8192,
    input_cost_per_1k: 0.00125,
    output_cost_per_1k: 0.005,
    supports_vision: true,
    supports_functions: true,
    speed: 'medium',
    quality: 'high',
  },
  // Perplexity Models
  {
    id: 'pplx-7b-online',
    provider: 'perplexity',
    name: 'Perplexity 7B Online',
    description: 'Real-time web search enabled.',
    context_window: 8192,
    max_output_tokens: 4096,
    input_cost_per_1k: 0.0002,
    output_cost_per_1k: 0.0002,
    supports_vision: false,
    supports_functions: false,
    speed: 'fast',
    quality: 'standard',
  },
  {
    id: 'pplx-70b-online',
    provider: 'perplexity',
    name: 'Perplexity 70B Online',
    description: 'Larger model with web access.',
    context_window: 8192,
    max_output_tokens: 4096,
    input_cost_per_1k: 0.001,
    output_cost_per_1k: 0.001,
    supports_vision: false,
    supports_functions: false,
    speed: 'medium',
    quality: 'high',
  },
  // xAI Models
  {
    id: 'grok-2',
    provider: 'xai',
    name: 'Grok 2',
    description: 'Balanced model from xAI.',
    context_window: 128000,
    max_output_tokens: 4096,
    input_cost_per_1k: 0.002,
    output_cost_per_1k: 0.01,
    supports_vision: false,
    supports_functions: true,
    speed: 'medium',
    quality: 'high',
  },
  {
    id: 'grok-3',
    provider: 'xai',
    name: 'Grok 3',
    description: 'Most capable xAI model.',
    context_window: 128000,
    max_output_tokens: 8192,
    input_cost_per_1k: 0.005,
    output_cost_per_1k: 0.015,
    supports_vision: true,
    supports_functions: true,
    speed: 'medium',
    quality: 'premium',
  },
];

// Helper to get model config by ID
export const getModelConfig = (modelId: string): ModelConfig | undefined => {
  return MODEL_CONFIGS.find((m) => m.id === modelId);
};

// Helper to get provider info
export const getProviderInfo = (provider: Provider): ProviderInfo => {
  return PROVIDERS[provider];
};

// Helper to get models by provider
export const getModelsByProvider = (provider: Provider): ModelConfig[] => {
  return MODEL_CONFIGS.filter((m) => m.provider === provider);
};

// ============================================
// API KEYS & OTHER TYPES
// ============================================

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
  addons?: string[];
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

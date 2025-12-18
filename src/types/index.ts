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

export type Provider = 'openai' | 'anthropic' | 'google' | 'cohere' | 'mistral' | 'perplexity' | 'xai' | 'meta';

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
  apiKeyUrl: string; // URL to get API key
  description: string;
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
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4, GPT-5, and DALL-E models',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    color: 'hsl(24 90% 55%)',
    website: 'https://anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude family of AI assistants',
  },
  google: {
    id: 'google',
    name: 'Google',
    color: 'hsl(217 90% 60%)',
    website: 'https://ai.google',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    description: 'Gemini and PaLM models',
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    color: 'hsl(340 70% 55%)',
    website: 'https://cohere.com',
    apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
    description: 'Command and embed models',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    color: 'hsl(25 95% 55%)',
    website: 'https://mistral.ai',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    description: 'Mistral and Mixtral models',
  },
  meta: {
    id: 'meta',
    name: 'Meta',
    color: 'hsl(214 89% 52%)',
    website: 'https://llama.meta.com',
    apiKeyUrl: 'https://llama.meta.com/llama-downloads',
    description: 'LLaMA open-weight models',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    color: 'hsl(280 70% 60%)',
    website: 'https://perplexity.ai',
    apiKeyUrl: 'https://www.perplexity.ai/settings/api',
    description: 'Search-augmented AI models',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    color: 'hsl(0 0% 70%)',
    website: 'https://x.ai',
    apiKeyUrl: 'https://console.x.ai',
    description: 'Grok AI models',
  },
};

export const MODEL_CONFIGS: ModelConfig[] = [
  // ===== OpenAI Models (15) =====
  { id: 'gpt-5', provider: 'openai', name: 'GPT-5', description: 'Most advanced OpenAI model with superior reasoning.', context_window: 256000, max_output_tokens: 32768, input_cost_per_1k: 0.03, output_cost_per_1k: 0.06, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-5-mini', provider: 'openai', name: 'GPT-5 Mini', description: 'Faster GPT-5 variant for quick tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.01, output_cost_per_1k: 0.02, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', description: 'Flagship multimodal model. Great for complex tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', description: 'Fast and affordable. Best for simple tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'GPT-4 Turbo', description: 'Powerful with large context window.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gpt-4', provider: 'openai', name: 'GPT-4', description: 'Original GPT-4 model with strong reasoning.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.03, output_cost_per_1k: 0.06, supports_vision: false, supports_functions: true, speed: 'slow', quality: 'high' },
  { id: 'gpt-4-vision', provider: 'openai', name: 'GPT-4 Vision', description: 'GPT-4 with image understanding.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gpt-3.5-turbo', provider: 'openai', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective for most tasks.', context_window: 16384, max_output_tokens: 4096, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gpt-3.5-turbo-16k', provider: 'openai', name: 'GPT-3.5 Turbo 16K', description: 'Extended context for longer documents.', context_window: 16384, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'o1-preview', provider: 'openai', name: 'o1 Preview', description: 'Advanced reasoning model for complex problems.', context_window: 128000, max_output_tokens: 32768, input_cost_per_1k: 0.015, output_cost_per_1k: 0.06, supports_vision: true, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'o1-mini', provider: 'openai', name: 'o1 Mini', description: 'Faster reasoning model.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.003, output_cost_per_1k: 0.012, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'davinci-002', provider: 'openai', name: 'Davinci 002', description: 'Legacy completion model.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'curie-001', provider: 'openai', name: 'Curie 001', description: 'Balanced speed and capability.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0002, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'babbage-002', provider: 'openai', name: 'Babbage 002', description: 'Fast for simple tasks.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.0004, output_cost_per_1k: 0.0004, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'ada-002', provider: 'openai', name: 'Ada 002', description: 'Embedding and classification.', context_window: 8192, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },

  // ===== Anthropic Models (15) =====
  { id: 'claude-4-opus', provider: 'anthropic', name: 'Claude 4 Opus', description: 'Most intelligent Claude with exceptional reasoning.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.025, output_cost_per_1k: 0.125, supports_vision: true, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-4-sonnet', provider: 'anthropic', name: 'Claude 4 Sonnet', description: 'Balanced Claude 4 for most tasks.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.008, output_cost_per_1k: 0.024, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'claude-3.5-sonnet', provider: 'anthropic', name: 'Claude 3.5 Sonnet', description: 'Best balance of intelligence and speed.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'claude-3-opus', provider: 'anthropic', name: 'Claude 3 Opus', description: 'Exceptional reasoning and analysis.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-3-sonnet', provider: 'anthropic', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'claude-3-haiku', provider: 'anthropic', name: 'Claude 3 Haiku', description: 'Fastest Claude model.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'claude-2.1', provider: 'anthropic', name: 'Claude 2.1', description: 'Previous generation with 200K context.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.008, output_cost_per_1k: 0.024, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'claude-2.0', provider: 'anthropic', name: 'Claude 2.0', description: 'Reliable previous generation.', context_window: 100000, max_output_tokens: 4096, input_cost_per_1k: 0.008, output_cost_per_1k: 0.024, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'claude-instant', provider: 'anthropic', name: 'Claude Instant', description: 'Fast and affordable Claude.', context_window: 100000, max_output_tokens: 4096, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.0024, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'claude-instant-1.2', provider: 'anthropic', name: 'Claude Instant 1.2', description: 'Updated fast model.', context_window: 100000, max_output_tokens: 4096, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.0024, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'claude-mini', provider: 'anthropic', name: 'Claude Mini', description: 'Lightweight and quick responses.', context_window: 50000, max_output_tokens: 2048, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0006, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'claude-3.5-haiku', provider: 'anthropic', name: 'Claude 3.5 Haiku', description: 'Fastest 3.5 variant.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'claude-code', provider: 'anthropic', name: 'Claude Code', description: 'Optimized for coding tasks.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'claude-research', provider: 'anthropic', name: 'Claude Research', description: 'Deep analysis and research.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-creative', provider: 'anthropic', name: 'Claude Creative', description: 'Creative writing and brainstorming.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },

  // ===== Google Models (15) =====
  { id: 'gemini-2.5-pro', provider: 'google', name: 'Gemini 2.5 Pro', description: 'Latest flagship with advanced reasoning.', context_window: 2000000, max_output_tokens: 8192, input_cost_per_1k: 0.00625, output_cost_per_1k: 0.025, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gemini-2.5-flash', provider: 'google', name: 'Gemini 2.5 Flash', description: 'Fast Gemini 2.5 variant.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00075, output_cost_per_1k: 0.003, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gemini-2.0-pro', provider: 'google', name: 'Gemini 2.0 Pro', description: 'Advanced multimodal capabilities.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gemini-2.0-flash', provider: 'google', name: 'Gemini 2.0 Flash', description: 'Fast 2.0 for quick tasks.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gemini-1.5-pro', provider: 'google', name: 'Gemini 1.5 Pro', description: 'Million token context window.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gemini-1.5-flash', provider: 'google', name: 'Gemini 1.5 Flash', description: 'Fast and efficient 1.5.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gemini-1.0-pro', provider: 'google', name: 'Gemini 1.0 Pro', description: 'Original Gemini Pro.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gemini-1.0-ultra', provider: 'google', name: 'Gemini 1.0 Ultra', description: 'Most capable 1.0 model.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.0025, output_cost_per_1k: 0.01, supports_vision: true, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'gemini-pro-vision', provider: 'google', name: 'Gemini Pro Vision', description: 'Multimodal image understanding.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gemini-nano', provider: 'google', name: 'Gemini Nano', description: 'On-device efficient model.', context_window: 8192, max_output_tokens: 2048, input_cost_per_1k: 0.00001, output_cost_per_1k: 0.00004, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'palm-2', provider: 'google', name: 'PaLM 2', description: 'Previous generation model.', context_window: 8192, max_output_tokens: 1024, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'standard' },
  { id: 'palm-2-chat', provider: 'google', name: 'PaLM 2 Chat', description: 'Conversational PaLM.', context_window: 8192, max_output_tokens: 1024, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'gemma-2', provider: 'google', name: 'Gemma 2', description: 'Open weights model.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'gemma-7b', provider: 'google', name: 'Gemma 7B', description: 'Lightweight open model.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'codegemma', provider: 'google', name: 'CodeGemma', description: 'Code-optimized Gemma.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Cohere Models (15) =====
  { id: 'command-r-plus', provider: 'cohere', name: 'Command R+', description: 'Most powerful Cohere model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'command-r', provider: 'cohere', name: 'Command R', description: 'Balanced RAG-optimized model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'command-light', provider: 'cohere', name: 'Command Light', description: 'Fast and efficient.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.0003, output_cost_per_1k: 0.0006, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'command', provider: 'cohere', name: 'Command', description: 'General purpose model.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'command-nightly', provider: 'cohere', name: 'Command Nightly', description: 'Latest experimental features.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'generate-xlarge', provider: 'cohere', name: 'Generate XLarge', description: 'Large generation model.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.004, supports_vision: false, supports_functions: false, speed: 'slow', quality: 'high' },
  { id: 'generate-large', provider: 'cohere', name: 'Generate Large', description: 'Standard generation.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'standard' },
  { id: 'generate-medium', provider: 'cohere', name: 'Generate Medium', description: 'Balanced generation.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'generate-small', provider: 'cohere', name: 'Generate Small', description: 'Fast lightweight generation.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0004, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'summarize-xlarge', provider: 'cohere', name: 'Summarize XLarge', description: 'Best summarization.', context_window: 50000, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.004, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'summarize-medium', provider: 'cohere', name: 'Summarize Medium', description: 'Fast summarization.', context_window: 50000, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'embed-english-v3', provider: 'cohere', name: 'Embed English v3', description: 'English embeddings.', context_window: 512, max_output_tokens: 1024, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'embed-multilingual-v3', provider: 'cohere', name: 'Embed Multilingual v3', description: 'Multilingual embeddings.', context_window: 512, max_output_tokens: 1024, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'rerank-english-v3', provider: 'cohere', name: 'Rerank English v3', description: 'Document reranking.', context_window: 4096, max_output_tokens: 1024, input_cost_per_1k: 0.002, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'rerank-multilingual-v3', provider: 'cohere', name: 'Rerank Multilingual v3', description: 'Multilingual reranking.', context_window: 4096, max_output_tokens: 1024, input_cost_per_1k: 0.002, output_cost_per_1k: 0.002, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },

  // ===== Mistral Models (15) =====
  { id: 'mistral-large', provider: 'mistral', name: 'Mistral Large', description: 'Most capable Mistral model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.004, output_cost_per_1k: 0.012, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'mistral-medium', provider: 'mistral', name: 'Mistral Medium', description: 'Balanced performance.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.0027, output_cost_per_1k: 0.0081, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'mistral-small', provider: 'mistral', name: 'Mistral Small', description: 'Cost-effective option.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'mistral-7b', provider: 'mistral', name: 'Mistral 7B', description: 'Open weights efficient model.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00025, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'mistral-8x7b', provider: 'mistral', name: 'Mixtral 8x7B', description: 'Mixture of experts model.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.0007, output_cost_per_1k: 0.0007, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'mistral-8x22b', provider: 'mistral', name: 'Mixtral 8x22B', description: 'Large mixture of experts.', context_window: 64000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'mistral-tiny', provider: 'mistral', name: 'Mistral Tiny', description: 'Ultra-fast responses.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00025, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'mistral-nemo', provider: 'mistral', name: 'Mistral Nemo', description: '12B parameter model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0003, output_cost_per_1k: 0.0003, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'codestral', provider: 'mistral', name: 'Codestral', description: 'Optimized for code.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'codestral-mamba', provider: 'mistral', name: 'Codestral Mamba', description: 'Mamba architecture for code.', context_window: 256000, max_output_tokens: 8192, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00025, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'pixtral-12b', provider: 'mistral', name: 'Pixtral 12B', description: 'Vision-capable model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.00015, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'pixtral-large', provider: 'mistral', name: 'Pixtral Large', description: 'Advanced vision model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'mistral-embed', provider: 'mistral', name: 'Mistral Embed', description: 'Text embeddings.', context_window: 8192, max_output_tokens: 1024, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'mathstral-7b', provider: 'mistral', name: 'Mathstral 7B', description: 'Math-specialized model.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.0003, output_cost_per_1k: 0.0003, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'ministral-8b', provider: 'mistral', name: 'Ministral 8B', description: 'Compact efficient model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },

  // ===== Perplexity Models (10) =====
  { id: 'sonar-pro', provider: 'perplexity', name: 'Sonar Pro', description: 'Advanced real-time search.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'premium' },
  { id: 'sonar', provider: 'perplexity', name: 'Sonar', description: 'Real-time web search.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'sonar-reasoning', provider: 'perplexity', name: 'Sonar Reasoning', description: 'Deep reasoning with search.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.005, supports_vision: false, supports_functions: false, speed: 'slow', quality: 'premium' },
  { id: 'pplx-7b-online', provider: 'perplexity', name: 'PPLX 7B Online', description: 'Fast online search.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0002, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'pplx-70b-online', provider: 'perplexity', name: 'PPLX 70B Online', description: 'Powerful online search.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'pplx-7b-chat', provider: 'perplexity', name: 'PPLX 7B Chat', description: 'Conversational search.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'pplx-70b-chat', provider: 'perplexity', name: 'PPLX 70B Chat', description: 'Advanced chat model.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.0007, output_cost_per_1k: 0.0007, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },

  // ===== xAI Models (8) =====
  { id: 'grok-3', provider: 'xai', name: 'Grok 3', description: 'Most capable xAI model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'grok-3-mini', provider: 'xai', name: 'Grok 3 Mini', description: 'Fast Grok 3 variant.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'grok-2', provider: 'xai', name: 'Grok 2', description: 'Balanced xAI model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.01, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'grok-2-mini', provider: 'xai', name: 'Grok 2 Mini', description: 'Fast Grok 2 variant.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.001, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'grok-1.5', provider: 'xai', name: 'Grok 1.5', description: 'Previous generation.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.005, supports_vision: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'grok-vision', provider: 'xai', name: 'Grok Vision', description: 'Vision-capable Grok.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== Meta Models (15) =====
  { id: 'llama-3.3-70b', provider: 'meta', name: 'LLaMA 3.3 70B', description: 'Latest flagship open model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00059, output_cost_per_1k: 0.00079, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'llama-3.2-90b-vision', provider: 'meta', name: 'LLaMA 3.2 90B Vision', description: 'Multimodal with vision support.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0009, output_cost_per_1k: 0.0009, supports_vision: true, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'llama-3.2-11b-vision', provider: 'meta', name: 'LLaMA 3.2 11B Vision', description: 'Compact vision model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.000055, output_cost_per_1k: 0.000055, supports_vision: true, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'llama-3.2-3b', provider: 'meta', name: 'LLaMA 3.2 3B', description: 'Lightweight efficient model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00003, output_cost_per_1k: 0.00003, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'llama-3.2-1b', provider: 'meta', name: 'LLaMA 3.2 1B', description: 'Ultra-compact model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00001, output_cost_per_1k: 0.00001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'llama-3.1-405b', provider: 'meta', name: 'LLaMA 3.1 405B', description: 'Largest open model available.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.003, supports_vision: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'llama-3.1-70b', provider: 'meta', name: 'LLaMA 3.1 70B', description: 'High-quality balanced model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00059, output_cost_per_1k: 0.00079, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'llama-3.1-8b', provider: 'meta', name: 'LLaMA 3.1 8B', description: 'Fast and efficient.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00005, output_cost_per_1k: 0.00005, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'llama-3-70b', provider: 'meta', name: 'LLaMA 3 70B', description: 'Previous flagship model.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.00059, output_cost_per_1k: 0.00079, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'llama-3-8b', provider: 'meta', name: 'LLaMA 3 8B', description: 'Compact previous gen.', context_window: 8192, max_output_tokens: 4096, input_cost_per_1k: 0.00005, output_cost_per_1k: 0.00005, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'llama-guard-3', provider: 'meta', name: 'LLaMA Guard 3', description: 'Safety classifier model.', context_window: 8192, max_output_tokens: 1024, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0002, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'code-llama-70b', provider: 'meta', name: 'Code LLaMA 70B', description: 'Code-specialized model.', context_window: 16384, max_output_tokens: 4096, input_cost_per_1k: 0.0007, output_cost_per_1k: 0.0007, supports_vision: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'code-llama-34b', provider: 'meta', name: 'Code LLaMA 34B', description: 'Balanced code model.', context_window: 16384, max_output_tokens: 4096, input_cost_per_1k: 0.0004, output_cost_per_1k: 0.0004, supports_vision: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'code-llama-13b', provider: 'meta', name: 'Code LLaMA 13B', description: 'Lightweight code model.', context_window: 16384, max_output_tokens: 4096, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0002, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'code-llama-7b', provider: 'meta', name: 'Code LLaMA 7B', description: 'Fast code assistant.', context_window: 16384, max_output_tokens: 4096, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0001, supports_vision: false, supports_functions: false, speed: 'fast', quality: 'standard' },
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
// API KEYS SYSTEM (BYOK)
// ============================================

export interface ApiKey {
  id: string;
  user_id: string; // Owner of the key
  provider: Provider;
  name: string; // User-defined label for the key
  key_masked: string; // Only last 4 chars visible: "sk-...Xk4m"
  key_hash: string; // Mock hash for validation (real impl would use bcrypt)
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

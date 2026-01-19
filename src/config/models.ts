// Canonical Model & Provider Configuration
// This is the SINGLE SOURCE OF TRUTH for all models and providers

// Provider type matches Supabase llm_provider enum
export type Provider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'cohere' | 'together' | 'perplexity';

// Model type categories
export type ModelType = 'chat' | 'image' | 'video' | 'audio' | 'embedding' | 'code' | 'rerank' | 'vision';

export interface ProviderInfo {
  id: Provider;
  name: string;
  color: string;
  logo?: string;
  website: string;
  apiKeyUrl: string;
  description: string;
}

export interface ModelConfig {
  id: string;
  provider: Provider;
  name: string;
  description: string;
  type: ModelType;
  context_window: number;
  max_output_tokens: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  supports_vision: boolean;
  supports_image_generation: boolean;
  supports_video_generation: boolean;
  supports_audio: boolean;
  supports_functions: boolean;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'premium';
}

// ============================================
// PROVIDERS - Matches Supabase llm_provider enum
// ============================================
export const PROVIDERS: Record<Provider, ProviderInfo> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    color: 'hsl(142 70% 45%)',
    website: 'https://openai.com',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-5, Sora, and DALL-E models',
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
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Gemini, Imagen, and Veo models',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    color: 'hsl(0 0% 70%)',
    website: 'https://x.ai',
    apiKeyUrl: 'https://console.x.ai',
    description: 'Grok AI models',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    color: 'hsl(200 80% 50%)',
    website: 'https://deepseek.com',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    description: 'DeepSeek AI models',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    color: 'hsl(35 90% 55%)',
    website: 'https://mistral.ai',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    description: 'Mistral AI models',
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    color: 'hsl(280 70% 55%)',
    website: 'https://cohere.com',
    apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
    description: 'Cohere language and embedding models',
  },
  together: {
    id: 'together',
    name: 'Together.ai',
    color: 'hsl(220 80% 55%)',
    website: 'https://together.ai',
    apiKeyUrl: 'https://api.together.ai/settings/api-keys',
    description: 'Open-source and frontier models',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    color: 'hsl(180 70% 45%)',
    website: 'https://perplexity.ai',
    apiKeyUrl: 'https://www.perplexity.ai/settings/api',
    description: 'AI-powered search and routing',
  },
};

// ============================================
// MODEL CONFIGURATIONS - Canonical definitions
// ============================================
export const MODEL_CONFIGS: ModelConfig[] = [
  // ===== OpenAI Chat Models =====
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', type: 'chat', description: 'Flagship multimodal model with vision support.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', type: 'chat', description: 'Fast and affordable for everyday tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'GPT-4 Turbo', type: 'chat', description: 'Powerful with large context window.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== OpenAI Image Models =====
  { id: 'dall-e-3', provider: 'openai', name: 'DALL-E 3', type: 'image', description: 'Advanced image generation with superior quality.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.04, output_cost_per_1k: 0.08, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ===== OpenAI Audio Models =====
  { id: 'gpt-4o-audio', provider: 'openai', name: 'GPT-4o Audio', type: 'audio', description: 'Multimodal audio understanding.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'whisper', provider: 'openai', name: 'Whisper', type: 'audio', description: 'Speech-to-text transcription.', context_window: 0, max_output_tokens: 0, input_cost_per_1k: 0.006, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: false, speed: 'fast', quality: 'high' },


  // ===== Anthropic Models (Chat Only) =====
  { id: 'claude-3-5-sonnet', provider: 'anthropic', name: 'Claude 3.5 Sonnet', type: 'chat', description: 'Best balance of intelligence and speed.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'claude-3-5-haiku', provider: 'anthropic', name: 'Claude 3.5 Haiku', type: 'chat', description: 'Fastest Claude with excellent quality.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.004, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'claude-3-opus', provider: 'anthropic', name: 'Claude 3 Opus', type: 'chat', description: 'Most capable Claude with superior reasoning.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-3-sonnet', provider: 'anthropic', name: 'Claude 3 Sonnet', type: 'chat', description: 'Balanced performance and speed.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'claude-3-haiku', provider: 'anthropic', name: 'Claude 3 Haiku', type: 'chat', description: 'Fast and lightweight Claude.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },


  // ===== Google Chat Models =====
  { id: 'gemini-1.5-pro', provider: 'google', name: 'Gemini 1.5 Pro', type: 'chat', description: 'Advanced reasoning with huge context.', context_window: 2000000, max_output_tokens: 8192, input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gemini-1.5-flash', provider: 'google', name: 'Gemini 1.5 Flash', type: 'chat', description: 'Fast Gemini 1.5 variant.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.000075, output_cost_per_1k: 0.0003, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gemini-1.5-flash-8b', provider: 'google', name: 'Gemini 1.5 Flash 8B', type: 'chat', description: 'Lightweight Gemini for simple tasks.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.0000375, output_cost_per_1k: 0.00015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gemini-2.0-flash', provider: 'google', name: 'Gemini 2.0 Flash', type: 'chat', description: 'Latest fast Gemini model.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: true, speed: 'fast', quality: 'high' },


  // ===== xAI Chat Models =====
  { id: 'grok-2', provider: 'xai', name: 'Grok 2', type: 'chat', description: 'Latest Grok model with advanced reasoning.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.01, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'grok-2-mini', provider: 'xai', name: 'Grok 2 Mini', type: 'chat', description: 'Fast and efficient Grok.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.001, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'grok-beta', provider: 'xai', name: 'Grok Beta', type: 'chat', description: 'Grok beta version for testing.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },


  // ===== DeepSeek Models (Chat Only) =====
  { id: 'deepseek-chat', provider: 'deepseek', name: 'DeepSeek Chat', type: 'chat', description: 'DeepSeek V3 general chat model.', context_window: 64000, max_output_tokens: 8192, input_cost_per_1k: 0.00014, output_cost_per_1k: 0.00028, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'deepseek-reasoner', provider: 'deepseek', name: 'DeepSeek Reasoner', type: 'chat', description: 'DeepSeek R1 reasoning model.', context_window: 64000, max_output_tokens: 8192, input_cost_per_1k: 0.00055, output_cost_per_1k: 0.00219, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },

  // ===== Mistral Chat Models =====
  { id: 'mistral-large', provider: 'mistral', name: 'Mistral Large', type: 'chat', description: 'Most capable Mistral model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'mistral-small', provider: 'mistral', name: 'Mistral Small', type: 'chat', description: 'Fast Mistral for simple tasks.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'mistral-nemo', provider: 'mistral', name: 'Mistral Nemo', type: 'chat', description: 'Efficient general-purpose model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.00015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'codestral', provider: 'mistral', name: 'Codestral', type: 'code', description: 'Optimized for code generation.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'pixtral-large', provider: 'mistral', name: 'Pixtral Large', type: 'chat', description: 'Vision and image understanding.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },


  // ===== Cohere Chat Models =====
  { id: 'command-r-plus', provider: 'cohere', name: 'Command R+', type: 'chat', description: 'Most capable Cohere model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0025, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'command-r', provider: 'cohere', name: 'Command R', type: 'chat', description: 'Fast and efficient Command model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'command-light', provider: 'cohere', name: 'Command Light', type: 'chat', description: 'Lightweight Command for simple tasks.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.00015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },


  // ===== Together.ai Chat Models =====
  { id: 'llama-3.3-70b-instruct-turbo', provider: 'together', name: 'Llama 3.3 70B Instruct Turbo', type: 'chat', description: 'Fast Llama 3.3 70B.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0009, output_cost_per_1k: 0.0009, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'llama-4-maverick-17bx128e', provider: 'together', name: 'Llama 4 Maverick 17Bx128E', type: 'chat', description: 'MoE Llama 4 variant.', context_window: 256000, max_output_tokens: 16384, input_cost_per_1k: 0.0012, output_cost_per_1k: 0.0012, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'llama-4-scout-17bx16e', provider: 'together', name: 'Llama 4 Scout 17Bx16E', type: 'chat', description: 'Lightweight Llama 4 MoE.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.0008, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'qwen3-235b-a22b-instruct', provider: 'together', name: 'Qwen3 235B-A22B Instruct', type: 'chat', description: 'Large Qwen3 MoE model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0015, output_cost_per_1k: 0.0015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'deepseek-v3.1-together', provider: 'together', name: 'DeepSeek V3.1', type: 'chat', description: 'DeepSeek via Together.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.0008, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Together.ai Image Models =====
  { id: 'flux-together', provider: 'together', name: 'Flux', type: 'image', description: 'Together.ai Flux image generation.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.04, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'medium', quality: 'premium' },
  { id: 'flux-schnell-turbo', provider: 'together', name: 'Flux.1 Schnell Turbo', type: 'image', description: 'Fast Flux image generation.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.003, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'fast', quality: 'high' },

  // ===== Together.ai Video Models =====
  { id: 'stable-video-together', provider: 'together', name: 'Stable Video', type: 'video', description: 'Together.ai Stable Video Diffusion.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.08, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_audio: false, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ===== Perplexity Router/Meta Models =====
  { id: 'sonar-large-online', provider: 'perplexity', name: 'Sonar Large Online', type: 'chat', description: 'Real-time web search.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'pplx-70b', provider: 'perplexity', name: 'Pplx-70b', type: 'chat', description: 'Perplexity 70B model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gpt-5.1-pplx', provider: 'perplexity', name: 'GPT-5.1', type: 'chat', description: 'GPT-5.1 via Perplexity.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'claude-sonnet-4.5-pplx', provider: 'perplexity', name: 'Claude Sonnet 4.5', type: 'chat', description: 'Claude via Perplexity.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'claude-opus-4.1-thinking-pplx', provider: 'perplexity', name: 'Claude Opus 4.1 Thinking', type: 'chat', description: 'Claude Opus with extended thinking.', context_window: 200000, max_output_tokens: 32768, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'gemini-3-pro-pplx', provider: 'perplexity', name: 'Gemini 3 Pro', type: 'chat', description: 'Gemini via Perplexity.', context_window: 2000000, max_output_tokens: 65536, input_cost_per_1k: 0.00625, output_cost_per_1k: 0.025, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'grok-4.1-pplx', provider: 'perplexity', name: 'Grok 4.1', type: 'chat', description: 'Grok via Perplexity.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'kimi-k2-pplx', provider: 'perplexity', name: 'Kimi K2', type: 'chat', description: 'Kimi K2 via Perplexity.', context_window: 256000, max_output_tokens: 16384, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'o3-pro-pplx', provider: 'perplexity', name: 'o3-pro', type: 'chat', description: 'o3-pro via Perplexity.', context_window: 200000, max_output_tokens: 100000, input_cost_per_1k: 0.02, output_cost_per_1k: 0.08, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get model config by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find((m) => m.id === modelId);
}

/**
 * Get provider info by ID
 */
export function getProviderInfo(provider: Provider): ProviderInfo {
  return PROVIDERS[provider];
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: Provider): ModelConfig[] {
  return MODEL_CONFIGS.filter((m) => m.provider === provider);
}

/**
 * Get models by type
 */
export function getModelsByType(type: ModelType): ModelConfig[] {
  return MODEL_CONFIGS.filter((m) => m.type === type);
}

/**
 * Get chat models only
 */
export function getChatModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter((m) => m.type === 'chat');
}

/**
 * Get image generation models
 */
export function getImageModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter((m) => m.type === 'image' || m.supports_image_generation);
}

/**
 * Get video generation models
 */
export function getVideoModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter((m) => m.type === 'video' || m.supports_video_generation);
}

/**
 * Get provider from model ID
 */
export function getProviderFromModel(modelId: string): Provider | undefined {
  const model = getModelConfig(modelId);
  return model?.provider;
}

/**
 * Get vision-capable model for a provider
 */
export function getVisionModelForProvider(provider: Provider): ModelConfig | undefined {
  return MODEL_CONFIGS.find((m) => m.provider === provider && m.supports_vision);
}

/**
 * Get image generation model for a provider
 */
export function getImageGenModelForProvider(provider: Provider): ModelConfig | undefined {
  return MODEL_CONFIGS.find((m) => m.provider === provider && m.supports_image_generation);
}

/**
 * Check if a provider supports image generation
 */
export function providerSupportsImageGeneration(provider: Provider): boolean {
  return MODEL_CONFIGS.some((m) => m.provider === provider && m.supports_image_generation);
}

/**
 * Check if a provider supports vision
 */
export function providerSupportsVision(provider: Provider): boolean {
  return MODEL_CONFIGS.some((m) => m.provider === provider && m.supports_vision);
}

/**
 * Check if a provider supports video generation
 */
export function providerSupportsVideoGeneration(provider: Provider): boolean {
  return MODEL_CONFIGS.some((m) => m.provider === provider && m.supports_video_generation);
}

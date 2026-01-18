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
  { id: 'gpt-5.2', provider: 'openai', name: 'GPT-5.2', type: 'chat', description: 'Latest flagship OpenAI model with superior reasoning.', context_window: 256000, max_output_tokens: 32768, input_cost_per_1k: 0.04, output_cost_per_1k: 0.12, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-5.2-pro', provider: 'openai', name: 'GPT-5.2 Pro', type: 'chat', description: 'Enhanced GPT-5.2 with extended capabilities.', context_window: 512000, max_output_tokens: 65536, input_cost_per_1k: 0.06, output_cost_per_1k: 0.18, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'gpt-5', provider: 'openai', name: 'GPT-5', type: 'chat', description: 'Powerful reasoning and multimodal capabilities.', context_window: 256000, max_output_tokens: 32768, input_cost_per_1k: 0.03, output_cost_per_1k: 0.06, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-5-mini', provider: 'openai', name: 'GPT-5 Mini', type: 'chat', description: 'Faster GPT-5 variant for quick tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.01, output_cost_per_1k: 0.02, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gpt-5-nano', provider: 'openai', name: 'GPT-5 Nano', type: 'chat', description: 'Lightweight GPT-5 for simple tasks.', context_window: 64000, max_output_tokens: 8192, input_cost_per_1k: 0.005, output_cost_per_1k: 0.01, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', type: 'chat', description: 'Flagship multimodal model.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', type: 'chat', description: 'Fast and affordable.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'GPT-4 Turbo', type: 'chat', description: 'Powerful with large context window.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'o3-pro', provider: 'openai', name: 'o3-pro', type: 'chat', description: 'Advanced reasoning model with deep thinking.', context_window: 200000, max_output_tokens: 100000, input_cost_per_1k: 0.02, output_cost_per_1k: 0.08, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'o3-deep-research', provider: 'openai', name: 'o3-deep-research', type: 'chat', description: 'Extended research and analysis model.', context_window: 200000, max_output_tokens: 100000, input_cost_per_1k: 0.025, output_cost_per_1k: 0.1, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },

  // ===== OpenAI Image Models =====
  { id: 'gpt-image-1.5', provider: 'openai', name: 'GPT Image 1.5', type: 'image', description: 'Advanced image generation with superior quality and detail.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.04, output_cost_per_1k: 0.08, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ===== OpenAI Video Models =====
  { id: 'sora-2-pro', provider: 'openai', name: 'Sora 2 Pro', type: 'video', description: 'Premium AI video generation with cinematic quality.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.12, output_cost_per_1k: 0.24, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_audio: false, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ===== OpenAI Audio Models =====
  { id: 'gpt-4o-audio', provider: 'openai', name: 'GPT-4o Audio', type: 'audio', description: 'Multimodal audio understanding.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'whisper', provider: 'openai', name: 'Whisper', type: 'audio', description: 'Speech-to-text transcription.', context_window: 0, max_output_tokens: 0, input_cost_per_1k: 0.006, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: false, speed: 'fast', quality: 'high' },

  // ===== Anthropic Models (Chat Only) =====
  { id: 'claude-opus-4.5', provider: 'anthropic', name: 'Claude Opus 4.5', type: 'chat', description: 'Most capable Claude with superior reasoning.', context_window: 200000, max_output_tokens: 32768, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-sonnet-4.5', provider: 'anthropic', name: 'Claude Sonnet 4.5', type: 'chat', description: 'Best balance of intelligence and speed.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'claude-haiku-4.5', provider: 'anthropic', name: 'Claude Haiku 4.5', type: 'chat', description: 'Fastest Claude with excellent quality.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'claude-opus-4.1', provider: 'anthropic', name: 'Claude Opus 4.1', type: 'chat', description: 'Exceptional reasoning and analysis.', context_window: 200000, max_output_tokens: 16384, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-sonnet-4', provider: 'anthropic', name: 'Claude Sonnet 4', type: 'chat', description: 'Balanced performance and speed.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== Google Chat Models =====
  { id: 'gemini-3-pro', provider: 'google', name: 'Gemini 3 Pro', type: 'chat', description: 'Latest flagship Gemini model.', context_window: 2000000, max_output_tokens: 65536, input_cost_per_1k: 0.00625, output_cost_per_1k: 0.025, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gemini-3-flash', provider: 'google', name: 'Gemini 3 Flash', type: 'chat', description: 'Fast Gemini 3 variant.', context_window: 1000000, max_output_tokens: 32768, input_cost_per_1k: 0.00075, output_cost_per_1k: 0.003, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gemini-3-nano', provider: 'google', name: 'Gemini 3 Nano', type: 'chat', description: 'Lightweight Gemini for simple tasks.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gemini-2.5-pro', provider: 'google', name: 'Gemini 2.5 Pro', type: 'chat', description: 'Advanced reasoning with huge context.', context_window: 2000000, max_output_tokens: 8192, input_cost_per_1k: 0.00625, output_cost_per_1k: 0.025, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gemini-2.5-flash', provider: 'google', name: 'Gemini 2.5 Flash', type: 'chat', description: 'Fast Gemini 2.5 variant.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00075, output_cost_per_1k: 0.003, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gemini-live-2.5-flash', provider: 'google', name: 'Gemini Live 2.5 Flash', type: 'chat', description: 'Real-time conversational Gemini.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.004, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Google Image Models =====
  { id: 'nano-banana-pro', provider: 'google', name: 'Nano Banana Pro', type: 'image', description: 'Google\'s premier image generation model.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.05, output_cost_per_1k: 0.1, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ===== Google Video Models =====
  { id: 'veo-3.1', provider: 'google', name: 'Veo 3.1', type: 'video', description: 'Google\'s advanced AI video generation.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.1, output_cost_per_1k: 0.2, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_audio: false, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ===== xAI Chat Models =====
  { id: 'grok-4.1-fast', provider: 'xai', name: 'Grok 4.1 Fast', type: 'chat', description: 'Latest fast Grok model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'grok-4.1-fast-reasoning', provider: 'xai', name: 'Grok 4.1 Fast Reasoning', type: 'chat', description: 'Fast reasoning-enhanced Grok.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.004, output_cost_per_1k: 0.012, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'grok-4.1-fast-non-reasoning', provider: 'xai', name: 'Grok 4.1 Fast Non-Reasoning', type: 'chat', description: 'Fast Grok without extended reasoning.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.008, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'grok-4-fast-reasoning', provider: 'xai', name: 'Grok 4 Fast Reasoning', type: 'chat', description: 'Reasoning-enhanced Grok 4.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'grok-4-fast-non-reasoning', provider: 'xai', name: 'Grok 4 Fast Non-Reasoning', type: 'chat', description: 'Fast Grok 4 for simple tasks.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'grok-4.0709', provider: 'xai', name: 'Grok 4.0709', type: 'chat', description: 'Stable Grok 4 release.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.004, output_cost_per_1k: 0.012, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'grok-code-fast-1', provider: 'xai', name: 'Grok Code Fast 1', type: 'chat', description: 'Optimized for code generation.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.003, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== xAI Image Models =====
  { id: 'grok-imagine', provider: 'xai', name: 'Grok Imagine', type: 'image', description: 'xAI image generation model.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.04, output_cost_per_1k: 0.08, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'medium', quality: 'high' },

  // ===== xAI Video Models =====
  { id: 'grok-imagine-video', provider: 'xai', name: 'Grok Imagine', type: 'video', description: 'xAI video generation model.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.08, output_cost_per_1k: 0.16, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_audio: false, supports_functions: false, speed: 'slow', quality: 'high' },

  // ===== DeepSeek Models (Chat Only) =====
  { id: 'deepseek-v3.2', provider: 'deepseek', name: 'DeepSeek V3.2', type: 'chat', description: 'Latest DeepSeek with enhanced capabilities.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00014, output_cost_per_1k: 0.00028, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'deepseek-v3.2-speciale', provider: 'deepseek', name: 'DeepSeek V3.2-Speciale', type: 'chat', description: 'Specialized DeepSeek variant.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00016, output_cost_per_1k: 0.00032, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'deepseek-v3.1', provider: 'deepseek', name: 'DeepSeek V3.1', type: 'chat', description: 'Strong reasoning DeepSeek model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00014, output_cost_per_1k: 0.00028, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Mistral Chat Models =====
  { id: 'mistral-large-3', provider: 'mistral', name: 'Mistral Large 3', type: 'chat', description: 'Most capable Mistral model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.008, output_cost_per_1k: 0.024, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'mistral-medium-3.1', provider: 'mistral', name: 'Mistral Medium 3.1', type: 'chat', description: 'Balanced Mistral model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'mistral-small-3.2', provider: 'mistral', name: 'Mistral Small 3.2', type: 'chat', description: 'Fast Mistral for simple tasks.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'ministral-3-14b', provider: 'mistral', name: 'Ministral 3 14B', type: 'chat', description: 'Efficient 14B parameter model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'ministral-3-8b', provider: 'mistral', name: 'Ministral 3 8B', type: 'chat', description: 'Efficient 8B parameter model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'ministral-3-3b', provider: 'mistral', name: 'Ministral 3 3B', type: 'chat', description: 'Lightweight 3B parameter model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00004, output_cost_per_1k: 0.00012, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'magistral-medium-1.2', provider: 'mistral', name: 'Magistral Medium 1.2', type: 'chat', description: 'Reasoning-focused Mistral.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.003, output_cost_per_1k: 0.009, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'magistral-small-1.2', provider: 'mistral', name: 'Magistral Small 1.2', type: 'chat', description: 'Fast reasoning model.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'mistral-nemo-12b', provider: 'mistral', name: 'Mistral Nemo 12B', type: 'chat', description: 'Efficient general-purpose model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0003, output_cost_per_1k: 0.0009, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Mistral Image Model =====
  { id: 'mistral-gan', provider: 'mistral', name: 'GAN', type: 'image', description: 'Mistral AI image generation via GAN.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.03, output_cost_per_1k: 0.06, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'pixtral-large', provider: 'mistral', name: 'Pixtral Large', type: 'vision', description: 'Vision and image understanding.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== Mistral Code Model =====
  { id: 'codestral', provider: 'mistral', name: 'Codestral', type: 'code', description: 'Optimized for code generation.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Mistral Audio Models =====
  { id: 'voxtral-small', provider: 'mistral', name: 'Voxtral Small', type: 'audio', description: 'Audio processing model.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'voxtral-mini', provider: 'mistral', name: 'Voxtral Mini', type: 'audio', description: 'Lightweight audio model.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: true, supports_functions: false, speed: 'fast', quality: 'standard' },

  // ===== Mistral Embedding Model =====
  { id: 'mistral-embed', provider: 'mistral', name: 'Mistral Embed', type: 'embedding', description: 'Text embeddings for search.', context_window: 8192, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'fast', quality: 'high' },

  // ===== Cohere Chat Models =====
  { id: 'command-a-03-2025', provider: 'cohere', name: 'Command A 03-2025', type: 'chat', description: 'Latest Command model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0025, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'command-a-reasoning-08-2025', provider: 'cohere', name: 'Command A Reasoning 08-2025', type: 'chat', description: 'Reasoning-enhanced Command.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.012, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'command-r-plus-08-2024', provider: 'cohere', name: 'Command R Plus 08-2024', type: 'chat', description: 'Enhanced retrieval model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0025, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== Cohere Vision Models =====
  { id: 'command-a-vision-07-2025', provider: 'cohere', name: 'Command A Vision 07-2025', type: 'vision', description: 'Vision-capable Command.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.012, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'c4ai-aya-vision-32b', provider: 'cohere', name: 'C4AI Aya Vision 32B', type: 'vision', description: 'Multilingual vision model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.008, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== Cohere Embedding Models =====
  { id: 'embed-v4.0', provider: 'cohere', name: 'Embed V4.0', type: 'embedding', description: 'Latest embedding model.', context_window: 8192, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'embed-english-v3.0', provider: 'cohere', name: 'Embed English V3.0', type: 'embedding', description: 'English-optimized embeddings.', context_window: 8192, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'embed-multilingual-v3.0', provider: 'cohere', name: 'Embed Multilingual V3.0', type: 'embedding', description: 'Multilingual embeddings.', context_window: 8192, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'fast', quality: 'high' },

  // ===== Cohere Rerank Model =====
  { id: 'rerank-v4.0-pro', provider: 'cohere', name: 'Rerank V4.0 Pro', type: 'rerank', description: 'Document reranking.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.002, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: false, speed: 'fast', quality: 'high' },

  // ===== Cohere Multilingual Chat =====
  { id: 'c4ai-aya-expanse-32b', provider: 'cohere', name: 'C4AI Aya Expanse 32B', type: 'chat', description: 'Multilingual chat model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.002, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_audio: false, supports_functions: true, speed: 'medium', quality: 'high' },

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

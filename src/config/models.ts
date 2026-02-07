// Canonical Model & Provider Configuration
// This is the SINGLE SOURCE OF TRUTH for all models and providers

// Provider type matches Supabase llm_provider enum
export type Provider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'mistral' | 'cohere' | 'together' | 'perplexity' | 'openrouter';

// Model type categories - TEXT + IMAGE + VIDEO ONLY (no audio)
export type ModelType = 'chat' | 'image' | 'video' | 'embedding' | 'code' | 'rerank' | 'vision';

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
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    color: 'hsl(260 70% 55%)',
    website: 'https://openrouter.ai',
    apiKeyUrl: 'https://openrouter.ai/keys',
    description: 'Unified API for 200+ AI models',
  },
};

// ============================================
// MODEL CONFIGURATIONS - Canonical definitions
// TEXT + IMAGE + VIDEO ONLY (no audio models)
// ============================================
export const MODEL_CONFIGS: ModelConfig[] = [
  // ========================================
  // OPENAI MODELS
  // ========================================
  // Chat Models
  { id: 'gpt-5.2', provider: 'openai', name: 'GPT-5.2', type: 'chat', description: 'Latest GPT-5.2 with enhanced reasoning.', context_window: 256000, max_output_tokens: 32768, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-5.2-pro', provider: 'openai', name: 'GPT-5.2 Pro', type: 'chat', description: 'Premium GPT-5.2 with maximum capabilities.', context_window: 256000, max_output_tokens: 65536, input_cost_per_1k: 0.02, output_cost_per_1k: 0.06, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'gpt-5', provider: 'openai', name: 'GPT-5', type: 'chat', description: 'Powerful all-rounder with excellent reasoning.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-5-mini', provider: 'openai', name: 'GPT-5 Mini', type: 'chat', description: 'Lower cost with strong performance.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gpt-5-nano', provider: 'openai', name: 'GPT-5 Nano', type: 'chat', description: 'Speed and cost optimized for simple tasks.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', type: 'chat', description: 'Flagship multimodal model with vision support.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', type: 'chat', description: 'Fast and affordable for everyday tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'GPT-4 Turbo', type: 'chat', description: 'Powerful with large context window.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'o3-pro', provider: 'openai', name: 'o3-pro', type: 'chat', description: 'Extended thinking with o3-pro reasoning.', context_window: 200000, max_output_tokens: 100000, input_cost_per_1k: 0.02, output_cost_per_1k: 0.08, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'o3-deep-research', provider: 'openai', name: 'o3-deep-research', type: 'chat', description: 'Deep research and analysis capabilities.', context_window: 200000, max_output_tokens: 100000, input_cost_per_1k: 0.025, output_cost_per_1k: 0.1, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  // User-specified canonical ID: o3-deep-search
  { id: 'o3-deep-search', provider: 'openai', name: 'o3-deep-search', type: 'chat', description: 'Deep search and retrieval capabilities.', context_window: 200000, max_output_tokens: 100000, input_cost_per_1k: 0.025, output_cost_per_1k: 0.1, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  // Image Models
  { id: 'gpt-image-1.5', provider: 'openai', name: 'GPT Image 1.5', type: 'image', description: 'Advanced image generation with GPT Image 1.5.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.04, output_cost_per_1k: 0.08, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_functions: false, speed: 'slow', quality: 'premium' },
  // Video Models
  { id: 'sora-2-pro', provider: 'openai', name: 'Sora 2 Pro', type: 'video', description: 'Advanced video generation with Sora 2 Pro.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.1, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ========================================
  // ANTHROPIC MODELS
  // ========================================
  { id: 'claude-opus-4.5', provider: 'anthropic', name: 'Claude Opus 4.5', type: 'chat', description: 'Most capable Claude with supreme reasoning.', context_window: 200000, max_output_tokens: 32768, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-sonnet-4.5', provider: 'anthropic', name: 'Claude Sonnet 4.5', type: 'chat', description: 'Best balance of intelligence and speed.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  // User-specified canonical ID: claude-haiku-4-5-20251001
  { id: 'claude-haiku-4-5-20251001', provider: 'anthropic', name: 'Claude Haiku 4.5', type: 'chat', description: 'Fastest Claude with excellent quality.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.004, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // User-specified canonical ID: claude-opus-4-1-20250805
  { id: 'claude-opus-4-1-20250805', provider: 'anthropic', name: 'Claude Opus 4.1', type: 'chat', description: 'Powerful Claude with enhanced reasoning.', context_window: 200000, max_output_tokens: 16384, input_cost_per_1k: 0.012, output_cost_per_1k: 0.06, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  // User-specified canonical ID: claude-sonnet-4-20250514
  { id: 'claude-sonnet-4-20250514', provider: 'anthropic', name: 'Claude Sonnet 4', type: 'chat', description: 'Balanced Claude 4 performance.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ========================================
  // GOOGLE MODELS
  // ========================================
  // Chat Models
  { id: 'gemini-3-pro', provider: 'google', name: 'Gemini 3 Pro', type: 'chat', description: 'Next-generation Gemini with advanced reasoning.', context_window: 2000000, max_output_tokens: 65536, input_cost_per_1k: 0.00625, output_cost_per_1k: 0.025, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gemini-3-flash', provider: 'google', name: 'Gemini 3 Flash', type: 'chat', description: 'Fast Gemini 3 for quick responses.', context_window: 1000000, max_output_tokens: 32768, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gemini-3-nano', provider: 'google', name: 'Gemini 3 Nano', type: 'chat', description: 'Lightweight Gemini for simple tasks.', context_window: 500000, max_output_tokens: 8192, input_cost_per_1k: 0.00005, output_cost_per_1k: 0.0002, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gemini-2.5-pro', provider: 'google', name: 'Gemini 2.5 Pro', type: 'chat', description: 'Advanced reasoning with huge context.', context_window: 2000000, max_output_tokens: 8192, input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  // User-specified canonical ID: gemini-2.5-flash
  { id: 'gemini-2.5-flash', provider: 'google', name: 'Gemini 2.5 Flash', type: 'chat', description: 'Balanced Gemini for most tasks.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // User-specified canonical ID: gemini-live-2.5-flash-native-audio (audio-only, will be disabled in UI)
  { id: 'gemini-live-2.5-flash-native-audio', provider: 'google', name: 'Gemini Live 2.5 Flash', type: 'chat', description: 'Real-time conversational Gemini (audio-only).', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // Image Models
  { id: 'nano-banana-pro', provider: 'google', name: 'Nano Banana Pro', type: 'image', description: 'Advanced image generation with Imagen 3.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.04, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_functions: false, speed: 'medium', quality: 'premium' },
  // Video Models
  { id: 'veo-3.1', provider: 'google', name: 'Veo 3.1', type: 'video', description: 'Advanced video generation with Veo.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.1, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ========================================
  // XAI MODELS
  // ========================================
  // Chat Models
  { id: 'grok-4.1-fast', provider: 'xai', name: 'Grok 4.1 Fast', type: 'chat', description: 'Latest Grok with fast responses.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.01, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // User-specified canonical ID: xai.grok-4.1-fast-reasoning
  { id: 'xai.grok-4.1-fast-reasoning', provider: 'xai', name: 'Grok 4.1 Fast Reasoning', type: 'chat', description: 'Grok 4.1 with enhanced reasoning mode.', context_window: 131072, max_output_tokens: 16384, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  // User-specified canonical ID: xai.grok-4.1-fast-non-reasoning
  { id: 'xai.grok-4.1-fast-non-reasoning', provider: 'xai', name: 'Grok 4.1 Fast Non-Reasoning', type: 'chat', description: 'Grok 4.1 optimized for speed.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.0015, output_cost_per_1k: 0.008, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'grok-code-fast-1', provider: 'xai', name: 'Grok Code Fast 1', type: 'code', description: 'Specialized for code generation.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'grok-4-fast-reasoning', provider: 'xai', name: 'Grok 4 Fast Reasoning', type: 'chat', description: 'Grok 4 with reasoning capabilities.', context_window: 131072, max_output_tokens: 16384, input_cost_per_1k: 0.0025, output_cost_per_1k: 0.012, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'grok-4-fast-non-reasoning', provider: 'xai', name: 'Grok 4 Fast Non-Reasoning', type: 'chat', description: 'Grok 4 optimized for speed.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.0012, output_cost_per_1k: 0.006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // User-specified canonical ID: grok-4-0709
  { id: 'grok-4-0709', provider: 'xai', name: 'Grok 4', type: 'chat', description: 'Grok 4 July 2024 release.', context_window: 131072, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.01, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  // Image Models
  { id: 'grok-imagine', provider: 'xai', name: 'Grok Imagine', type: 'image', description: 'Grok-powered image generation.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.04, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_functions: false, speed: 'medium', quality: 'high' },
  // Video Models
  { id: 'grok-imagine-video', provider: 'xai', name: 'Grok Imagine Video', type: 'video', description: 'Grok-powered video generation.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.1, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_functions: false, speed: 'slow', quality: 'high' },

  // ========================================
  // DEEPSEEK MODELS
  // ========================================
  { id: 'deepseek-v3.2', provider: 'deepseek', name: 'DeepSeek V3.2', type: 'chat', description: 'Latest DeepSeek with enhanced capabilities.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00014, output_cost_per_1k: 0.00028, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  // User-specified canonical ID: deepseek-v3.2-speciale
  { id: 'deepseek-v3.2-speciale', provider: 'deepseek', name: 'DeepSeek V3.2-Speciale', type: 'chat', description: 'DeepSeek V3.2 with specialized reasoning.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00028, output_cost_per_1k: 0.00056, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'deepseek-v3.1', provider: 'deepseek', name: 'DeepSeek V3.1', type: 'chat', description: 'DeepSeek V3.1 general model.', context_window: 64000, max_output_tokens: 8192, input_cost_per_1k: 0.00014, output_cost_per_1k: 0.00028, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ========================================
  // MISTRAL MODELS
  // ========================================
  // Chat Models
  // User-specified canonical ID: mistral-large-25-12
  { id: 'mistral-large-25-12', provider: 'mistral', name: 'Mistral Large 3', type: 'chat', description: 'Most capable Mistral model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'mistral-medium-3.1', provider: 'mistral', name: 'Mistral Medium 3.1', type: 'chat', description: 'Balanced Mistral for most tasks.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  // User-specified canonical ID: mistral-small-2506
  { id: 'mistral-small-2506', provider: 'mistral', name: 'Mistral Small 3.2', type: 'chat', description: 'Fast Mistral for simple tasks.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'ministral-3-14b', provider: 'mistral', name: 'Ministral 3 (14B)', type: 'chat', description: 'Ministral 14B variant.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00018, output_cost_per_1k: 0.00054, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'ministral-3-8b', provider: 'mistral', name: 'Ministral 3 (8B)', type: 'chat', description: 'Ministral 8B variant.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'ministral-3-3b', provider: 'mistral', name: 'Ministral 3 (3B)', type: 'chat', description: 'Ministral 3B lightweight variant.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00004, output_cost_per_1k: 0.00012, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  // User-specified canonical IDs: magistral-medium-2509, magistral-small-2509
  { id: 'magistral-medium-2509', provider: 'mistral', name: 'Magistral Medium 1.2', type: 'chat', description: 'Magistral for extended reasoning.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'magistral-small-2509', provider: 'mistral', name: 'Magistral Small 1.2', type: 'chat', description: 'Smaller Magistral variant.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'codestral', provider: 'mistral', name: 'Codestral', type: 'code', description: 'Optimized for code generation.', context_window: 32000, max_output_tokens: 8192, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // User-specified canonical ID: mistralai/Mistral-Nemo-Instruct-2407
  { id: 'mistralai/Mistral-Nemo-Instruct-2407', provider: 'mistral', name: 'Mistral Nemo 12B', type: 'chat', description: 'Efficient 12B parameter model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.00015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'mistral-embed', provider: 'mistral', name: 'Mistral Embed', type: 'embedding', description: 'Text embeddings model.', context_window: 8192, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: false, speed: 'fast', quality: 'high' },
  // Image Models - REMOVED: mistral-gan, mistral-gan-flux, flux-2-pro, grok-imaginegan (invalid model IDs)

  // ========================================
  // TOGETHER.AI MODELS
  // ========================================
  // Chat Models
  // User-specified canonical IDs: meta-llama/Llama-3.3-70B-Instruct, meta-llama/Llama-4-Maverick-17B-128E, meta-llama/Llama-4-Scout-17B-16E
  { id: 'meta-llama/Llama-3.3-70B-Instruct', provider: 'together', name: 'Llama 3.3 70B Instruct Turbo', type: 'chat', description: 'Fast Llama 3.3 70B.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0009, output_cost_per_1k: 0.0009, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'meta-llama/Llama-4-Maverick-17B-128E', provider: 'together', name: 'Llama 4 Maverick 17Bx128E', type: 'chat', description: 'MoE Llama 4 variant.', context_window: 256000, max_output_tokens: 16384, input_cost_per_1k: 0.0012, output_cost_per_1k: 0.0012, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'meta-llama/Llama-4-Scout-17B-16E', provider: 'together', name: 'Llama 4 Scout 17Bx16E', type: 'chat', description: 'Lightweight Llama 4 MoE.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.0008, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // User-specified canonical ID: Qwen3-235B-A22B-Instruct-2507
  { id: 'Qwen3-235B-A22B-Instruct-2507', provider: 'together', name: 'Qwen3 235B-A22B Instruct', type: 'chat', description: 'Large Qwen3 MoE model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0015, output_cost_per_1k: 0.0015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'deepseek-v3.1-together', provider: 'together', name: 'DeepSeek V3.1', type: 'chat', description: 'DeepSeek via Together.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.0008, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  // Image Models
  { id: 'flux-together', provider: 'together', name: 'Flux', type: 'image', description: 'Together.ai Flux image generation.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.04, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: true, supports_video_generation: false, supports_functions: false, speed: 'medium', quality: 'premium' },
  // Video Models
  { id: 'stable-video-together', provider: 'together', name: 'Stable Video', type: 'video', description: 'Together.ai Stable Video Diffusion.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.08, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: true, supports_functions: false, speed: 'slow', quality: 'premium' },

  // ========================================
  // COHERE MODELS
  // ========================================
  // Chat Models
  { id: 'command-a-03-2025', provider: 'cohere', name: 'Command A 03-2025', type: 'chat', description: 'Latest Command A model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0025, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'command-a-reasoning-08-2025', provider: 'cohere', name: 'Command A Reasoning 08-2025', type: 'chat', description: 'Command A with enhanced reasoning.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.012, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'command-a-vision-07-2025', provider: 'cohere', name: 'Command A Vision 07-2025', type: 'vision', description: 'Command A with vision capabilities.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.012, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'command-a-translate-08-2025', provider: 'cohere', name: 'Command A Translate 08-2025', type: 'chat', description: 'Specialized for translation.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.008, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'command-r-plus-08-2024', provider: 'cohere', name: 'Command R Plus 08-2024', type: 'chat', description: 'Most capable Command R model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0025, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  // Embedding Models
  { id: 'embed-v4.0', provider: 'cohere', name: 'Embed V4.0', type: 'embedding', description: 'Latest embedding model.', context_window: 8192, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: false, speed: 'fast', quality: 'premium' },
  { id: 'embed-english-v3.0', provider: 'cohere', name: 'Embed English V3.0', type: 'embedding', description: 'English-optimized embeddings.', context_window: 512, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: false, speed: 'fast', quality: 'high' },
  { id: 'embed-multilingual-v3.0', provider: 'cohere', name: 'Embed Multilingual V3.0', type: 'embedding', description: 'Multilingual embeddings.', context_window: 512, max_output_tokens: 0, input_cost_per_1k: 0.0001, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: false, speed: 'fast', quality: 'high' },
  // Rerank Models
  { id: 'rerank-v4.0-pro', provider: 'cohere', name: 'Rerank V4.0 Pro', type: 'rerank', description: 'Document reranking model.', context_window: 4096, max_output_tokens: 0, input_cost_per_1k: 0.002, output_cost_per_1k: 0, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: false, speed: 'fast', quality: 'premium' },
  // Aya Models
  { id: 'c4ai-aya-expanse-32b', provider: 'cohere', name: 'C4AI Aya Expanse 32B', type: 'chat', description: 'Multilingual open model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'c4ai-aya-vision-32b', provider: 'cohere', name: 'C4AI Aya Vision 32B', type: 'vision', description: 'Multilingual vision model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0006, output_cost_per_1k: 0.0018, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ========================================
  // PERPLEXITY MODELS
  // ========================================
  { id: 'sonar-large-online', provider: 'perplexity', name: 'Sonar Large Online', type: 'chat', description: 'Real-time web search.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'pplx-70b', provider: 'perplexity', name: 'Pplx-70b', type: 'chat', description: 'Perplexity 70B model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gpt-5.1-pplx', provider: 'perplexity', name: 'GPT-5.1', type: 'chat', description: 'GPT-5.1 via Perplexity.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'claude-sonnet-4.5-pplx', provider: 'perplexity', name: 'Claude Sonnet 4.5', type: 'chat', description: 'Claude via Perplexity.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'claude-opus-4.1-thinking-pplx', provider: 'perplexity', name: 'Claude Opus 4.1 Thinking', type: 'chat', description: 'Claude Opus with extended thinking.', context_window: 200000, max_output_tokens: 32768, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'gemini-3-pro-pplx', provider: 'perplexity', name: 'Gemini 3 Pro', type: 'chat', description: 'Gemini via Perplexity.', context_window: 2000000, max_output_tokens: 65536, input_cost_per_1k: 0.00625, output_cost_per_1k: 0.025, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'grok-4.1-pplx', provider: 'perplexity', name: 'Grok 4.1', type: 'chat', description: 'Grok via Perplexity.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'kimi-k2-pplx', provider: 'perplexity', name: 'Kimi K2', type: 'chat', description: 'Kimi K2 via Perplexity.', context_window: 256000, max_output_tokens: 16384, input_cost_per_1k: 0.002, output_cost_per_1k: 0.006, supports_vision: false, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'o3-pro-pplx', provider: 'perplexity', name: 'o3-pro', type: 'chat', description: 'o3-pro via Perplexity.', context_window: 200000, max_output_tokens: 100000, input_cost_per_1k: 0.02, output_cost_per_1k: 0.08, supports_vision: true, supports_image_generation: false, supports_video_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
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

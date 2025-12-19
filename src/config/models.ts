// Canonical Model & Provider Configuration
// This is the SINGLE SOURCE OF TRUTH for all models and providers

export type Provider = 'openai' | 'anthropic' | 'google' | 'cohere' | 'mistral' | 'perplexity' | 'xai' | 'meta';

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
  context_window: number;
  max_output_tokens: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  supports_vision: boolean;
  supports_image_generation: boolean;
  supports_functions: boolean;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'premium';
}

// ============================================
// PROVIDERS - Canonical definitions
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

// ============================================
// MODEL CONFIGURATIONS - Canonical definitions
// ============================================
export const MODEL_CONFIGS: ModelConfig[] = [
  // ===== OpenAI Models =====
  // Text / Reasoning
  { id: 'gpt-5', provider: 'openai', name: 'GPT-5', description: 'Most advanced OpenAI model with superior reasoning.', context_window: 256000, max_output_tokens: 32768, input_cost_per_1k: 0.03, output_cost_per_1k: 0.06, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-5-mini', provider: 'openai', name: 'GPT-5 Mini', description: 'Faster GPT-5 variant for quick tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.01, output_cost_per_1k: 0.02, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gpt-4.1', provider: 'openai', name: 'GPT-4.1', description: 'Updated GPT-4 with improved capabilities.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', description: 'Flagship multimodal model. Great for complex tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', description: 'Fast and affordable. Best for simple tasks.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'GPT-4 Turbo', description: 'Powerful with large context window.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  // Image Generation
  { id: 'gpt-image-1', provider: 'openai', name: 'GPT Image 1', description: 'Advanced image generation model.', context_window: 32000, max_output_tokens: 4096, input_cost_per_1k: 0.04, output_cost_per_1k: 0.08, supports_vision: false, supports_image_generation: true, supports_functions: false, speed: 'slow', quality: 'premium' },
  { id: 'dall-e-3', provider: 'openai', name: 'DALL-E 3', description: 'High-quality image generation.', context_window: 4096, max_output_tokens: 4096, input_cost_per_1k: 0.04, output_cost_per_1k: 0.08, supports_vision: false, supports_image_generation: true, supports_functions: false, speed: 'slow', quality: 'premium' },
  // Reasoning
  { id: 'o1-preview', provider: 'openai', name: 'o1 Preview', description: 'Advanced reasoning model for complex problems.', context_window: 128000, max_output_tokens: 32768, input_cost_per_1k: 0.015, output_cost_per_1k: 0.06, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'o1-mini', provider: 'openai', name: 'o1 Mini', description: 'Faster reasoning model.', context_window: 128000, max_output_tokens: 16384, input_cost_per_1k: 0.003, output_cost_per_1k: 0.012, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== Anthropic Models =====
  { id: 'claude-3.5-sonnet', provider: 'anthropic', name: 'Claude 3.5 Sonnet', description: 'Best balance of intelligence and speed.', context_window: 200000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'premium' },
  { id: 'claude-3.5-haiku', provider: 'anthropic', name: 'Claude 3.5 Haiku', description: 'Fastest 3.5 variant.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'claude-3-opus', provider: 'anthropic', name: 'Claude 3 Opus', description: 'Exceptional reasoning and analysis.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'claude-3-sonnet', provider: 'anthropic', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'claude-3-haiku', provider: 'anthropic', name: 'Claude 3 Haiku', description: 'Fastest Claude model.', context_window: 200000, max_output_tokens: 4096, input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },

  // ===== Google Models =====
  { id: 'gemini-1.5-pro', provider: 'google', name: 'Gemini 1.5 Pro', description: 'Million token context window.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'gemini-1.5-flash', provider: 'google', name: 'Gemini 1.5 Flash', description: 'Fast and efficient 1.5.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'gemini-2.0-flash', provider: 'google', name: 'Gemini 2.0 Flash', description: 'Latest fast multimodal.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.0001, output_cost_per_1k: 0.0004, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
  { id: 'gemini-2.5-pro', provider: 'google', name: 'Gemini 2.5 Pro', description: 'Latest flagship with advanced reasoning.', context_window: 2000000, max_output_tokens: 8192, input_cost_per_1k: 0.00625, output_cost_per_1k: 0.025, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'gemini-2.5-flash', provider: 'google', name: 'Gemini 2.5 Flash', description: 'Fast Gemini 2.5 variant.', context_window: 1000000, max_output_tokens: 8192, input_cost_per_1k: 0.00075, output_cost_per_1k: 0.003, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Perplexity Models =====
  { id: 'pplx-70b-online', provider: 'perplexity', name: 'Perplexity 70B Online', description: 'Search-augmented responses.', context_window: 32768, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.001, supports_vision: false, supports_image_generation: false, supports_functions: false, speed: 'medium', quality: 'high' },
  { id: 'pplx-7b-online', provider: 'perplexity', name: 'Perplexity 7B Online', description: 'Fast search-augmented model.', context_window: 32768, max_output_tokens: 4096, input_cost_per_1k: 0.0002, output_cost_per_1k: 0.0002, supports_vision: false, supports_image_generation: false, supports_functions: false, speed: 'fast', quality: 'standard' },
  { id: 'sonar-pro', provider: 'perplexity', name: 'Sonar Pro', description: 'Multi-step reasoning with citations.', context_window: 127000, max_output_tokens: 8192, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },

  // ===== xAI Models =====
  { id: 'grok-3', provider: 'xai', name: 'Grok 3', description: 'Most capable xAI model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'grok-2', provider: 'xai', name: 'Grok 2', description: 'Balanced xAI model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.002, output_cost_per_1k: 0.01, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'grok-vision', provider: 'xai', name: 'Grok Vision', description: 'Vision-capable Grok.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },

  // ===== Mistral Models =====
  { id: 'mistral-large', provider: 'mistral', name: 'Mistral Large', description: 'Most capable Mistral model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.004, output_cost_per_1k: 0.012, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'mistral-medium', provider: 'mistral', name: 'Mistral Medium', description: 'Balanced performance.', context_window: 32768, max_output_tokens: 4096, input_cost_per_1k: 0.0027, output_cost_per_1k: 0.0081, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'high' },
  { id: 'mistral-small', provider: 'mistral', name: 'Mistral Small', description: 'Fast and efficient.', context_window: 32768, max_output_tokens: 4096, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'standard' },
  { id: 'pixtral-12b', provider: 'mistral', name: 'Pixtral 12B', description: 'Vision-capable Mistral.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0015, output_cost_per_1k: 0.0015, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Meta Models =====
  { id: 'llama-3.3-70b', provider: 'meta', name: 'LLaMA 3.3 70B', description: 'Latest flagship open model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.00059, output_cost_per_1k: 0.00079, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'llama-3.2-90b-vision', provider: 'meta', name: 'LLaMA 3.2 90B Vision', description: 'Multimodal with vision support.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.0009, output_cost_per_1k: 0.0009, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'slow', quality: 'premium' },
  { id: 'llama-3.2-11b-vision', provider: 'meta', name: 'LLaMA 3.2 11B Vision', description: 'Compact vision model.', context_window: 128000, max_output_tokens: 8192, input_cost_per_1k: 0.000055, output_cost_per_1k: 0.000055, supports_vision: true, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },

  // ===== Cohere Models =====
  { id: 'command-r-plus', provider: 'cohere', name: 'Command R+', description: 'Most capable Cohere model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'medium', quality: 'premium' },
  { id: 'command-r', provider: 'cohere', name: 'Command R', description: 'Balanced RAG model.', context_window: 128000, max_output_tokens: 4096, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015, supports_vision: false, supports_image_generation: false, supports_functions: true, speed: 'fast', quality: 'high' },
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

// Model Configuration hooks - Data-driven model/provider abstraction
// These hooks provide access to model configurations without hardcoding

import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  MODEL_CONFIGS, 
  PROVIDERS, 
  getModelConfig, 
  getProviderInfo,
  getModelsByProvider,
  getChatModels,
  getImageModels,
  getVideoModels,
  type ModelConfig, 
  type Provider, 
  type ProviderInfo,
  type ModelType
} from '@/config/models';

/**
 * Get the model configuration for a specific block
 */
export function useBlockModelConfig(blockId: string | undefined): ModelConfig | undefined {
  const { blocks } = useAppStore();

  return useMemo(() => {
    if (!blockId) return undefined;
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return undefined;
    return getModelConfig(block.model_id);
  }, [blocks, blockId]);
}

/**
 * Get all available model configurations
 */
export function useAvailableModels(): ModelConfig[] {
  return MODEL_CONFIGS;
}

/**
 * Get chat models only
 */
export function useChatModels(): ModelConfig[] {
  return useMemo(() => getChatModels(), []);
}

/**
 * Get image generation models
 */
export function useImageModels(): ModelConfig[] {
  return useMemo(() => getImageModels(), []);
}

/**
 * Get video generation models
 */
export function useVideoModels(): ModelConfig[] {
  return useMemo(() => getVideoModels(), []);
}

/**
 * Get models grouped by provider
 */
export function useModelsGroupedByProvider(): Record<Provider, ModelConfig[]> {
  return useMemo(() => {
    const grouped: Record<Provider, ModelConfig[]> = {
      openai: [],
      anthropic: [],
      google: [],
      xai: [],
      deepseek: [],
      mistral: [],
      cohere: [],
      together: [],
      perplexity: [],
    };

    MODEL_CONFIGS.forEach((model) => {
      grouped[model.provider].push(model);
    });

    return grouped;
  }, []);
}

/**
 * Get all models grouped by type (chat, image, video, etc.)
 * NOTE: No audio type - system is TEXT + IMAGE + VIDEO only
 */
export function useModelsGroupedByType(): Record<ModelType, ModelConfig[]> {
  return useMemo(() => {
    const grouped: Record<ModelType, ModelConfig[]> = {
      chat: [],
      image: [],
      video: [],
      embedding: [],
      code: [],
      rerank: [],
      vision: [],
    };

    MODEL_CONFIGS.forEach((model) => {
      if (grouped[model.type]) {
        grouped[model.type].push(model);
      }
    });

    return grouped;
  }, []);
}

/**
 * Get models grouped by type AND provider (for the model selector)
 * Returns { chat: { openai: [...], anthropic: [...], ... }, image: { ... }, ... }
 */
export function useModelsGroupedByTypeAndProvider(): {
  chat: Record<Provider, ModelConfig[]>;
  image: Record<Provider, ModelConfig[]>;
  video: Record<Provider, ModelConfig[]>;
} {
  return useMemo(() => {
    const createProviderRecord = (): Record<Provider, ModelConfig[]> => ({
      openai: [],
      anthropic: [],
      google: [],
      xai: [],
      deepseek: [],
      mistral: [],
      cohere: [],
      together: [],
      perplexity: [],
    });

    const result = {
      chat: createProviderRecord(),
      image: createProviderRecord(),
      video: createProviderRecord(),
    };

    MODEL_CONFIGS.forEach((model) => {
      if (model.type === 'chat' || model.type === 'image' || model.type === 'video') {
        result[model.type][model.provider].push(model);
      }
    });

    return result;
  }, []);
}

/**
 * Get chat models grouped by provider
 */
export function useChatModelsGroupedByProvider(): Record<Provider, ModelConfig[]> {
  return useMemo(() => {
    const grouped: Record<Provider, ModelConfig[]> = {
      openai: [],
      anthropic: [],
      google: [],
      xai: [],
      deepseek: [],
      mistral: [],
      cohere: [],
      together: [],
      perplexity: [],
    };

    getChatModels().forEach((model) => {
      grouped[model.provider].push(model);
    });

    return grouped;
  }, []);
}

/**
 * Get all available providers
 */
export function useAvailableProviders(): ProviderInfo[] {
  return useMemo(() => Object.values(PROVIDERS), []);
}

/**
 * Get provider info by ID
 */
export function useProviderInfo(provider: Provider): ProviderInfo {
  return getProviderInfo(provider);
}

/**
 * Get models for a specific provider
 */
export function useProviderModels(provider: Provider): ModelConfig[] {
  return useMemo(() => getModelsByProvider(provider), [provider]);
}

/**
 * Format model cost for display
 */
export function formatModelCost(model: ModelConfig): string {
  const inputCost = model.input_cost_per_1k;
  const outputCost = model.output_cost_per_1k;
  
  if (inputCost < 0.001) {
    return `$${(inputCost * 1000).toFixed(2)}/M in · $${(outputCost * 1000).toFixed(2)}/M out`;
  }
  return `$${inputCost.toFixed(4)}/K in · $${outputCost.toFixed(4)}/K out`;
}

/**
 * Format context window for display
 */
export function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(0)}M tokens`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K tokens`;
  }
  return `${tokens} tokens`;
}

/**
 * Get speed label with color
 */
export function getSpeedBadge(speed: ModelConfig['speed']): { label: string; color: string } {
  switch (speed) {
    case 'fast':
      return { label: 'Fast', color: 'hsl(142 70% 45%)' };
    case 'medium':
      return { label: 'Medium', color: 'hsl(45 90% 50%)' };
    case 'slow':
      return { label: 'Slow', color: 'hsl(0 70% 50%)' };
  }
}

/**
 * Get quality label with color
 */
export function getQualityBadge(quality: ModelConfig['quality']): { label: string; color: string } {
  switch (quality) {
    case 'standard':
      return { label: 'Standard', color: 'hsl(var(--muted-foreground))' };
    case 'high':
      return { label: 'High', color: 'hsl(217 90% 60%)' };
    case 'premium':
      return { label: 'Premium', color: 'hsl(280 70% 60%)' };
  }
}

/**
 * Get model type label with color
 * NOTE: No audio type - system is TEXT + IMAGE + VIDEO only
 */
export function getModelTypeBadge(type: ModelType): { label: string; color: string } {
  switch (type) {
    case 'chat':
      return { label: 'Chat', color: 'hsl(142 70% 45%)' };
    case 'image':
      return { label: 'Image', color: 'hsl(280 70% 55%)' };
    case 'video':
      return { label: 'Video', color: 'hsl(24 90% 55%)' };
    case 'embedding':
      return { label: 'Embedding', color: 'hsl(45 90% 50%)' };
    case 'code':
      return { label: 'Code', color: 'hsl(217 90% 60%)' };
    case 'rerank':
      return { label: 'Rerank', color: 'hsl(180 70% 45%)' };
    case 'vision':
      return { label: 'Vision', color: 'hsl(35 90% 55%)' };
    default:
      return { label: type, color: 'hsl(var(--muted-foreground))' };
  }
}

/**
 * Check if a model supports a specific feature
 * NOTE: No audio support - system is TEXT + IMAGE + VIDEO only
 */
export function useModelCapabilities(modelId: string | undefined) {
  return useMemo(() => {
    if (!modelId) {
      return {
        supportsVision: false,
        supportsFunctions: false,
        supportsImageGeneration: false,
        supportsVideoGeneration: false,
        contextWindow: 0,
        maxOutput: 0,
        type: 'chat' as ModelType,
      };
    }

    const model = getModelConfig(modelId);
    if (!model) {
      return {
        supportsVision: false,
        supportsFunctions: false,
        supportsImageGeneration: false,
        supportsVideoGeneration: false,
        contextWindow: 0,
        maxOutput: 0,
        type: 'chat' as ModelType,
      };
    }

    return {
      supportsVision: model.supports_vision,
      supportsFunctions: model.supports_functions,
      supportsImageGeneration: model.supports_image_generation,
      supportsVideoGeneration: model.supports_video_generation,
      contextWindow: model.context_window,
      maxOutput: model.max_output_tokens,
      type: model.type,
    };
  }, [modelId]);
}

/**
 * Estimate cost for a given number of tokens
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelConfig(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1000) * model.input_cost_per_1k;
  const outputCost = (outputTokens / 1000) * model.output_cost_per_1k;
  
  return inputCost + outputCost;
}

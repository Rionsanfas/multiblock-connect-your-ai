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
  type ModelConfig, 
  type Provider, 
  type ProviderInfo 
} from '@/types';

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
 * Get models grouped by provider
 */
export function useModelsGroupedByProvider(): Record<Provider, ModelConfig[]> {
  return useMemo(() => {
    const grouped: Record<Provider, ModelConfig[]> = {
      openai: [],
      anthropic: [],
      google: [],
      perplexity: [],
      xai: [],
    };

    MODEL_CONFIGS.forEach((model) => {
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
 * Check if a model supports a specific feature
 */
export function useModelCapabilities(modelId: string | undefined) {
  return useMemo(() => {
    if (!modelId) {
      return {
        supportsVision: false,
        supportsFunctions: false,
        contextWindow: 0,
        maxOutput: 0,
      };
    }

    const model = getModelConfig(modelId);
    if (!model) {
      return {
        supportsVision: false,
        supportsFunctions: false,
        contextWindow: 0,
        maxOutput: 0,
      };
    }

    return {
      supportsVision: model.supports_vision,
      supportsFunctions: model.supports_functions,
      contextWindow: model.context_window,
      maxOutput: model.max_output_tokens,
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

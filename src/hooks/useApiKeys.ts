import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiKeysDb } from '@/lib/database';
import type { LLMProvider, ApiKeyDisplay } from '@/types/database.types';

// Supported providers that match Supabase llm_provider enum
export const SUPPORTED_PROVIDERS: LLMProvider[] = ['openai', 'anthropic', 'google', 'xai', 'deepseek', 'mistral', 'cohere', 'groq', 'together', 'perplexity'];

/**
 * Get all API keys for the current user from Supabase
 */
export function useUserApiKeys(): { keys: ApiKeyDisplay[]; isLoading: boolean; error: Error | null } {
  const { user, isAuthenticated } = useAuth();
  
  const { data: keys = [], isLoading, error } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: () => apiKeysDb.getAll(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
  
  return { keys, isLoading, error: error as Error | null };
}

/**
 * Get API keys grouped by provider
 */
export function useApiKeysByProvider(): Record<LLMProvider, ApiKeyDisplay[]> {
  const { keys } = useUserApiKeys();
  
  return useMemo(() => {
    const grouped: Record<LLMProvider, ApiKeyDisplay[]> = {
      openai: [],
      anthropic: [],
      google: [],
      xai: [],
      deepseek: [],
      mistral: [],
      cohere: [],
      groq: [],
      together: [],
      perplexity: [],
    };
    
    keys.forEach((key) => {
      if (grouped[key.provider]) {
        grouped[key.provider].push(key);
      }
    });
    
    return grouped;
  }, [keys]);
}

/**
 * Check if user has an API key for a provider
 */
export function useHasValidKey(provider: LLMProvider): boolean {
  const { keys } = useUserApiKeys();
  return useMemo(() => keys.some((k) => k.provider === provider && k.is_valid !== false), [keys, provider]);
}

/**
 * Get providers that have API keys configured
 */
export function useConfiguredProviders(): LLMProvider[] {
  const { keys } = useUserApiKeys();
  
  return useMemo(() => {
    const providers = new Set<LLMProvider>();
    keys.forEach((k) => {
      if (k.is_valid !== false) {
        providers.add(k.provider);
      }
    });
    return Array.from(providers);
  }, [keys]);
}

/**
 * Get providers that are missing API keys
 */
export function useMissingProviders(): LLMProvider[] {
  const configuredProviders = useConfiguredProviders();
  
  return useMemo(() => {
    return SUPPORTED_PROVIDERS.filter((p) => !configuredProviders.includes(p));
  }, [configuredProviders]);
}

/**
 * Get API key stats
 */
export function useApiKeyStats() {
  const { keys, isLoading } = useUserApiKeys();
  
  return useMemo(() => {
    const totalKeys = keys.length;
    const validKeys = keys.filter((k) => k.is_valid !== false).length;
    const providersConfigured = new Set(keys.map((k) => k.provider)).size;
    
    return {
      isLoading,
      totalKeys,
      validKeys,
      invalidKeys: totalKeys - validKeys,
      providersConfigured,
    };
  }, [keys, isLoading]);
}

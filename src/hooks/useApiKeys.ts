import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { ApiKey, Provider } from '@/types';

// ============================================
// API KEY HOOKS
// ============================================

/**
 * Get all API keys for the current user
 */
export function useUserApiKeys(): ApiKey[] {
  const user = useAppStore((s) => s.user);
  const apiKeys = useAppStore((s) => s.apiKeys);
  
  return useMemo(() => {
    if (!user) return [];
    return apiKeys.filter((k) => k.user_id === user.id);
  }, [user, apiKeys]);
}

/**
 * Get API keys grouped by provider
 */
export function useApiKeysByProvider(): Record<Provider, ApiKey[]> {
  const keys = useUserApiKeys();
  
  return useMemo(() => {
    const grouped: Record<Provider, ApiKey[]> = {
      openai: [],
      anthropic: [],
      google: [],
      cohere: [],
      mistral: [],
      meta: [],
      perplexity: [],
      xai: [],
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
 * Get the default API key for a specific provider
 * Keys are considered valid by default - validation happens at runtime
 */
export function useDefaultApiKey(provider: Provider): ApiKey | undefined {
  const keys = useUserApiKeys();
  
  return useMemo(() => {
    // First try to find a default key that's marked valid
    const defaultValid = keys.find((k) => k.provider === provider && k.is_default && k.is_valid);
    if (defaultValid) return defaultValid;
    
    // Then try any key for this provider (consider keys valid by default)
    return keys.find((k) => k.provider === provider && k.is_default) || 
           keys.find((k) => k.provider === provider);
  }, [keys, provider]);
}

/**
 * Check if user has an API key for a provider
 * Keys are considered valid by default - actual validation happens at runtime when used
 */
export function useHasValidKey(provider: Provider): boolean {
  const keys = useUserApiKeys();
  // Consider any key for the provider as valid - runtime validation will verify
  return useMemo(() => keys.some((k) => k.provider === provider), [keys, provider]);
}

/**
 * Get providers that have API keys configured
 */
export function useConfiguredProviders(): Provider[] {
  const keys = useUserApiKeys();
  
  return useMemo(() => {
    const providers = new Set<Provider>();
    keys.forEach((k) => {
      providers.add(k.provider);
    });
    return Array.from(providers);
  }, [keys]);
}

/**
 * Get providers that are missing API keys
 */
export function useMissingProviders(): Provider[] {
  const configuredProviders = useConfiguredProviders();
  const allProviders: Provider[] = ['openai', 'anthropic', 'google', 'cohere', 'mistral', 'meta', 'perplexity', 'xai'];
  
  return useMemo(() => {
    return allProviders.filter((p) => !configuredProviders.includes(p));
  }, [configuredProviders]);
}

/**
 * API Key actions hook
 */
export function useApiKeyActions() {
  const addApiKey = useAppStore((s) => s.addApiKey);
  const updateApiKey = useAppStore((s) => s.updateApiKey);
  const removeApiKey = useAppStore((s) => s.removeApiKey);
  
  return { addApiKey, updateApiKey, removeApiKey };
}

/**
 * Get API key usage stats
 */
export function useApiKeyStats() {
  const keys = useUserApiKeys();
  
  return useMemo(() => {
    const totalKeys = keys.length;
    const validKeys = keys.filter((k) => k.is_valid).length;
    const totalUsage = keys.reduce((sum, k) => sum + k.usage_count, 0);
    const providersConfigured = new Set(keys.map((k) => k.provider)).size;
    
    return {
      totalKeys,
      validKeys,
      invalidKeys: totalKeys - validKeys,
      totalUsage,
      providersConfigured,
    };
  }, [keys]);
}

/**
 * Get the API key ID to use for a given provider (for block references)
 */
export function useApiKeyIdForProvider(provider: Provider): string | undefined {
  const defaultKey = useDefaultApiKey(provider);
  return defaultKey?.id;
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useHasValidKey } from './useApiKeys';

export interface OpenRouterModel {
  id: string; // e.g. "openai/gpt-4o"
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
    image: string;
  };
  top_provider: any;
  architecture: any;
}

/**
 * Fetch available models from OpenRouter API via our edge function.
 * Only fetches when user has a valid OpenRouter API key.
 */
export function useOpenRouterModels() {
  const { isAuthenticated } = useAuth();
  const hasOpenRouterKey = useHasValidKey('openrouter' as any);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['openrouter-models'],
    queryFn: async (): Promise<OpenRouterModel[]> => {
      const { data: result, error } = await supabase.functions.invoke('openrouter-models');
      if (error) {
        console.error('[useOpenRouterModels] Error:', error);
        return [];
      }
      return result?.models || [];
    },
    enabled: isAuthenticated && hasOpenRouterKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  return {
    models: data || [],
    isLoading,
    error,
    refetch,
    hasKey: hasOpenRouterKey,
  };
}

/**
 * API Key Service - Secure API key management
 * 
 * CRITICAL SECURITY:
 * - API keys are encrypted server-side before storage
 * - Frontend NEVER receives raw API keys
 * - Decryption only happens in edge functions when making LLM calls
 */

import { supabase } from '@/integrations/supabase/client';
import type { LLMProvider, ApiKeyDisplay } from '@/types/database.types';

export const apiKeyService = {
  /**
   * List all API keys for the current user
   * Returns display-safe data (no raw keys)
   */
  async list(): Promise<ApiKeyDisplay[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, provider, key_hint, is_valid, last_validated_at, created_at')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data || []) as ApiKeyDisplay[];
  },

  /**
   * Add or update an API key using server-side encryption
   */
  async upsert(provider: LLMProvider, apiKey: string): Promise<ApiKeyDisplay> {
    const { data, error } = await supabase.functions.invoke('encrypt-api-key', {
      body: { action: 'encrypt', provider, api_key: apiKey },
    });

    if (error) {
      console.error('[apiKeyService.upsert] Error:', error);
      throw new Error(error.message || 'Failed to save API key');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to save API key');
    }

    console.log('[apiKeyService.upsert] Key saved for provider:', provider);
    return data.data as ApiKeyDisplay;
  },

  /**
   * Delete an API key
   */
  async delete(keyId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('encrypt-api-key', {
      body: { action: 'delete', key_id: keyId },
    });

    if (error) {
      console.error('[apiKeyService.delete] Error:', error);
      throw new Error(error.message || 'Failed to delete API key');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to delete API key');
    }

    console.log('[apiKeyService.delete] Key deleted:', keyId);
  },

  /**
   * Check if user has a valid key for a provider
   */
  async hasValidKey(provider: LLMProvider): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('user_has_api_key', { p_user_id: user.id, p_provider: provider });

    if (error) return false;
    return (data as boolean) ?? false;
  },

  /**
   * Get decrypted API key for making LLM calls
   * This should ONLY be called from edge functions, not from client
   * For client-side, use the chat edge function which handles decryption internally
   */
  async getDecryptedKey(provider: LLMProvider): Promise<string | null> {
    const { data, error } = await supabase.functions.invoke('encrypt-api-key', {
      body: { action: 'decrypt', provider },
    });

    if (error || !data?.api_key) {
      console.error('[apiKeyService.getDecryptedKey] Error:', error);
      return null;
    }

    return data.api_key;
  },

  /**
   * Test if an API key is valid (format check only, no actual API call)
   */
  validateFormat(provider: LLMProvider, key: string): { valid: boolean; error?: string } {
    if (!key || key.length < 10) {
      return { valid: false, error: 'API key is too short' };
    }

    switch (provider) {
      case 'openai':
        if (!key.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI keys should start with "sk-"' };
        }
        break;
      case 'anthropic':
        if (!key.startsWith('sk-ant-')) {
          return { valid: false, error: 'Anthropic keys should start with "sk-ant-"' };
        }
        break;
      case 'xai':
        if (!key.startsWith('xai-')) {
          return { valid: false, error: 'xAI keys should start with "xai-"' };
        }
        break;
      case 'deepseek':
        if (!key.startsWith('sk-')) {
          return { valid: false, error: 'DeepSeek keys should start with "sk-"' };
        }
        break;
      case 'google':
        if (key.length < 20) {
          return { valid: false, error: 'Invalid Google API key format' };
        }
        break;
    }

    return { valid: true };
  },
};

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

export interface ApiKeyWithTeam extends ApiKeyDisplay {
  team_id: string | null;
}

export const apiKeyService = {
  /**
   * List all API keys for the current user (personal keys only)
   * Returns display-safe data (no raw keys)
   */
  async list(): Promise<ApiKeyWithTeam[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Use the safe view that excludes the encrypted column
    const { data, error } = await supabase
      .from('api_keys_safe')
      .select('id, provider, key_hint, is_valid, last_validated_at, created_at, team_id')
      .eq('user_id', user.id)
      .is('team_id', null);

    if (error) throw error;
    return (data || []) as ApiKeyWithTeam[];
  },

  /**
   * List all API keys for a specific team
   */
  async listTeamKeys(teamId: string): Promise<ApiKeyWithTeam[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('api_keys_safe')
      .select('id, provider, key_hint, is_valid, last_validated_at, created_at, team_id')
      .eq('team_id', teamId);

    if (error) throw error;
    return (data || []) as ApiKeyWithTeam[];
  },

  /**
   * List all visible API keys (personal + team keys user has access to)
   */
  async listAll(): Promise<ApiKeyWithTeam[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('api_keys_safe')
      .select('id, provider, key_hint, is_valid, last_validated_at, created_at, team_id');

    if (error) throw error;
    return (data || []) as ApiKeyWithTeam[];
  },

  /**
   * Add or update an API key using server-side encryption
   * If teamId is provided, the key belongs to that team
   */
  async upsert(provider: LLMProvider, apiKey: string, teamId?: string | null): Promise<ApiKeyDisplay> {
    const { data, error } = await supabase.functions.invoke('encrypt-api-key', {
      body: { action: 'encrypt', provider, api_key: apiKey, team_id: teamId || null },
    });

    if (error) {
      console.error('[apiKeyService.upsert] Error:', error);
      // Parse limit exceeded errors for better UX
      const errorMessage = error.message || 'Failed to save API key';
      if (errorMessage.includes('LIMIT_EXCEEDED:API_KEY')) {
        throw new Error('You have reached your API key limit. Upgrade your plan to add more keys.');
      }
      throw new Error(errorMessage);
    }

    if (!data?.success) {
      const errorMsg = data?.error || 'Failed to save API key';
      // Also check for limit errors in the response body
      if (errorMsg.includes('LIMIT_EXCEEDED') || errorMsg.includes('Maximum API keys')) {
        throw new Error('You have reached your API key limit. Upgrade your plan to add more keys.');
      }
      throw new Error(errorMsg);
    }

    console.log('[apiKeyService.upsert] Key saved for provider:', provider, teamId ? `(team: ${teamId})` : '(personal)');
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

  // NOTE: getDecryptedKey has been REMOVED for security.
  // All AI calls must go through the chat-proxy edge function.
  // Frontend cannot and should not access decrypted API keys.

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
      case 'openrouter':
        if (!key.startsWith('sk-or-')) {
          return { valid: false, error: 'OpenRouter keys should start with "sk-or-"' };
        }
        break;
    }

    return { valid: true };
  },
};

/**
 * API Key Access Request Service
 * Handles requesting and managing access to team API keys
 */

import { supabase } from '@/integrations/supabase/client';
import type { LLMProvider } from '@/types/database.types';

export interface ApiKeyAccessRequest {
  id: string;
  team_id: string;
  api_key_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  // Joined data
  requester?: {
    email: string;
    full_name: string | null;
  };
  api_key?: {
    provider: LLMProvider;
    key_hint: string | null;
  };
}

export const apiKeyAccessService = {
  /**
   * Request access to a team API key
   */
  async requestAccess(teamId: string, apiKeyId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('request_api_key_access', { 
        p_team_id: teamId, 
        p_api_key_id: apiKeyId 
      });

    if (error) {
      console.error('[apiKeyAccessService.requestAccess] Error:', error);
      throw new Error(error.message || 'Failed to request access');
    }

    return data as string;
  },

  /**
   * Resolve an access request (approve/reject)
   */
  async resolveRequest(
    requestId: string, 
    approved: boolean, 
    rejectionReason?: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('resolve_api_key_request', { 
        p_request_id: requestId, 
        p_approved: approved,
        p_rejection_reason: rejectionReason || null
      });

    if (error) {
      console.error('[apiKeyAccessService.resolveRequest] Error:', error);
      throw new Error(error.message || 'Failed to resolve request');
    }

    return data as boolean;
  },

  /**
   * Check if user has access to a team API key
   */
  async hasAccess(apiKeyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('has_team_api_key_access', { p_api_key_id: apiKeyId });

    if (error) {
      console.error('[apiKeyAccessService.hasAccess] Error:', error);
      return false;
    }

    return data as boolean;
  },

  /**
   * Get pending requests count for a team
   */
  async getPendingCount(teamId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('get_pending_api_key_requests_count', { p_team_id: teamId });

    if (error) {
      console.error('[apiKeyAccessService.getPendingCount] Error:', error);
      return 0;
    }

    return data as number;
  },

  /**
   * Get all pending requests for a team (admin/owner only)
   */
  async getPendingRequests(teamId: string): Promise<ApiKeyAccessRequest[]> {
    const { data, error } = await supabase
      .from('api_key_access_requests')
      .select(`
        *,
        requester:profiles!api_key_access_requests_requester_id_fkey(email, full_name),
        api_key:api_keys_safe!api_key_access_requests_api_key_id_fkey(provider, key_hint)
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[apiKeyAccessService.getPendingRequests] Error:', error);
      throw new Error(error.message || 'Failed to fetch pending requests');
    }

    return (data || []) as unknown as ApiKeyAccessRequest[];
  },

  /**
   * Get user's own access requests
   */
  async getMyRequests(): Promise<ApiKeyAccessRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('api_key_access_requests')
      .select(`
        *,
        api_key:api_keys_safe!api_key_access_requests_api_key_id_fkey(provider, key_hint)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[apiKeyAccessService.getMyRequests] Error:', error);
      throw new Error(error.message || 'Failed to fetch requests');
    }

    return (data || []) as unknown as ApiKeyAccessRequest[];
  },

  /**
   * Check if user has a pending request for a specific API key
   */
  async hasPendingRequest(apiKeyId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('api_key_access_requests')
      .select('id')
      .eq('api_key_id', apiKeyId)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('[apiKeyAccessService.hasPendingRequest] Error:', error);
      return false;
    }

    return !!data;
  }
};

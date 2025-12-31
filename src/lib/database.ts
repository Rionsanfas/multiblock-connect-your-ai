// ============================================
// THINKBLOCKS DATABASE HELPERS
// Type-safe Supabase query helpers
// Version: 3.0.0 - Production-ready with messages
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn } from '@/lib/logger';
import type {
  Profile,
  ProfileUpdate,
  ApiKey,
  Board,
  BoardInsert,
  BoardUpdate,
  Block,
  BlockInsert,
  BlockUpdate,
  BlockConnection,
  BlockConnectionInsert,
  Message,
  MessageInsert,
  MessageUpdate,
  LLMProvider,
  ApiKeyDisplay,
  AppRole,
  SubscriptionPlan,
  UserSubscription,
  UserSubscriptionWithPlan,
  UsageLimits,
} from '@/types/database.types';
import { getKeyHint, isUnlimited } from '@/types/database.types';

// ============================================
// PROFILES
// ============================================

export const profilesDb = {
  async getCurrent(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  },

  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  },

  async update(updates: ProfileUpdate): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};

// ============================================
// USER ROLES
// ============================================

export const userRolesDb = {
  async getCurrentRole(): Promise<AppRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .rpc('get_user_role', { _user_id: user.id });

    if (error) return 'user';
    return (data as AppRole) ?? 'user';
  },

  async hasRole(role: AppRole): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: role });

    if (error) return false;
    return (data as boolean) ?? false;
  },

  async isAdmin(): Promise<boolean> {
    return await this.hasRole('admin') || await this.hasRole('super_admin');
  },

  async isSuperAdmin(): Promise<boolean> {
    return await this.hasRole('super_admin');
  },
};

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const plansDb = {
  async getAll(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as SubscriptionPlan[];
  },

  async getById(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    if (error) throw error;
    return data as SubscriptionPlan | null;
  },

  async getByTier(tier: 'free' | 'pro' | 'team' | 'enterprise'): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('tier', tier)
      .maybeSingle();

    if (error) throw error;
    return data as SubscriptionPlan | null;
  },
};

// ============================================
// USER SUBSCRIPTIONS
// ============================================

export const subscriptionsDb = {
  async getCurrent(): Promise<UserSubscriptionWithPlan | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .rpc('get_user_subscription', { p_user_id: user.id });

    if (error) throw error;
    const result = data as UserSubscriptionWithPlan[] | null;
    return result?.[0] ?? null;
  },

  async getRaw(): Promise<UserSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data as UserSubscription | null;
  },

  async canCreateBoard(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('can_create_board', { p_user_id: user.id });

    if (error) return true;
    return (data as boolean) ?? true;
  },

  async canCreateBlock(boardId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('can_create_block', { p_user_id: user.id, p_board_id: boardId });

    if (error) return true;
    return (data as boolean) ?? true;
  },

  async canSendMessage(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('can_send_message', { p_user_id: user.id });

    if (error) return true;
    return (data as boolean) ?? true;
  },

  async incrementMessageCount(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.rpc('increment_message_count', { p_user_id: user.id });
  },

  async getUsageLimits(): Promise<UsageLimits | null> {
    const subscription = await this.getCurrent();
    if (!subscription) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [boardCount, apiKeyCount] = await Promise.all([
      boardsDb.getCount(),
      apiKeysDb.getCount(),
    ]);

    return {
      boards: {
        used: boardCount,
        max: subscription.max_boards,
        unlimited: isUnlimited(subscription.max_boards),
      },
      blocksPerBoard: {
        used: 0,
        max: subscription.max_blocks_per_board,
        unlimited: isUnlimited(subscription.max_blocks_per_board),
      },
      messagesPerDay: {
        used: subscription.messages_used_today,
        max: subscription.max_messages_per_day,
        unlimited: isUnlimited(subscription.max_messages_per_day),
      },
      apiKeys: {
        used: apiKeyCount,
        max: subscription.max_api_keys,
        unlimited: isUnlimited(subscription.max_api_keys),
      },
      seats: {
        used: 1,
        max: subscription.max_seats,
        unlimited: isUnlimited(subscription.max_seats),
      },
    };
  },
};

// ============================================
// API KEYS
// ============================================

export const apiKeysDb = {
  async getAll(): Promise<ApiKeyDisplay[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, provider, key_hint, is_valid, last_validated_at, created_at')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data || []) as ApiKeyDisplay[];
  },

  async getForProvider(provider: LLMProvider): Promise<ApiKey | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .maybeSingle();

    if (error) throw error;
    return data as ApiKey | null;
  },

  async hasValidKey(provider: LLMProvider): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('user_has_api_key', { p_user_id: user.id, p_provider: provider });

    if (error) return false;
    return (data as boolean) ?? false;
  },

  async getCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .rpc('get_user_api_key_count', { p_user_id: user.id });

    if (error) return 0;
    return (data as number) ?? 0;
  },

  async upsert(provider: LLMProvider, apiKey: string): Promise<ApiKey> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const keyHint = getKeyHint(apiKey);

    const { data, error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: user.id,
        provider,
        api_key_encrypted: apiKey,
        key_hint: keyHint,
        is_valid: true,
        last_validated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })
      .select()
      .single();

    if (error) throw error;
    return data as ApiKey;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) throw error;
  },

  async markInvalid(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_valid: false })
      .eq('id', id);
    if (error) throw error;
  },

  async markValid(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_valid: true, last_validated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// BOARDS
// ============================================

export const boardsDb = {
  /**
   * Get all personal boards (no team_id)
   */
  async getAll(includeArchived = false): Promise<Board[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      devLog('[boardsDb.getAll] No authenticated user');
      return [];
    }

    let query = supabase
      .from('boards')
      .select('*')
      .eq('user_id', user.id)
      .is('team_id', null) // Only personal boards
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) {
      devError('[boardsDb.getAll] Error:', error);
      throw error;
    }
    devLog('[boardsDb.getAll] Fetched:', data?.length, 'personal boards');
    return (data || []) as Board[];
  },

  /**
   * Get all boards for a specific team
   */
  async getForTeam(teamId: string, includeArchived = false): Promise<Board[]> {
    let query = supabase
      .from('boards')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) {
      devError('[boardsDb.getForTeam] Error:', error);
      throw error;
    }
    devLog('[boardsDb.getForTeam] Fetched:', data?.length, 'team boards');
    return (data || []) as Board[];
  },

  /**
   * Transfer a personal board to a team
   */
  async transferToTeam(boardId: string, teamId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('transfer_board_to_team', { p_board_id: boardId, p_team_id: teamId });

    if (error) {
      devError('[boardsDb.transferToTeam] Error:', error);
      throw error;
    }
    return data as boolean;
  },

  async getById(id: string): Promise<Board | null> {
    devLog('[boardsDb.getById] Fetching board:', id);
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      devError('[boardsDb.getById] Error:', error);
      throw error;
    }
    devLog('[boardsDb.getById] Result:', { found: !!data });
    return data as Board | null;
  },

  async create(board: Omit<BoardInsert, 'user_id'>): Promise<Board> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      devError('[boardsDb.create] No authenticated user');
      throw new Error('Not authenticated');
    }

    devLog('[boardsDb.create] Creating board for user:', user.id);

    // Client-side check is done via usePlanEnforcement.enforceCreateBoard()
    // Server-side RLS will also protect against unauthorized inserts

    const { data, error } = await supabase
      .from('boards')
      .insert({ ...board, user_id: user.id })
      .select()
      .single();

    if (error) {
      devError('[boardsDb.create] Insert error:', error);
      throw error;
    }
    
    devLog('[boardsDb.create] Board created:', data.id);
    return data as Board;
  },

  async update(id: string, updates: BoardUpdate): Promise<Board> {
    const { data, error } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Board;
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    devLog('[boardsDb.delete] Deleting board:', id);
    const { error, count } = await supabase
      .from('boards')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      devError('[boardsDb.delete] Error:', error);
      return { success: false, error: error.message };
    }
    
    devLog('[boardsDb.delete] Board deleted successfully');
    return { success: true };
  },

  async archive(id: string): Promise<Board> {
    return this.update(id, { is_archived: true });
  },

  async unarchive(id: string): Promise<Board> {
    return this.update(id, { is_archived: false });
  },

  async getCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .rpc('get_user_board_count', { p_user_id: user.id });

    if (error) return 0;
    return (data as number) ?? 0;
  },

  async updateCanvasPosition(id: string, zoom: number, x: number, y: number): Promise<void> {
    const { error } = await supabase
      .from('boards')
      .update({ canvas_zoom: zoom, canvas_position_x: x, canvas_position_y: y })
      .eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// BLOCKS
// ============================================

export const blocksDb = {
  async getForBoard(boardId: string): Promise<Block[]> {
    devLog('[blocksDb.getForBoard] Fetching blocks for board:', boardId);
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) {
      devError('[blocksDb.getForBoard] Error:', error);
      throw error;
    }
    devLog('[blocksDb.getForBoard] Fetched:', data?.length, 'blocks');
    return (data || []) as Block[];
  },

  async getById(id: string): Promise<Block | null> {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Block | null;
  },

  async create(block: Omit<BlockInsert, 'user_id'>): Promise<Block> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      devError('[blocksDb.create] No authenticated user');
      throw new Error('Not authenticated');
    }

    devLog('[blocksDb.create] Creating block');

    const canCreate = await subscriptionsDb.canCreateBlock(block.board_id);
    if (!canCreate) {
      devLog('[blocksDb.create] Block limit reached');
      throw new Error('Block limit reached for this board. Please upgrade your plan.');
    }

    const { data, error } = await supabase
      .from('blocks')
      .insert({ ...block, user_id: user.id })
      .select()
      .single();

    if (error) {
      devError('[blocksDb.create] Insert error:', error);
      throw error;
    }
    
    devLog('[blocksDb.create] Block created:', data.id);
    return data as Block;
  },

  async update(id: string, updates: BlockUpdate): Promise<Block> {
    const { data, error } = await supabase
      .from('blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Block;
  },

  async delete(id: string): Promise<{ success: boolean; deletedId?: string; error?: string }> {
    devLog('[blocksDb.delete] Starting delete for block:', id);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      devError('[blocksDb.delete] No authenticated user');
      return { success: false, error: 'Not authenticated' };
    }

    // First verify the block exists and belongs to the user
    const { data: existingBlock, error: fetchError } = await supabase
      .from('blocks')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      devError('[blocksDb.delete] Error fetching block:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!existingBlock) {
      devError('[blocksDb.delete] Block not found:', id);
      return { success: false, error: 'Block not found' };
    }

    if (existingBlock.user_id !== user.id) {
      devError('[blocksDb.delete] User does not own block');
      return { success: false, error: 'Access denied' };
    }

    // Delete dependent rows first (prevents FK constraint failures)
    // 1) Messages in this block
    const { error: msgDelError, data: deletedMsgs } = await supabase
      .from('messages')
      .delete()
      .eq('block_id', id)
      .eq('user_id', user.id)
      .select('id');

    if (msgDelError) {
      devError('[blocksDb.delete] Failed deleting messages:', msgDelError);
      return { success: false, error: msgDelError.message };
    }
    devLog('[blocksDb.delete] Deleted messages:', deletedMsgs?.length ?? 0);

    // 2) Connections referencing this block (either direction)
    // Delete source connections
    const { error: srcConnDelError } = await supabase
      .from('block_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('source_block_id', id);

    if (srcConnDelError) {
      devError('[blocksDb.delete] Failed deleting source connections:', srcConnDelError);
      return { success: false, error: srcConnDelError.message };
    }

    // Delete target connections
    const { error: tgtConnDelError } = await supabase
      .from('block_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('target_block_id', id);

    if (tgtConnDelError) {
      devError('[blocksDb.delete] Failed deleting target connections:', tgtConnDelError);
      return { success: false, error: tgtConnDelError.message };
    }
    devLog('[blocksDb.delete] Deleted connections for block:', id);


    // 3) Delete the block itself (return affected rows for verification)
    const { error: deleteError, data: deletedBlocks } = await supabase
      .from('blocks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id');

    if (deleteError) {
      devError('[blocksDb.delete] Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    if (!deletedBlocks || deletedBlocks.length === 0) {
      devError('[blocksDb.delete] No rows deleted (RLS or not found)');
      return { success: false, error: 'Delete failed - no rows deleted' };
    }

    devLog('[blocksDb.delete] Deleted block rows:', deletedBlocks.length);

    // Verify deletion by trying to fetch the block again
    const { data: checkBlock } = await supabase
      .from('blocks')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkBlock) {
      devError('[blocksDb.delete] Block still exists after delete!');
      return { success: false, error: 'Delete failed - block still exists' };
    }

    devLog('[blocksDb.delete] Block successfully deleted:', id);
    return { success: true, deletedId: id };
  },

  async updatePosition(id: string, x: number, y: number): Promise<void> {
    const { error } = await supabase
      .from('blocks')
      .update({ position_x: x, position_y: y })
      .eq('id', id);
    if (error) throw error;
  },

  async getCount(boardId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('get_board_block_count', { p_board_id: boardId });

    if (error) return 0;
    return (data as number) ?? 0;
  },
};

// ============================================
// MESSAGES (Supabase-backed)
// ============================================

export const messagesDb = {
  async getForBlock(blockId: string): Promise<Message[]> {
    devLog('[messagesDb.getForBlock] Fetching messages for block:', blockId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      devWarn('[messagesDb.getForBlock] No authenticated user');
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('block_id', blockId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      devError('[messagesDb.getForBlock] Error:', error);
      throw error;
    }
    
    devLog('[messagesDb.getForBlock] Fetched:', data?.length, 'messages');
    return (data || []) as Message[];
  },

  async create(blockId: string, role: 'user' | 'assistant' | 'system', content: string, meta?: Record<string, unknown>): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    devLog('[messagesDb.create] Creating message');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        block_id: blockId,
        user_id: user.id,
        role,
        content,
        meta: meta as unknown as Record<string, never>,
      })
      .select()
      .single();

    if (error) {
      devError('[messagesDb.create] Error:', error);
      throw error;
    }

    devLog('[messagesDb.create] Message created:', data.id);
    return data as Message;
  },

  async update(id: string, content: string, meta?: Record<string, unknown>): Promise<Message> {
    const updates: Record<string, unknown> = { content };
    if (meta) updates.meta = meta;

    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteForBlock(blockId: string): Promise<void> {
    devLog('[messagesDb.deleteForBlock] Deleting all messages for block:', blockId);
    
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('block_id', blockId);
    
    if (error) {
      devError('[messagesDb.deleteForBlock] Error:', error);
      throw error;
    }
  },
};

// ============================================
// BLOCK CONNECTIONS
// ============================================

export const connectionsDb = {
  async getForBoard(boardId: string): Promise<BlockConnection[]> {
    const blocks = await blocksDb.getForBoard(boardId);
    const blockIds = blocks.map(b => b.id);
    
    if (blockIds.length === 0) return [];

    const { data, error } = await supabase
      .from('block_connections')
      .select('*')
      .or(`source_block_id.in.(${blockIds.join(',')}),target_block_id.in.(${blockIds.join(',')})`);

    if (error) throw error;
    return (data || []) as BlockConnection[];
  },

  async getIncoming(blockId: string): Promise<BlockConnection[]> {
    const { data, error } = await supabase
      .from('block_connections')
      .select('*')
      .eq('target_block_id', blockId);

    if (error) throw error;
    return (data || []) as BlockConnection[];
  },

  async getOutgoing(blockId: string): Promise<BlockConnection[]> {
    const { data, error } = await supabase
      .from('block_connections')
      .select('*')
      .eq('source_block_id', blockId);

    if (error) throw error;
    return (data || []) as BlockConnection[];
  },

  async create(connection: Omit<BlockConnectionInsert, 'user_id'>): Promise<BlockConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('block_connections')
      .insert({ ...connection, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as BlockConnection;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('block_connections').delete().eq('id', id);
    if (error) throw error;
  },

  async exists(sourceBlockId: string, targetBlockId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('block_connections')
      .select('id')
      .eq('source_block_id', sourceBlockId)
      .eq('target_block_id', targetBlockId)
      .maybeSingle();

    if (error) return false;
    return data !== null;
  },
};

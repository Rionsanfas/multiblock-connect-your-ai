// ============================================
// THINKBLOCKS DATABASE HELPERS
// Type-safe Supabase query helpers
// Version: 2.0.0
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type {
  Profile,
  ProfileUpdate,
  ApiKey,
  ApiKeyUpdate,
  Board,
  BoardInsert,
  BoardUpdate,
  Block,
  BlockInsert,
  BlockUpdate,
  BlockConnection,
  LLMProvider,
  ApiKeyDisplay,
  UserRole,
  AppRole,
  SubscriptionPlan,
  UserSubscription,
  UserSubscriptionWithPlan,
  UsageLimits,
} from '@/types/database.types';
import { getKeyHint, isUnlimited } from '@/types/database.types';

// Type assertion helper for tables not yet in generated types
// Remove this after running database migration and regenerating types
const db = supabase as any;

// ============================================
// PROFILES
// ============================================

export const profilesDb = {
  async getCurrent(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(updates: ProfileUpdate): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// USER ROLES
// ============================================

export const userRolesDb = {
  async getCurrentRole(): Promise<AppRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .rpc('get_user_role', { _user_id: user.id });

    if (error) return 'user';
    return data ?? 'user';
  },

  async hasRole(role: AppRole): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await db
      .rpc('has_role', { _user_id: user.id, _role: role });

    if (error) return false;
    return data ?? false;
  },

  async isAdmin(): Promise<boolean> {
    return await this.hasRole('admin') || await this.hasRole('super_admin');
  },

  async isSuperAdmin(): Promise<boolean> {
    return await this.hasRole('super_admin');
  },

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await db
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },
};

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const plansDb = {
  async getAll(): Promise<SubscriptionPlan[]> {
    const { data, error } = await db
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await db
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getByTier(tier: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await db
      .from('subscription_plans')
      .select('*')
      .eq('tier', tier)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
};

// ============================================
// USER SUBSCRIPTIONS
// ============================================

export const subscriptionsDb = {
  async getCurrent(): Promise<UserSubscriptionWithPlan | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .rpc('get_user_subscription', { p_user_id: user.id });

    if (error) throw error;
    return data?.[0] ?? null;
  },

  async getRaw(): Promise<UserSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async canCreateBoard(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await db
      .rpc('can_create_board', { p_user_id: user.id });

    if (error) return false;
    return data ?? false;
  },

  async canCreateBlock(boardId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await db
      .rpc('can_create_block', { p_user_id: user.id, p_board_id: boardId });

    if (error) return false;
    return data ?? false;
  },

  async canSendMessage(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await db
      .rpc('can_send_message', { p_user_id: user.id });

    if (error) return false;
    return data ?? false;
  },

  async incrementMessageCount(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await db.rpc('increment_message_count', { p_user_id: user.id });
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
        used: 0, // Calculated per-board
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
        used: 1, // TODO: Implement team seats
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

    const { data, error } = await db
      .from('api_keys')
      .select('id, provider, key_hint, is_valid, last_validated_at, created_at')
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  },

  async getForProvider(provider: LLMProvider): Promise<ApiKey | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async hasValidKey(provider: LLMProvider): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await db
      .rpc('user_has_api_key', { p_user_id: user.id, p_provider: provider });

    if (error) return false;
    return data ?? false;
  },

  async getCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await db
      .rpc('get_user_api_key_count', { p_user_id: user.id });

    if (error) return 0;
    return data ?? 0;
  },

  async upsert(provider: LLMProvider, apiKey: string): Promise<ApiKey> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const keyHint = getKeyHint(apiKey);

    const { data, error } = await db
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
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('api_keys').delete().eq('id', id);
    if (error) throw error;
  },

  async markInvalid(id: string): Promise<void> {
    const { error } = await db
      .from('api_keys')
      .update({ is_valid: false })
      .eq('id', id);
    if (error) throw error;
  },

  async markValid(id: string): Promise<void> {
    const { error } = await db
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
  async getAll(includeArchived = false): Promise<Board[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = db
      .from('boards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Board | null> {
    const { data, error } = await db
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(board: Omit<BoardInsert, 'user_id'>): Promise<Board> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check limit
    const canCreate = await subscriptionsDb.canCreateBoard();
    if (!canCreate) {
      throw new Error('Board limit reached. Please upgrade your plan.');
    }

    const { data, error } = await db
      .from('boards')
      .insert({ ...board, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: BoardUpdate): Promise<Board> {
    const { data, error } = await db
      .from('boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('boards').delete().eq('id', id);
    if (error) throw error;
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

    const { data, error } = await db
      .rpc('get_user_board_count', { p_user_id: user.id });

    if (error) return 0;
    return data ?? 0;
  },

  async updateCanvasPosition(id: string, zoom: number, x: number, y: number): Promise<void> {
    const { error } = await db
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
    const { data, error } = await db
      .from('blocks')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Block | null> {
    const { data, error } = await db
      .from('blocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(block: Omit<BlockInsert, 'user_id'>): Promise<Block> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check limit
    const canCreate = await subscriptionsDb.canCreateBlock(block.board_id);
    if (!canCreate) {
      throw new Error('Block limit reached for this board. Please upgrade your plan.');
    }

    const { data, error } = await db
      .from('blocks')
      .insert({ ...block, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: BlockUpdate): Promise<Block> {
    const { data, error } = await db
      .from('blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('blocks').delete().eq('id', id);
    if (error) throw error;
  },

  async updatePosition(id: string, x: number, y: number): Promise<void> {
    const { error } = await db
      .from('blocks')
      .update({ position_x: x, position_y: y })
      .eq('id', id);
    if (error) throw error;
  },

  async updateSize(id: string, width: number, height: number): Promise<void> {
    const { error } = await db
      .from('blocks')
      .update({ width, height })
      .eq('id', id);
    if (error) throw error;
  },

  async getCount(boardId: string): Promise<number> {
    const { data, error } = await db
      .rpc('get_board_block_count', { p_board_id: boardId });

    if (error) return 0;
    return data ?? 0;
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

    const { data, error } = await db
      .from('block_connections')
      .select('*')
      .or(`source_block_id.in.(${blockIds.join(',')}),target_block_id.in.(${blockIds.join(',')})`);

    if (error) throw error;
    return data || [];
  },

  async getIncoming(blockId: string): Promise<{
    connection_id: string;
    source_block_id: string;
    source_title: string;
    source_provider: LLMProvider;
    source_model_id: string;
  }[]> {
    const { data, error } = await db
      .rpc('get_block_incoming_connections', { p_block_id: blockId });

    if (error) return [];
    return data || [];
  },

  async getOutgoing(blockId: string): Promise<BlockConnection[]> {
    const { data, error } = await db
      .from('block_connections')
      .select('*')
      .eq('source_block_id', blockId);

    if (error) throw error;
    return data || [];
  },

  async create(sourceBlockId: string, targetBlockId: string, label?: string): Promise<BlockConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('block_connections')
      .insert({
        source_block_id: sourceBlockId,
        target_block_id: targetBlockId,
        user_id: user.id,
        label,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from('block_connections').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteBetween(sourceBlockId: string, targetBlockId: string): Promise<void> {
    const { error } = await db
      .from('block_connections')
      .delete()
      .eq('source_block_id', sourceBlockId)
      .eq('target_block_id', targetBlockId);
    if (error) throw error;
  },

  async exists(sourceBlockId: string, targetBlockId: string): Promise<boolean> {
    const { data, error } = await db
      .from('block_connections')
      .select('id')
      .eq('source_block_id', sourceBlockId)
      .eq('target_block_id', targetBlockId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async updateLabel(id: string, label: string | null): Promise<void> {
    const { error } = await db
      .from('block_connections')
      .update({ label })
      .eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// UTILITY EXPORTS
// ============================================

export const database = {
  profiles: profilesDb,
  roles: userRolesDb,
  plans: plansDb,
  subscriptions: subscriptionsDb,
  apiKeys: apiKeysDb,
  boards: boardsDb,
  blocks: blocksDb,
  connections: connectionsDb,
};

export default database;

// ============================================
// THINKBLOCKS DATABASE TYPES
// TypeScript types matching Supabase schema
// ============================================

// ============================================
// ENUMS
// ============================================

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek';

// ============================================
// TABLE TYPES
// ============================================

/**
 * User profile linked to Supabase Auth
 */
export interface Profile {
  id: string; // UUID, matches auth.users.id
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

/**
 * User-provided API keys for LLM providers
 */
export interface ApiKey {
  id: string; // UUID
  user_id: string; // UUID
  provider: LLMProvider;
  api_key_encrypted: string;
  key_hint: string | null; // Last 4 chars for display
  is_valid: boolean;
  last_validated_at: string | null; // ISO timestamp
  created_at: string;
  updated_at: string;
}

export interface ApiKeyInsert {
  user_id: string;
  provider: LLMProvider;
  api_key_encrypted: string;
  key_hint?: string | null;
  is_valid?: boolean;
}

export interface ApiKeyUpdate {
  api_key_encrypted?: string;
  key_hint?: string | null;
  is_valid?: boolean;
  last_validated_at?: string | null;
}

/**
 * User workspace containing blocks
 */
export interface Board {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardInsert {
  user_id: string;
  name?: string;
  description?: string | null;
}

export interface BoardUpdate {
  name?: string;
  description?: string | null;
  is_archived?: boolean;
}

/**
 * AI chat block on a board
 */
export interface Block {
  id: string; // UUID
  board_id: string; // UUID
  user_id: string; // UUID
  provider: LLMProvider;
  model_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  title: string;
  color: string | null;
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockInsert {
  board_id: string;
  user_id: string;
  provider: LLMProvider;
  model_id: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  title?: string;
  color?: string | null;
}

export interface BlockUpdate {
  provider?: LLMProvider;
  model_id?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  title?: string;
  color?: string | null;
  is_collapsed?: boolean;
}

/**
 * Directional connection between blocks
 */
export interface BlockConnection {
  id: string; // UUID
  source_block_id: string; // UUID
  target_block_id: string; // UUID
  user_id: string; // UUID
  label: string | null;
  created_at: string;
}

export interface BlockConnectionInsert {
  source_block_id: string;
  target_block_id: string;
  user_id: string;
  label?: string | null;
}

// ============================================
// DATABASE SCHEMA TYPE (for Supabase client)
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      api_keys: {
        Row: ApiKey;
        Insert: ApiKeyInsert;
        Update: ApiKeyUpdate;
      };
      boards: {
        Row: Board;
        Insert: BoardInsert;
        Update: BoardUpdate;
      };
      blocks: {
        Row: Block;
        Insert: BlockInsert;
        Update: BlockUpdate;
      };
      block_connections: {
        Row: BlockConnection;
        Insert: BlockConnectionInsert;
        Update: never; // Connections are not updatable
      };
    };
    Enums: {
      llm_provider: LLMProvider;
    };
    Functions: {
      get_user_board_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_board_block_count: {
        Args: { p_board_id: string };
        Returns: number;
      };
      user_has_api_key: {
        Args: { p_user_id: string; p_provider: LLMProvider };
        Returns: boolean;
      };
      get_block_incoming_connections: {
        Args: { p_block_id: string };
        Returns: {
          connection_id: string;
          source_block_id: string;
          source_title: string;
          source_provider: LLMProvider;
          source_model_id: string;
        }[];
      };
    };
  };
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Block with its incoming connections resolved
 */
export interface BlockWithConnections extends Block {
  incoming_connections: {
    connection_id: string;
    source_block_id: string;
    source_title: string;
    source_provider: LLMProvider;
    source_model_id: string;
  }[];
}

/**
 * Board with its blocks loaded
 */
export interface BoardWithBlocks extends Board {
  blocks: Block[];
}

/**
 * API key display (safe for UI, no encrypted key)
 */
export interface ApiKeyDisplay {
  id: string;
  provider: LLMProvider;
  key_hint: string | null;
  is_valid: boolean;
  last_validated_at: string | null;
  created_at: string;
}

// ============================================
// PROVIDER DISPLAY INFO
// ============================================

export const PROVIDER_INFO: Record<LLMProvider, { name: string; icon: string }> = {
  openai: { name: 'OpenAI', icon: '🟢' },
  anthropic: { name: 'Anthropic', icon: '🟠' },
  google: { name: 'Google', icon: '🔵' },
  xai: { name: 'xAI', icon: '⚫' },
  deepseek: { name: 'DeepSeek', icon: '🟣' },
};

// ============================================
// VALIDATION HELPERS
// ============================================

export const isValidProvider = (value: string): value is LLMProvider => {
  return ['openai', 'anthropic', 'google', 'xai', 'deepseek'].includes(value);
};

export const getKeyHint = (apiKey: string): string => {
  if (apiKey.length < 4) return '****';
  return `...${apiKey.slice(-4)}`;
};

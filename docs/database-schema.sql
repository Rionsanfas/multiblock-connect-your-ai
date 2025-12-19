-- ============================================
-- THINKBLOCKS MVP DATABASE SCHEMA
-- Ready-to-run SQL for Supabase
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- Linked to Supabase Auth users
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. API KEYS TABLE
-- Store user-provided LLM provider keys
-- ============================================

-- Provider enum for type safety
CREATE TYPE public.llm_provider AS ENUM (
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek'
);

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider llm_provider NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  key_hint TEXT, -- Last 4 chars for display (e.g., "...abc1")
  is_valid BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One key per provider per user
  UNIQUE (user_id, provider)
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own keys
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER on_api_keys_updated
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for fast lookups
CREATE INDEX idx_api_keys_user_provider ON public.api_keys(user_id, provider);

-- ============================================
-- 3. BOARDS TABLE
-- User workspaces containing blocks
-- ============================================

CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  description TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own boards
CREATE POLICY "Users can view their own boards"
  ON public.boards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boards"
  ON public.boards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards"
  ON public.boards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards"
  ON public.boards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER on_boards_updated
  BEFORE UPDATE ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for user board listings
CREATE INDEX idx_boards_user_id ON public.boards(user_id);
CREATE INDEX idx_boards_user_created ON public.boards(user_id, created_at DESC);

-- ============================================
-- 4. BLOCKS TABLE
-- AI chat blocks on boards (metadata only)
-- ============================================

CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Model configuration
  provider llm_provider NOT NULL,
  model_id TEXT NOT NULL,
  
  -- Visual position on canvas
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT DEFAULT 400,
  height FLOAT DEFAULT 300,
  
  -- Block metadata
  title TEXT DEFAULT 'New Block',
  color TEXT, -- Hex color for visual distinction
  is_collapsed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access blocks on their own boards
CREATE POLICY "Users can view their own blocks"
  ON public.blocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocks"
  ON public.blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocks"
  ON public.blocks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.blocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER on_blocks_updated
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_blocks_board_id ON public.blocks(board_id);
CREATE INDEX idx_blocks_user_id ON public.blocks(user_id);

-- ============================================
-- 5. BLOCK CONNECTIONS TABLE
-- Directional connections between blocks
-- ============================================

CREATE TABLE public.block_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  target_block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Connection metadata
  label TEXT, -- Optional label for the connection
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate connections and self-connections
  CONSTRAINT no_self_connection CHECK (source_block_id != target_block_id),
  CONSTRAINT unique_connection UNIQUE (source_block_id, target_block_id)
);

-- Enable RLS
ALTER TABLE public.block_connections ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access connections they own
CREATE POLICY "Users can view their own connections"
  ON public.block_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON public.block_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON public.block_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for efficient lookups
CREATE INDEX idx_connections_source ON public.block_connections(source_block_id);
CREATE INDEX idx_connections_target ON public.block_connections(target_block_id);
CREATE INDEX idx_connections_user ON public.block_connections(user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's board count (for limit enforcement)
CREATE OR REPLACE FUNCTION public.get_user_board_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.boards
  WHERE user_id = p_user_id
    AND is_archived = FALSE;
$$;

-- Get user's block count on a board
CREATE OR REPLACE FUNCTION public.get_board_block_count(p_board_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.blocks
  WHERE board_id = p_board_id;
$$;

-- Check if user has API key for provider
CREATE OR REPLACE FUNCTION public.user_has_api_key(p_user_id UUID, p_provider llm_provider)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.api_keys
    WHERE user_id = p_user_id
      AND provider = p_provider
      AND is_valid = TRUE
  );
$$;

-- Get incoming connections for a block
CREATE OR REPLACE FUNCTION public.get_block_incoming_connections(p_block_id UUID)
RETURNS TABLE (
  connection_id UUID,
  source_block_id UUID,
  source_title TEXT,
  source_provider llm_provider,
  source_model_id TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bc.id AS connection_id,
    bc.source_block_id,
    b.title AS source_title,
    b.provider AS source_provider,
    b.model_id AS source_model_id
  FROM public.block_connections bc
  JOIN public.blocks b ON b.id = bc.source_block_id
  WHERE bc.target_block_id = p_block_id;
$$;

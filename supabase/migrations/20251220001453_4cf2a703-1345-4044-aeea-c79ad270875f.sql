-- ============================================
-- THINKBLOCKS PRODUCTION DATABASE SCHEMA
-- Complete SQL for Supabase
-- Version: 2.0.0
-- ============================================

-- ============================================
-- SECTION 1: ENUMS
-- ============================================

-- LLM Provider enum
CREATE TYPE public.llm_provider AS ENUM (
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek'
);

-- User role enum (for RBAC)
CREATE TYPE public.app_role AS ENUM (
  'user',
  'admin',
  'super_admin'
);

-- Subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM (
  'free',
  'pro',
  'team',
  'enterprise'
);

-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'paused'
);

-- ============================================
-- SECTION 2: CORE FUNCTIONS
-- ============================================

-- Auto-update updated_at trigger function
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

-- ============================================
-- SECTION 3: PROFILES TABLE
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
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SECTION 4: USER ROLES TABLE (RBAC)
-- Separate from profiles for security
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$$;

-- Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============================================
-- SECTION 5: SUBSCRIPTION PLANS TABLE
-- Defines available plans and their limits
-- ============================================

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier subscription_tier NOT NULL UNIQUE,
  description TEXT,
  
  -- Pricing (in cents)
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  
  -- Usage limits
  max_boards INTEGER NOT NULL DEFAULT 3,
  max_blocks_per_board INTEGER NOT NULL DEFAULT 10,
  max_messages_per_day INTEGER NOT NULL DEFAULT 50,
  max_api_keys INTEGER NOT NULL DEFAULT 2,
  max_seats INTEGER NOT NULL DEFAULT 1,
  
  -- Features
  features JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (plans are publicly readable)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = TRUE);

-- Only super admins can manage plans
CREATE POLICY "Super admins can manage plans"
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Auto-update updated_at
CREATE TRIGGER on_subscription_plans_updated
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX idx_subscription_plans_tier ON public.subscription_plans(tier);

-- Insert default plans
INSERT INTO public.subscription_plans (name, tier, description, price_monthly, price_yearly, max_boards, max_blocks_per_board, max_messages_per_day, max_api_keys, max_seats, features, sort_order)
VALUES
  ('Free', 'free', 'Get started with ThinkBlocks', 0, 0, 3, 5, 50, 2, 1, '["Basic AI models", "Community support"]'::JSONB, 1),
  ('Pro', 'pro', 'For power users and professionals', 1900, 19000, 20, 20, 500, 5, 1, '["All AI models", "Priority support", "Advanced features"]'::JSONB, 2),
  ('Team', 'team', 'Collaborate with your team', 4900, 49000, 100, 50, 2000, 10, 5, '["Everything in Pro", "Team collaboration", "Shared boards", "Admin controls"]'::JSONB, 3),
  ('Enterprise', 'enterprise', 'For large organizations', 0, 0, -1, -1, -1, -1, -1, '["Unlimited everything", "Custom integrations", "Dedicated support", "SLA"]'::JSONB, 4);

-- ============================================
-- SECTION 6: USER SUBSCRIPTIONS TABLE
-- Links users to their subscription plan
-- ============================================

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'active',
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Seats (for team plans)
  seats_used INTEGER DEFAULT 1,
  
  -- Usage tracking (resets each period)
  messages_used_today INTEGER DEFAULT 0,
  messages_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON public.user_subscriptions
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Auto-update updated_at
CREATE TRIGGER on_user_subscriptions_updated
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe ON public.user_subscriptions(stripe_customer_id);

-- ============================================
-- SECTION 7: API KEYS TABLE
-- User-provided LLM provider keys
-- ============================================

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider llm_provider NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  key_hint TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, provider)
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Index
CREATE INDEX idx_api_keys_user_provider ON public.api_keys(user_id, provider);

-- ============================================
-- SECTION 8: BOARDS TABLE
-- User workspaces containing blocks
-- ============================================

CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  description TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Canvas settings
  canvas_zoom FLOAT DEFAULT 1.0,
  canvas_position_x FLOAT DEFAULT 0,
  canvas_position_y FLOAT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own boards"
  ON public.boards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public boards"
  ON public.boards
  FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

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

-- Indexes
CREATE INDEX idx_boards_user_id ON public.boards(user_id);
CREATE INDEX idx_boards_user_created ON public.boards(user_id, created_at DESC);
CREATE INDEX idx_boards_public ON public.boards(is_public) WHERE is_public = TRUE;

-- ============================================
-- SECTION 9: BLOCKS TABLE
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
  color TEXT,
  is_collapsed BOOLEAN DEFAULT FALSE,
  
  -- System prompt for this block
  system_prompt TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own blocks"
  ON public.blocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view blocks on public boards"
  ON public.blocks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards 
      WHERE boards.id = blocks.board_id 
      AND boards.is_public = TRUE
    )
  );

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
-- SECTION 10: BLOCK CONNECTIONS TABLE
-- Directional connections between blocks
-- ============================================

CREATE TABLE public.block_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  target_block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Connection metadata
  label TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate connections and self-connections
  CONSTRAINT no_self_connection CHECK (source_block_id != target_block_id),
  CONSTRAINT unique_connection UNIQUE (source_block_id, target_block_id)
);

-- Enable RLS
ALTER TABLE public.block_connections ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Indexes
CREATE INDEX idx_connections_source ON public.block_connections(source_block_id);
CREATE INDEX idx_connections_target ON public.block_connections(target_block_id);
CREATE INDEX idx_connections_user ON public.block_connections(user_id);

-- ============================================
-- SECTION 11: HELPER FUNCTIONS
-- ============================================

-- Get user's board count
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

-- Get block count for a board
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

-- Get user's API key count
CREATE OR REPLACE FUNCTION public.get_user_api_key_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.api_keys
  WHERE user_id = p_user_id;
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

-- Get user's subscription with plan details
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_id UUID,
  plan_name TEXT,
  tier subscription_tier,
  status subscription_status,
  max_boards INTEGER,
  max_blocks_per_board INTEGER,
  max_messages_per_day INTEGER,
  max_api_keys INTEGER,
  max_seats INTEGER,
  messages_used_today INTEGER,
  current_period_end TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.id AS subscription_id,
    us.plan_id,
    sp.name AS plan_name,
    sp.tier,
    us.status,
    sp.max_boards,
    sp.max_blocks_per_board,
    sp.max_messages_per_day,
    sp.max_api_keys,
    sp.max_seats,
    us.messages_used_today,
    us.current_period_end
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id;
$$;

-- Check if user can create more boards
CREATE OR REPLACE FUNCTION public.can_create_board(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT sp.max_boards = -1 OR public.get_user_board_count(p_user_id) < sp.max_boards
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
  ), TRUE);
$$;

-- Check if user can create more blocks on a board
CREATE OR REPLACE FUNCTION public.can_create_block(p_user_id UUID, p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT sp.max_blocks_per_board = -1 OR public.get_board_block_count(p_board_id) < sp.max_blocks_per_board
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
  ), TRUE);
$$;

-- Check if user can send more messages today
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT sp.max_messages_per_day = -1 OR us.messages_used_today < sp.max_messages_per_day
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
  ), TRUE);
$$;

-- Increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET 
    messages_used_today = CASE 
      WHEN messages_reset_at < DATE_TRUNC('day', NOW()) THEN 1
      ELSE messages_used_today + 1
    END,
    messages_reset_at = CASE 
      WHEN messages_reset_at < DATE_TRUNC('day', NOW()) THEN NOW()
      ELSE messages_reset_at
    END
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================
-- SECTION 12: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Assign free subscription plan
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE tier = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, free_plan_id, 'active');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
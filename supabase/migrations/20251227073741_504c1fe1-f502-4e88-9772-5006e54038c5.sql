-- =============================================================================
-- PRODUCTION-GRADE SUBSCRIPTION ENFORCEMENT SYSTEM
-- Fail-closed, server-authoritative, atomic, concurrency-safe
-- =============================================================================

-- 1. DROP EXISTING FUNCTIONS WITH CHANGED SIGNATURES
-- =============================================================================
DROP FUNCTION IF EXISTS public.get_user_effective_limits(UUID);
DROP FUNCTION IF EXISTS public.get_enforcement_status(UUID);
DROP FUNCTION IF EXISTS public.get_user_usage_stats(UUID);
DROP FUNCTION IF EXISTS public.can_send_message(UUID);
DROP FUNCTION IF EXISTS public.can_send_message(UUID, BIGINT);

-- 2. ADD LIMIT COLUMNS TO SUBSCRIPTION_PLANS
-- =============================================================================
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_images_per_day INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_files_per_day INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_message_size_bytes INTEGER NOT NULL DEFAULT 102400;

COMMENT ON COLUMN public.subscription_plans.max_images_per_day IS 'Max images per day (-1 = unlimited)';
COMMENT ON COLUMN public.subscription_plans.max_files_per_day IS 'Max files per day (-1 = unlimited)';
COMMENT ON COLUMN public.subscription_plans.max_file_size_mb IS 'Max file size in MB';
COMMENT ON COLUMN public.subscription_plans.max_message_size_bytes IS 'Max message size in bytes';

-- Update existing plans with tier-appropriate limits
UPDATE public.subscription_plans SET
  max_images_per_day = CASE tier
    WHEN 'free' THEN 5
    WHEN 'starter' THEN 20
    WHEN 'pro' THEN 100
    WHEN 'team' THEN 500
    WHEN 'enterprise' THEN -1
    ELSE 5
  END,
  max_files_per_day = CASE tier
    WHEN 'free' THEN 3
    WHEN 'starter' THEN 10
    WHEN 'pro' THEN 50
    WHEN 'team' THEN 200
    WHEN 'enterprise' THEN -1
    ELSE 3
  END,
  max_file_size_mb = CASE tier
    WHEN 'free' THEN 5
    WHEN 'starter' THEN 10
    WHEN 'pro' THEN 25
    WHEN 'team' THEN 50
    WHEN 'enterprise' THEN 100
    ELSE 5
  END,
  max_message_size_bytes = CASE tier
    WHEN 'free' THEN 51200
    WHEN 'starter' THEN 102400
    WHEN 'pro' THEN 204800
    WHEN 'team' THEN 512000
    WHEN 'enterprise' THEN 1048576
    ELSE 51200
  END
WHERE plan_type = 'subscription';

-- 3. ADD SNAPSHOT & DAILY TRACKING TO USER_SUBSCRIPTIONS
-- =============================================================================
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS snapshot_max_images_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_max_files_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_max_file_size_mb INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_max_message_size_bytes INTEGER,
  ADD COLUMN IF NOT EXISTS images_used_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS files_used_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uploads_reset_at TIMESTAMPTZ DEFAULT NOW();

-- 4. CREATE USER_STORAGE_USAGE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_storage_usage (
  user_id UUID PRIMARY KEY,
  messages_bytes BIGINT NOT NULL DEFAULT 0 CHECK (messages_bytes >= 0),
  images_bytes BIGINT NOT NULL DEFAULT 0 CHECK (images_bytes >= 0),
  files_bytes BIGINT NOT NULL DEFAULT 0 CHECK (files_bytes >= 0),
  total_bytes BIGINT GENERATED ALWAYS AS (messages_bytes + images_bytes + files_bytes) STORED,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own storage usage" ON public.user_storage_usage;
CREATE POLICY "Users can view their own storage usage"
  ON public.user_storage_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all storage usage" ON public.user_storage_usage;
CREATE POLICY "Service role can manage all storage usage"
  ON public.user_storage_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. CREATE UPLOADS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'file', 'document')),
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_user_date ON public.uploads(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_uploads_user_type_date ON public.uploads(user_id, file_type, created_at);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own uploads" ON public.uploads;
CREATE POLICY "Users can view their own uploads"
  ON public.uploads FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own uploads" ON public.uploads;
CREATE POLICY "Users can insert their own uploads"
  ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own uploads" ON public.uploads;
CREATE POLICY "Users can delete their own uploads"
  ON public.uploads FOR DELETE USING (auth.uid() = user_id);

-- 6. GRACE PERIOD CHECK FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_in_grace(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grace_status public.grace_status;
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;
  
  SELECT grace_status INTO v_grace_status
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  RETURN COALESCE(v_grace_status, 'none') != 'none';
END;
$$;

-- 7. DAILY RESET FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET 
    messages_used_today = 0,
    images_used_today = 0,
    files_used_today = 0,
    uploads_reset_at = NOW(),
    updated_at = NOW()
  WHERE status = 'active';
END;
$$;

-- 8. EXTENDED GET_USER_EFFECTIVE_LIMITS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_user_effective_limits(p_user_id UUID)
RETURNS TABLE(
  max_boards INTEGER,
  max_blocks_per_board INTEGER,
  max_messages_per_day INTEGER,
  max_api_keys INTEGER,
  max_seats INTEGER,
  storage_mb INTEGER,
  addon_extra_boards INTEGER,
  addon_extra_storage_mb INTEGER,
  grace_status public.grace_status,
  grace_expires_at TIMESTAMPTZ,
  max_images_per_day INTEGER,
  max_files_per_day INTEGER,
  max_file_size_mb INTEGER,
  max_message_size_bytes INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_boards INTEGER := 3;
  v_base_blocks INTEGER := 10;
  v_base_messages INTEGER := 50;
  v_base_api_keys INTEGER := 2;
  v_base_seats INTEGER := 1;
  v_base_storage INTEGER := 100;
  v_base_images INTEGER := 5;
  v_base_files INTEGER := 3;
  v_base_file_size INTEGER := 5;
  v_base_msg_size INTEGER := 51200;
  v_addon_boards INTEGER := 0;
  v_addon_storage INTEGER := 0;
  v_grace_status public.grace_status := 'none';
  v_grace_expires TIMESTAMPTZ := NULL;
  v_has_subscription BOOLEAN := FALSE;
BEGIN
  SELECT 
    COALESCE(us.snapshot_max_boards, sp.max_boards),
    COALESCE(us.snapshot_max_blocks_per_board, sp.max_blocks_per_board),
    COALESCE(us.snapshot_max_messages_per_day, sp.max_messages_per_day),
    COALESCE(us.snapshot_max_api_keys, sp.max_api_keys),
    COALESCE(us.snapshot_max_seats, sp.max_seats),
    COALESCE(us.snapshot_storage_mb, sp.storage_mb),
    COALESCE(us.snapshot_max_images_per_day, sp.max_images_per_day),
    COALESCE(us.snapshot_max_files_per_day, sp.max_files_per_day),
    COALESCE(us.snapshot_max_file_size_mb, sp.max_file_size_mb),
    COALESCE(us.snapshot_max_message_size_bytes, sp.max_message_size_bytes),
    us.grace_status,
    us.grace_expires_at,
    TRUE
  INTO
    v_base_boards, v_base_blocks, v_base_messages, v_base_api_keys,
    v_base_seats, v_base_storage, v_base_images, v_base_files,
    v_base_file_size, v_base_msg_size, v_grace_status, v_grace_expires,
    v_has_subscription
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id AND us.status = 'active'
  LIMIT 1;

  IF NOT v_has_subscription THEN
    v_base_boards := 3; v_base_blocks := 10; v_base_messages := 50;
    v_base_api_keys := 2; v_base_seats := 1; v_base_storage := 100;
    v_base_images := 5; v_base_files := 3; v_base_file_size := 5;
    v_base_msg_size := 51200;
  END IF;

  SELECT
    COALESCE(SUM(COALESCE(ua.snapshot_extra_boards, sp.extra_boards) * ua.quantity), 0),
    COALESCE(SUM(COALESCE(ua.snapshot_storage_mb, sp.storage_mb) * ua.quantity), 0)
  INTO v_addon_boards, v_addon_storage
  FROM public.user_addons ua
  JOIN public.subscription_plans sp ON sp.id = ua.addon_plan_id
  WHERE ua.user_id = p_user_id AND ua.is_active = TRUE
    AND (ua.expires_at IS NULL OR ua.expires_at > NOW());

  RETURN QUERY SELECT
    CASE WHEN v_base_boards = -1 THEN -1 ELSE v_base_boards + v_addon_boards END,
    v_base_blocks, v_base_messages, v_base_api_keys, v_base_seats,
    CASE WHEN v_base_storage = -1 THEN -1 ELSE v_base_storage + v_addon_storage END,
    v_addon_boards, v_addon_storage, v_grace_status, v_grace_expires,
    v_base_images, v_base_files, v_base_file_size, v_base_msg_size;
END;
$$;

-- 9. UPDATE SNAPSHOT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.snapshot_subscription_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT
    sp.max_boards, sp.max_blocks_per_board, sp.max_messages_per_day,
    sp.max_api_keys, sp.max_seats, sp.storage_mb,
    sp.max_images_per_day, sp.max_files_per_day,
    sp.max_file_size_mb, sp.max_message_size_bytes
  INTO
    NEW.snapshot_max_boards, NEW.snapshot_max_blocks_per_board,
    NEW.snapshot_max_messages_per_day, NEW.snapshot_max_api_keys,
    NEW.snapshot_max_seats, NEW.snapshot_storage_mb,
    NEW.snapshot_max_images_per_day, NEW.snapshot_max_files_per_day,
    NEW.snapshot_max_file_size_mb, NEW.snapshot_max_message_size_bytes
  FROM public.subscription_plans sp
  WHERE sp.id = NEW.plan_id;
  RETURN NEW;
END;
$$;

-- 10. ATOMIC STORAGE INCREMENT
-- =============================================================================
CREATE OR REPLACE FUNCTION public.atomic_storage_increment(
  p_user_id UUID,
  p_messages_delta BIGINT DEFAULT 0,
  p_images_delta BIGINT DEFAULT 0,
  p_files_delta BIGINT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_storage_usage (user_id, messages_bytes, images_bytes, files_bytes)
  VALUES (p_user_id, GREATEST(0, p_messages_delta), GREATEST(0, p_images_delta), GREATEST(0, p_files_delta))
  ON CONFLICT (user_id) DO UPDATE SET
    messages_bytes = GREATEST(0, user_storage_usage.messages_bytes + p_messages_delta),
    images_bytes = GREATEST(0, user_storage_usage.images_bytes + p_images_delta),
    files_bytes = GREATEST(0, user_storage_usage.files_bytes + p_files_delta),
    updated_at = NOW();
END;
$$;

-- 11. ATOMIC DAILY COUNTER INCREMENT
-- =============================================================================
CREATE OR REPLACE FUNCTION public.atomic_increment_daily_counter(
  p_user_id UUID,
  p_counter_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  IF p_counter_type = 'messages' THEN
    UPDATE public.user_subscriptions
    SET messages_used_today = messages_used_today + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';
    v_updated := FOUND;
  ELSIF p_counter_type = 'images' THEN
    UPDATE public.user_subscriptions
    SET images_used_today = images_used_today + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';
    v_updated := FOUND;
  ELSIF p_counter_type = 'files' THEN
    UPDATE public.user_subscriptions
    SET files_used_today = files_used_today + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'active';
    v_updated := FOUND;
  END IF;
  RETURN v_updated;
END;
$$;

-- 12. CAN_SEND_MESSAGE WITH SIZE CHECK
-- =============================================================================
CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id UUID, p_message_size_bytes BIGINT DEFAULT 0)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_messages_used INTEGER;
  v_storage_used BIGINT;
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;
  
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  
  IF v_limits.grace_status IN ('exceeded_storage', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;
  
  IF v_limits.max_message_size_bytes != -1 AND p_message_size_bytes > v_limits.max_message_size_bytes THEN
    RETURN FALSE;
  END IF;
  
  IF v_limits.max_messages_per_day != -1 THEN
    SELECT COALESCE(messages_used_today, 0) INTO v_messages_used
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active';
    
    IF COALESCE(v_messages_used, 0) >= v_limits.max_messages_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  IF v_limits.storage_mb != -1 THEN
    SELECT COALESCE(total_bytes, 0) INTO v_storage_used
    FROM public.user_storage_usage WHERE user_id = p_user_id;
    
    IF (COALESCE(v_storage_used, 0) + p_message_size_bytes) > (v_limits.storage_mb::BIGINT * 1024 * 1024) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 13. CAN_UPLOAD_IMAGE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.can_upload_image(p_user_id UUID, p_file_size_bytes BIGINT DEFAULT 0)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_images_today INTEGER;
  v_storage_used BIGINT;
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;
  
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  
  IF v_limits.grace_status IN ('exceeded_storage', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;
  
  IF v_limits.max_file_size_mb != -1 AND p_file_size_bytes > (v_limits.max_file_size_mb * 1024 * 1024) THEN
    RETURN FALSE;
  END IF;
  
  IF v_limits.max_images_per_day != -1 THEN
    SELECT COALESCE(images_used_today, 0) INTO v_images_today
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active';
    
    IF COALESCE(v_images_today, 0) >= v_limits.max_images_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  IF v_limits.storage_mb != -1 THEN
    SELECT COALESCE(total_bytes, 0) INTO v_storage_used
    FROM public.user_storage_usage WHERE user_id = p_user_id;
    
    IF (COALESCE(v_storage_used, 0) + p_file_size_bytes) > (v_limits.storage_mb::BIGINT * 1024 * 1024) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 14. CAN_UPLOAD_FILE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.can_upload_file(p_user_id UUID, p_file_size_bytes BIGINT DEFAULT 0)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_files_today INTEGER;
  v_storage_used BIGINT;
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;
  
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  
  IF v_limits.grace_status IN ('exceeded_storage', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;
  
  IF v_limits.max_file_size_mb != -1 AND p_file_size_bytes > (v_limits.max_file_size_mb * 1024 * 1024) THEN
    RETURN FALSE;
  END IF;
  
  IF v_limits.max_files_per_day != -1 THEN
    SELECT COALESCE(files_used_today, 0) INTO v_files_today
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active';
    
    IF COALESCE(v_files_today, 0) >= v_limits.max_files_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  IF v_limits.storage_mb != -1 THEN
    SELECT COALESCE(total_bytes, 0) INTO v_storage_used
    FROM public.user_storage_usage WHERE user_id = p_user_id;
    
    IF (COALESCE(v_storage_used, 0) + p_file_size_bytes) > (v_limits.storage_mb::BIGINT * 1024 * 1024) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 15. CAN_ADD_API_KEY
-- =============================================================================
CREATE OR REPLACE FUNCTION public.can_add_api_key(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_current_count INTEGER;
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  IF v_limits.max_api_keys = -1 THEN RETURN TRUE; END IF;
  SELECT public.get_user_api_key_count(p_user_id) INTO v_current_count;
  RETURN v_current_count < v_limits.max_api_keys;
END;
$$;

-- 16. CAN_CREATE_BOARD WITH GRACE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.can_create_board(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_current_count INTEGER;
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  IF v_limits.grace_status IN ('exceeded_boards', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;
  IF v_limits.max_boards = -1 THEN RETURN TRUE; END IF;
  SELECT public.get_user_board_count(p_user_id) INTO v_current_count;
  RETURN v_current_count < v_limits.max_boards;
END;
$$;

-- 17. CAN_CREATE_BLOCK
-- =============================================================================
CREATE OR REPLACE FUNCTION public.can_create_block(p_user_id UUID, p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_current_count INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_board_id IS NULL THEN RETURN FALSE; END IF;
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  IF v_limits.max_blocks_per_board = -1 THEN RETURN TRUE; END IF;
  SELECT public.get_board_block_count(p_board_id) INTO v_current_count;
  RETURN v_current_count < v_limits.max_blocks_per_board;
END;
$$;

-- 18. GET USER USAGE STATS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id UUID)
RETURNS TABLE(
  boards_used INTEGER,
  blocks_used INTEGER,
  api_keys_used INTEGER,
  messages_used_today INTEGER,
  images_used_today INTEGER,
  files_used_today INTEGER,
  storage_used_bytes BIGINT,
  storage_used_mb NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boards INTEGER;
  v_blocks INTEGER;
  v_api_keys INTEGER;
  v_messages INTEGER;
  v_images INTEGER;
  v_files INTEGER;
  v_storage BIGINT;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_boards
  FROM public.boards WHERE user_id = p_user_id AND is_archived = FALSE;

  SELECT COUNT(*)::INTEGER INTO v_blocks
  FROM public.blocks b JOIN public.boards bo ON bo.id = b.board_id
  WHERE b.user_id = p_user_id AND bo.is_archived = FALSE;

  SELECT COUNT(*)::INTEGER INTO v_api_keys
  FROM public.api_keys WHERE user_id = p_user_id;

  SELECT COALESCE(messages_used_today, 0), COALESCE(images_used_today, 0), COALESCE(files_used_today, 0)
  INTO v_messages, v_images, v_files
  FROM public.user_subscriptions WHERE user_id = p_user_id AND status = 'active';

  SELECT COALESCE(total_bytes, 0) INTO v_storage
  FROM public.user_storage_usage WHERE user_id = p_user_id;

  RETURN QUERY SELECT
    COALESCE(v_boards, 0), COALESCE(v_blocks, 0), COALESCE(v_api_keys, 0),
    COALESCE(v_messages, 0), COALESCE(v_images, 0), COALESCE(v_files, 0),
    COALESCE(v_storage, 0), ROUND(COALESCE(v_storage, 0)::NUMERIC / (1024 * 1024), 2);
END;
$$;

-- 19. GET ENFORCEMENT STATUS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_enforcement_status(p_user_id UUID)
RETURNS TABLE(
  max_boards INTEGER, max_blocks_per_board INTEGER, max_messages_per_day INTEGER,
  max_api_keys INTEGER, max_images_per_day INTEGER, max_files_per_day INTEGER,
  max_file_size_mb INTEGER, max_message_size_bytes INTEGER, storage_mb INTEGER,
  boards_used INTEGER, blocks_used INTEGER, api_keys_used INTEGER,
  messages_used_today INTEGER, images_used_today INTEGER, files_used_today INTEGER,
  storage_used_bytes BIGINT, storage_used_mb NUMERIC,
  boards_remaining INTEGER, messages_remaining INTEGER, images_remaining INTEGER,
  files_remaining INTEGER, storage_remaining_mb NUMERIC,
  can_create_board BOOLEAN, can_send_message BOOLEAN, can_add_api_key BOOLEAN,
  can_upload_image BOOLEAN, can_upload_file BOOLEAN,
  grace_status public.grace_status, grace_expires_at TIMESTAMPTZ, is_in_grace_period BOOLEAN,
  plan_name TEXT, tier public.subscription_tier
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
  v_usage RECORD;
  v_plan_name TEXT;
  v_tier public.subscription_tier;
BEGIN
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  SELECT * INTO v_usage FROM public.get_user_usage_stats(p_user_id);

  SELECT sp.name, sp.tier INTO v_plan_name, v_tier
  FROM public.user_subscriptions us JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id AND us.status = 'active' LIMIT 1;

  v_plan_name := COALESCE(v_plan_name, 'Free');
  v_tier := COALESCE(v_tier, 'free');

  RETURN QUERY SELECT
    v_limits.max_boards, v_limits.max_blocks_per_board, v_limits.max_messages_per_day,
    v_limits.max_api_keys, v_limits.max_images_per_day, v_limits.max_files_per_day,
    v_limits.max_file_size_mb, v_limits.max_message_size_bytes, v_limits.storage_mb,
    v_usage.boards_used, v_usage.blocks_used, v_usage.api_keys_used,
    v_usage.messages_used_today, v_usage.images_used_today, v_usage.files_used_today,
    v_usage.storage_used_bytes, v_usage.storage_used_mb,
    CASE WHEN v_limits.max_boards = -1 THEN 999999 ELSE GREATEST(0, v_limits.max_boards - v_usage.boards_used) END,
    CASE WHEN v_limits.max_messages_per_day = -1 THEN 999999 ELSE GREATEST(0, v_limits.max_messages_per_day - v_usage.messages_used_today) END,
    CASE WHEN v_limits.max_images_per_day = -1 THEN 999999 ELSE GREATEST(0, v_limits.max_images_per_day - v_usage.images_used_today) END,
    CASE WHEN v_limits.max_files_per_day = -1 THEN 999999 ELSE GREATEST(0, v_limits.max_files_per_day - v_usage.files_used_today) END,
    CASE WHEN v_limits.storage_mb = -1 THEN 999999 ELSE GREATEST(0, v_limits.storage_mb - v_usage.storage_used_mb) END,
    public.can_create_board(p_user_id),
    public.can_send_message(p_user_id, 0),
    public.can_add_api_key(p_user_id),
    public.can_upload_image(p_user_id, 0),
    public.can_upload_file(p_user_id, 0),
    v_limits.grace_status, v_limits.grace_expires_at, public.is_in_grace(p_user_id),
    v_plan_name, v_tier;
END;
$$;

-- 20. ENFORCE MESSAGE INSERT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_message_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_bytes BIGINT;
  v_can_send BOOLEAN;
BEGIN
  v_content_bytes := OCTET_LENGTH(NEW.content);
  NEW.size_bytes := v_content_bytes;
  SELECT public.can_send_message(NEW.user_id, v_content_bytes) INTO v_can_send;
  IF NOT v_can_send THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED:MESSAGE:Daily message limit or storage limit reached';
  END IF;
  PERFORM public.atomic_increment_daily_counter(NEW.user_id, 'messages');
  PERFORM public.atomic_storage_increment(NEW.user_id, v_content_bytes, 0, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_message_insert ON public.messages;
CREATE TRIGGER tr_enforce_message_insert
  BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.enforce_message_insert();

-- 21. ENFORCE UPLOAD INSERT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_upload_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_upload BOOLEAN;
BEGIN
  IF NEW.file_type = 'image' THEN
    SELECT public.can_upload_image(NEW.user_id, NEW.file_size_bytes) INTO v_can_upload;
    IF NOT v_can_upload THEN
      RAISE EXCEPTION 'LIMIT_EXCEEDED:IMAGE:Daily image limit, file size, or storage limit reached';
    END IF;
    PERFORM public.atomic_increment_daily_counter(NEW.user_id, 'images');
    PERFORM public.atomic_storage_increment(NEW.user_id, 0, NEW.file_size_bytes, 0);
  ELSE
    SELECT public.can_upload_file(NEW.user_id, NEW.file_size_bytes) INTO v_can_upload;
    IF NOT v_can_upload THEN
      RAISE EXCEPTION 'LIMIT_EXCEEDED:FILE:Daily file limit, file size, or storage limit reached';
    END IF;
    PERFORM public.atomic_increment_daily_counter(NEW.user_id, 'files');
    PERFORM public.atomic_storage_increment(NEW.user_id, 0, 0, NEW.file_size_bytes);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_upload_insert ON public.uploads;
CREATE TRIGGER tr_enforce_upload_insert
  BEFORE INSERT ON public.uploads FOR EACH ROW EXECUTE FUNCTION public.enforce_upload_insert();

-- 22. ENFORCE BOARD INSERT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_board_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_can_create BOOLEAN;
BEGIN
  SELECT public.can_create_board(NEW.user_id) INTO v_can_create;
  IF NOT v_can_create THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED:BOARD:Maximum boards limit reached or in grace period';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_board_insert ON public.boards;
CREATE TRIGGER tr_enforce_board_insert
  BEFORE INSERT ON public.boards FOR EACH ROW EXECUTE FUNCTION public.enforce_board_insert();

-- 23. ENFORCE BLOCK INSERT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_block_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_can_create BOOLEAN;
BEGIN
  SELECT public.can_create_block(NEW.user_id, NEW.board_id) INTO v_can_create;
  IF NOT v_can_create THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED:BLOCK:Maximum blocks per board limit reached';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_block_insert ON public.blocks;
CREATE TRIGGER tr_enforce_block_insert
  BEFORE INSERT ON public.blocks FOR EACH ROW EXECUTE FUNCTION public.enforce_block_insert();

-- 24. ENFORCE API KEY INSERT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_api_key_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_can_add BOOLEAN;
BEGIN
  SELECT public.can_add_api_key(NEW.user_id) INTO v_can_add;
  IF NOT v_can_add THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED:API_KEY:Maximum API keys limit reached';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_api_key_insert ON public.api_keys;
CREATE TRIGGER tr_enforce_api_key_insert
  BEFORE INSERT ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.enforce_api_key_insert();

-- 25. HANDLE MESSAGE DELETE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_message_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.atomic_storage_increment(OLD.user_id, -COALESCE(OLD.size_bytes, 0), 0, 0);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_message_delete ON public.messages;
CREATE TRIGGER tr_handle_message_delete
  AFTER DELETE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_message_delete();

-- 26. HANDLE UPLOAD DELETE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_upload_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.file_type = 'image' THEN
    PERFORM public.atomic_storage_increment(OLD.user_id, 0, -OLD.file_size_bytes, 0);
  ELSE
    PERFORM public.atomic_storage_increment(OLD.user_id, 0, 0, -OLD.file_size_bytes);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_upload_delete ON public.uploads;
CREATE TRIGGER tr_handle_upload_delete
  AFTER DELETE ON public.uploads FOR EACH ROW EXECUTE FUNCTION public.handle_upload_delete();

-- 27. RECALCULATE USER STORAGE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_user_storage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_messages_bytes BIGINT;
  v_images_bytes BIGINT;
  v_files_bytes BIGINT;
BEGIN
  SELECT COALESCE(SUM(COALESCE(size_bytes, OCTET_LENGTH(content))), 0)
  INTO v_messages_bytes FROM public.messages WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(file_size_bytes), 0) INTO v_images_bytes
  FROM public.uploads WHERE user_id = p_user_id AND file_type = 'image';

  SELECT COALESCE(SUM(file_size_bytes), 0) INTO v_files_bytes
  FROM public.uploads WHERE user_id = p_user_id AND file_type IN ('file', 'document');

  INSERT INTO public.user_storage_usage (user_id, messages_bytes, images_bytes, files_bytes, last_calculated_at)
  VALUES (p_user_id, v_messages_bytes, v_images_bytes, v_files_bytes, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    messages_bytes = v_messages_bytes, images_bytes = v_images_bytes, files_bytes = v_files_bytes,
    last_calculated_at = NOW(), updated_at = NOW();
END;
$$;

-- 28. GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.is_in_grace TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_effective_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enforcement_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_board TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_block TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_send_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_add_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_upload_image TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_upload_file TO authenticated;
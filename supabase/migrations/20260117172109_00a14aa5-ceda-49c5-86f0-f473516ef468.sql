-- ============================================================================
-- FIX API KEY LIMITS: Free = 3, ALL Paid = Unlimited (-1)
-- Also allow multiple keys per provider (drop unique constraint)
-- ============================================================================

-- 1) Update subscription_plans: Free = 3, ALL paid (non-addon) plans = -1 (unlimited)
UPDATE public.subscription_plans SET max_api_keys = 3 WHERE tier = 'free';
UPDATE public.subscription_plans SET max_api_keys = -1 WHERE tier IS NOT NULL AND tier != 'free' AND plan_type != 'addon';

-- 2) Drop the original UNIQUE constraint that prevents multiple keys per provider
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_provider_key;

-- 3) Create indexes for performance (non-unique, allowing multiple keys per provider)
DROP INDEX IF EXISTS idx_api_keys_user_provider;
CREATE INDEX idx_api_keys_user_provider ON public.api_keys(user_id, provider);

DROP INDEX IF EXISTS idx_api_keys_team_provider;
CREATE INDEX idx_api_keys_team_provider ON public.api_keys(team_id, provider) WHERE team_id IS NOT NULL;

-- 4) Drop dependent functions first, then recreate get_user_effective_limits
DROP FUNCTION IF EXISTS public.get_user_subscription(UUID);
DROP FUNCTION IF EXISTS public.get_user_effective_limits(UUID);

-- Recreate get_user_effective_limits to check user_billing for paid status
CREATE FUNCTION public.get_user_effective_limits(p_user_id UUID)
RETURNS TABLE (
  max_boards INTEGER,
  max_blocks_per_board INTEGER,
  max_messages_per_day INTEGER,
  max_api_keys INTEGER,
  max_seats INTEGER,
  storage_mb INTEGER,
  max_images_per_day INTEGER,
  max_files_per_day INTEGER,
  max_file_size_mb INTEGER,
  max_message_size_bytes INTEGER,
  addon_extra_boards INTEGER,
  addon_extra_storage_mb INTEGER,
  grace_status public.grace_status,
  grace_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Free tier defaults
  v_base_boards INTEGER := 1;
  v_base_blocks INTEGER := 3;
  v_base_messages INTEGER := 50;
  v_base_api_keys INTEGER := 3;
  v_base_seats INTEGER := 1;
  v_base_storage INTEGER := 100;
  v_base_images INTEGER := 10;
  v_base_files INTEGER := 5;
  v_base_file_size INTEGER := 10;
  v_base_message_size INTEGER := 102400;
  v_addon_boards INTEGER := 0;
  v_addon_storage INTEGER := 0;
  v_grace_status public.grace_status := 'none';
  v_grace_expires TIMESTAMPTZ := NULL;
  v_has_subscription BOOLEAN := FALSE;
  v_billing_record RECORD;
BEGIN
  -- First check user_billing for Polar-managed subscriptions (source of truth for paid status)
  SELECT * INTO v_billing_record
  FROM public.user_billing ub
  WHERE ub.user_id = p_user_id
    AND ub.subscription_status = 'active'
    AND ub.active_plan IS NOT NULL
    AND ub.active_plan != 'free';

  IF FOUND THEN
    -- User has active paid billing - use billing entitlements and UNLIMITED API keys
    v_base_boards := COALESCE(v_billing_record.boards, 50);
    v_base_blocks := COALESCE(v_billing_record.blocks, -1);
    v_base_storage := COALESCE(v_billing_record.storage_gb, 2) * 1024; -- Convert GB to MB
    v_base_seats := COALESCE(v_billing_record.seats, 1);
    v_base_api_keys := -1; -- UNLIMITED for all paid plans
    v_base_messages := -1; -- Unlimited
    v_base_images := -1;
    v_base_files := -1;
    v_base_file_size := 50;
    v_base_message_size := -1;
    v_has_subscription := TRUE;
  ELSE
    -- Fallback to legacy user_subscriptions table
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
      v_base_file_size, v_base_message_size, v_grace_status, v_grace_expires,
      v_has_subscription
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = p_user_id AND us.status = 'active'
    LIMIT 1;
  END IF;

  -- If no subscription found, use free tier defaults (already set)
  IF NOT v_has_subscription THEN
    v_base_boards := 1;
    v_base_blocks := 3;
    v_base_messages := 50;
    v_base_api_keys := 3;
    v_base_seats := 1;
    v_base_storage := 100;
    v_base_images := 10;
    v_base_files := 5;
    v_base_file_size := 10;
    v_base_message_size := 102400;
  END IF;

  -- Add addon bonuses
  SELECT
    COALESCE(SUM(COALESCE(ua.snapshot_extra_boards, sp.extra_boards) * ua.quantity), 0),
    COALESCE(SUM(COALESCE(ua.snapshot_storage_mb, sp.storage_mb) * ua.quantity), 0)
  INTO v_addon_boards, v_addon_storage
  FROM public.user_addons ua
  JOIN public.subscription_plans sp ON sp.id = ua.addon_plan_id
  WHERE ua.user_id = p_user_id
    AND ua.is_active = TRUE
    AND (ua.expires_at IS NULL OR ua.expires_at > NOW());

  RETURN QUERY SELECT
    CASE WHEN v_base_boards = -1 THEN -1 ELSE v_base_boards + v_addon_boards END,
    v_base_blocks,
    v_base_messages,
    v_base_api_keys,
    v_base_seats,
    CASE WHEN v_base_storage = -1 THEN -1 ELSE v_base_storage + v_addon_storage END,
    v_base_images,
    v_base_files,
    v_base_file_size,
    v_base_message_size,
    v_addon_boards,
    v_addon_storage,
    v_grace_status,
    v_grace_expires;
END;
$$;

-- 5) Recreate get_user_subscription function that depends on get_user_effective_limits
CREATE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_id UUID,
  plan_name TEXT,
  tier public.subscription_tier,
  status public.subscription_status,
  max_boards INTEGER,
  max_blocks_per_board INTEGER,
  max_messages_per_day INTEGER,
  max_api_keys INTEGER,
  max_seats INTEGER,
  storage_mb INTEGER,
  messages_used_today INTEGER,
  current_period_end TIMESTAMPTZ,
  grace_status public.grace_status
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits RECORD;
BEGIN
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  
  RETURN QUERY
  SELECT
    us.id,
    us.plan_id,
    sp.name,
    sp.tier,
    us.status,
    v_limits.max_boards,
    v_limits.max_blocks_per_board,
    v_limits.max_messages_per_day,
    v_limits.max_api_keys,
    v_limits.max_seats,
    v_limits.storage_mb,
    us.messages_used_today,
    us.current_period_end,
    v_limits.grace_status
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id AND us.status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::UUID,
      '00000000-0000-0000-0000-000000000001'::UUID,
      'Free'::TEXT,
      'free'::public.subscription_tier,
      'active'::public.subscription_status,
      v_limits.max_boards,
      v_limits.max_blocks_per_board,
      v_limits.max_messages_per_day,
      v_limits.max_api_keys,
      v_limits.max_seats,
      v_limits.storage_mb,
      0,
      NULL::TIMESTAMPTZ,
      'none'::public.grace_status;
  END IF;
END;
$$;

-- 6) Update existing user_subscriptions snapshots for users who have active paid billing
UPDATE public.user_subscriptions us
SET snapshot_max_api_keys = -1
FROM public.user_billing ub
WHERE us.user_id = ub.user_id
  AND ub.subscription_status = 'active'
  AND ub.active_plan IS NOT NULL
  AND ub.active_plan != 'free';

-- 7) Update can_add_api_key to use get_user_effective_limits correctly
CREATE OR REPLACE FUNCTION public.can_add_api_key(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_current_count INTEGER;
BEGIN
  -- Security: Only allow checking own limits (or service role)
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get effective limits (now checks user_billing first for paid status)
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  -- Unlimited = always allow
  IF v_limits.max_api_keys = -1 THEN
    RETURN TRUE;
  END IF;

  -- Count current keys (personal only, team keys don't count against personal limit)
  SELECT COUNT(*) INTO v_current_count
  FROM public.api_keys
  WHERE user_id = p_user_id AND team_id IS NULL;

  RETURN v_current_count < v_limits.max_api_keys;
END;
$$;
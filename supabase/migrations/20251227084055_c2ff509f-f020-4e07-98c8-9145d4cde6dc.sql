-- Harden SECURITY DEFINER functions against RPC abuse by enforcing caller authorization
-- Rule: allow service_role to act on any user, otherwise require auth.uid() matches the user_id argument.

CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only service_role may run global resets
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

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

CREATE OR REPLACE FUNCTION public.user_owns_block(p_user_id uuid, p_block_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' THEN
      EXISTS (
        SELECT 1
        FROM public.blocks
        WHERE id = p_block_id
          AND user_id = p_user_id
      )
    WHEN p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      FALSE
    ELSE
      EXISTS (
        SELECT 1
        FROM public.blocks
        WHERE id = p_block_id
          AND user_id = p_user_id
      )
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' THEN
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    WHEN _user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> _user_id THEN
      FALSE
    ELSE
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.role() = 'service_role' THEN
      COALESCE((
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
      ), 'user'::public.app_role)
    WHEN _user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> _user_id THEN
      'user'::public.app_role
    ELSE
      COALESCE((
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
      ), 'user'::public.app_role)
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_board_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.boards
    WHERE user_id = p_user_id
      AND is_archived = FALSE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_api_key(p_user_id uuid, p_provider llm_provider)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.api_keys
    WHERE user_id = p_user_id
      AND provider = p_provider
      AND is_valid = TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_api_key_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.api_keys
    WHERE user_id = p_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

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

CREATE OR REPLACE FUNCTION public.atomic_storage_increment(
  p_user_id uuid,
  p_messages_delta bigint DEFAULT 0,
  p_images_delta bigint DEFAULT 0,
  p_files_delta bigint DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  INSERT INTO public.user_storage_usage (user_id, messages_bytes, images_bytes, files_bytes)
  VALUES (p_user_id, GREATEST(0, p_messages_delta), GREATEST(0, p_images_delta), GREATEST(0, p_files_delta))
  ON CONFLICT (user_id) DO UPDATE SET
    messages_bytes = GREATEST(0, user_storage_usage.messages_bytes + p_messages_delta),
    images_bytes = GREATEST(0, user_storage_usage.images_bytes + p_images_delta),
    files_bytes = GREATEST(0, user_storage_usage.files_bytes + p_files_delta),
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.atomic_increment_daily_counter(
  p_user_id uuid,
  p_counter_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

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

CREATE OR REPLACE FUNCTION public.is_in_grace(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_grace_status public.grace_status;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    -- return safe default for mismatched callers
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  SELECT grace_status INTO v_grace_status
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  RETURN COALESCE(v_grace_status, 'none') != 'none';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_effective_limits(p_user_id uuid)
RETURNS TABLE(
  max_boards integer,
  max_blocks_per_board integer,
  max_messages_per_day integer,
  max_api_keys integer,
  max_seats integer,
  storage_mb integer,
  addon_extra_boards integer,
  addon_extra_storage_mb integer,
  grace_status grace_status,
  grace_expires_at timestamp with time zone,
  max_images_per_day integer,
  max_files_per_day integer,
  max_file_size_mb integer,
  max_message_size_bytes integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

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

CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id uuid)
RETURNS TABLE(
  boards_used integer,
  blocks_used integer,
  api_keys_used integer,
  messages_used_today integer,
  images_used_today integer,
  files_used_today integer,
  storage_used_bytes bigint,
  storage_used_mb numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

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

CREATE OR REPLACE FUNCTION public.get_enforcement_status(p_user_id uuid)
RETURNS TABLE(
  max_boards integer,
  max_blocks_per_board integer,
  max_messages_per_day integer,
  max_api_keys integer,
  max_images_per_day integer,
  max_files_per_day integer,
  max_file_size_mb integer,
  max_message_size_bytes integer,
  storage_mb integer,
  boards_used integer,
  blocks_used integer,
  api_keys_used integer,
  messages_used_today integer,
  images_used_today integer,
  files_used_today integer,
  storage_used_bytes bigint,
  storage_used_mb numeric,
  boards_remaining integer,
  messages_remaining integer,
  images_remaining integer,
  files_remaining integer,
  storage_remaining_mb numeric,
  can_create_board boolean,
  can_send_message boolean,
  can_add_api_key boolean,
  can_upload_image boolean,
  can_upload_file boolean,
  grace_status grace_status,
  grace_expires_at timestamp with time zone,
  is_in_grace_period boolean,
  plan_name text,
  tier subscription_tier
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_usage RECORD;
  v_plan_name TEXT;
  v_tier public.subscription_tier;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  SELECT * INTO v_usage FROM public.get_user_usage_stats(p_user_id);

  SELECT sp.name, sp.tier INTO v_plan_name, v_tier
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id AND us.status = 'active'
  LIMIT 1;

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

CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id uuid)
RETURNS TABLE(
  subscription_id uuid,
  plan_id uuid,
  plan_name text,
  tier subscription_tier,
  status subscription_status,
  max_boards integer,
  max_blocks_per_board integer,
  max_messages_per_day integer,
  max_api_keys integer,
  max_seats integer,
  storage_mb integer,
  messages_used_today integer,
  current_period_end timestamp with time zone,
  grace_status grace_status
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

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
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
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

CREATE OR REPLACE FUNCTION public.update_user_grace_status(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_board_count INTEGER;
  v_exceeded_boards BOOLEAN := FALSE;
  v_new_status public.grace_status := 'none';
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  IF v_limits.max_boards != -1 THEN
    SELECT public.get_user_board_count(p_user_id) INTO v_board_count;
    v_exceeded_boards := v_board_count > v_limits.max_boards;
  END IF;

  IF v_exceeded_boards THEN
    v_new_status := 'exceeded_boards';
  ELSE
    v_new_status := 'none';
  END IF;

  UPDATE public.user_subscriptions
  SET
    grace_status = v_new_status,
    grace_started_at = CASE
      WHEN v_new_status != 'none' AND grace_status = 'none' THEN NOW()
      WHEN v_new_status = 'none' THEN NULL
      ELSE grace_started_at
    END,
    grace_expires_at = CASE
      WHEN v_new_status != 'none' AND grace_status = 'none' THEN NOW() + INTERVAL '7 days'
      WHEN v_new_status = 'none' THEN NULL
      ELSE grace_expires_at
    END
  WHERE user_id = p_user_id AND status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_board(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_current_count INTEGER;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  IF v_limits.grace_status IN ('exceeded_boards', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;

  IF v_limits.max_boards = -1 THEN
    RETURN TRUE;
  END IF;

  SELECT public.get_user_board_count(p_user_id) INTO v_current_count;
  RETURN v_current_count < v_limits.max_boards;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_block(p_user_id uuid, p_board_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_current_count INTEGER;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF p_user_id IS NULL OR p_board_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  IF v_limits.max_blocks_per_board = -1 THEN
    RETURN TRUE;
  END IF;

  SELECT public.get_board_block_count(p_board_id) INTO v_current_count;
  RETURN v_current_count < v_limits.max_blocks_per_board;
END;
$$;

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
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  IF v_limits.max_api_keys = -1 THEN
    RETURN TRUE;
  END IF;

  SELECT public.get_user_api_key_count(p_user_id) INTO v_current_count;
  RETURN v_current_count < v_limits.max_api_keys;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id uuid, p_message_size_bytes bigint DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_messages_used INTEGER;
  v_storage_used BIGINT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  IF v_limits.grace_status IN ('exceeded_storage', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;

  IF v_limits.max_message_size_bytes != -1 AND p_message_size_bytes > v_limits.max_message_size_bytes THEN
    RETURN FALSE;
  END IF;

  IF v_limits.max_messages_per_day != -1 THEN
    SELECT COALESCE(messages_used_today, 0)
    INTO v_messages_used
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active';

    IF COALESCE(v_messages_used, 0) >= v_limits.max_messages_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF v_limits.storage_mb != -1 THEN
    SELECT COALESCE(total_bytes, 0)
    INTO v_storage_used
    FROM public.user_storage_usage
    WHERE user_id = p_user_id;

    IF (COALESCE(v_storage_used, 0) + p_message_size_bytes) > (v_limits.storage_mb::BIGINT * 1024 * 1024) THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_upload_image(p_user_id uuid, p_file_size_bytes bigint DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_images_today INTEGER;
  v_storage_used BIGINT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  IF v_limits.grace_status IN ('exceeded_storage', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;

  IF v_limits.max_file_size_mb != -1 AND p_file_size_bytes > (v_limits.max_file_size_mb * 1024 * 1024) THEN
    RETURN FALSE;
  END IF;

  IF v_limits.max_images_per_day != -1 THEN
    SELECT COALESCE(images_used_today, 0)
    INTO v_images_today
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active';

    IF COALESCE(v_images_today, 0) >= v_limits.max_images_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF v_limits.storage_mb != -1 THEN
    SELECT COALESCE(total_bytes, 0)
    INTO v_storage_used
    FROM public.user_storage_usage
    WHERE user_id = p_user_id;

    IF (COALESCE(v_storage_used, 0) + p_file_size_bytes) > (v_limits.storage_mb::BIGINT * 1024 * 1024) THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_upload_file(p_user_id uuid, p_file_size_bytes bigint DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_files_today INTEGER;
  v_storage_used BIGINT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);

  IF v_limits.grace_status IN ('exceeded_storage', 'exceeded_both', 'expired') THEN
    RETURN FALSE;
  END IF;

  IF v_limits.max_file_size_mb != -1 AND p_file_size_bytes > (v_limits.max_file_size_mb * 1024 * 1024) THEN
    RETURN FALSE;
  END IF;

  IF v_limits.max_files_per_day != -1 THEN
    SELECT COALESCE(files_used_today, 0)
    INTO v_files_today
    FROM public.user_subscriptions
    WHERE user_id = p_user_id AND status = 'active';

    IF COALESCE(v_files_today, 0) >= v_limits.max_files_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF v_limits.storage_mb != -1 THEN
    SELECT COALESCE(total_bytes, 0)
    INTO v_storage_used
    FROM public.user_storage_usage
    WHERE user_id = p_user_id;

    IF (COALESCE(v_storage_used, 0) + p_file_size_bytes) > (v_limits.storage_mb::BIGINT * 1024 * 1024) THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_user_storage(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_messages_bytes BIGINT;
  v_images_bytes BIGINT;
  v_files_bytes BIGINT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  SELECT COALESCE(SUM(COALESCE(size_bytes, OCTET_LENGTH(content))), 0)
  INTO v_messages_bytes
  FROM public.messages
  WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(file_size_bytes), 0)
  INTO v_images_bytes
  FROM public.uploads
  WHERE user_id = p_user_id AND file_type = 'image';

  SELECT COALESCE(SUM(file_size_bytes), 0)
  INTO v_files_bytes
  FROM public.uploads
  WHERE user_id = p_user_id AND file_type IN ('file', 'document');

  INSERT INTO public.user_storage_usage (user_id, messages_bytes, images_bytes, files_bytes, last_calculated_at)
  VALUES (p_user_id, v_messages_bytes, v_images_bytes, v_files_bytes, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    messages_bytes = v_messages_bytes,
    images_bytes = v_images_bytes,
    files_bytes = v_files_bytes,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$;

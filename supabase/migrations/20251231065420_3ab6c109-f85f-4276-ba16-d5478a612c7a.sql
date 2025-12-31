-- Drop and recreate get_user_effective_limits to not use user_addons table
-- Instead, it will use user_billing table which has the addon data embedded

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
  grace_status public.grace_status,
  grace_expires_at timestamptz,
  max_images_per_day integer,
  max_files_per_day integer,
  max_file_size_mb integer,
  max_message_size_bytes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boards INTEGER := 3;
  v_blocks INTEGER := 10;
  v_messages INTEGER := 50;
  v_api_keys INTEGER := 2;
  v_seats INTEGER := 1;
  v_storage INTEGER := 100;
  v_images INTEGER := 5;
  v_files INTEGER := 3;
  v_file_size INTEGER := 5;
  v_msg_size INTEGER := 51200;
  v_grace_status public.grace_status := 'none';
  v_has_billing BOOLEAN := FALSE;
BEGIN
  -- Security check
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  -- Get limits from user_billing (this is the source of truth now)
  SELECT
    COALESCE(ub.boards, 3),
    COALESCE(ub.blocks, 10),
    50, -- messages per day (not tracked in user_billing, use default)
    2,  -- api_keys (not tracked in user_billing, use default)
    COALESCE(ub.seats, 1),
    COALESCE(ub.storage_gb * 1024, 100), -- convert GB to MB
    TRUE
  INTO
    v_boards, v_blocks, v_messages, v_api_keys, v_seats, v_storage, v_has_billing
  FROM public.user_billing ub
  WHERE ub.user_id = p_user_id
  LIMIT 1;

  -- If no billing record, use free tier defaults
  IF NOT v_has_billing THEN
    v_boards := 3;
    v_blocks := 10;
    v_messages := 50;
    v_api_keys := 2;
    v_seats := 1;
    v_storage := 100;
  END IF;

  RETURN QUERY SELECT
    v_boards,
    v_blocks,
    v_messages,
    v_api_keys,
    v_seats,
    v_storage,
    0, -- addon_extra_boards (now embedded in boards from user_billing)
    0, -- addon_extra_storage_mb (now embedded in storage from user_billing)
    v_grace_status,
    NULL::timestamptz,
    v_images,
    v_files,
    v_file_size,
    v_msg_size;
END;
$$;
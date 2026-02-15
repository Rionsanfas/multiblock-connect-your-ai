
-- =============================================
-- SUBSCRIPTION DOWNGRADE SYSTEM
-- Adds locked state columns and downgrade functions
-- =============================================

-- 1. Add locked columns to boards
ALTER TABLE boards
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- 2. Add locked columns to blocks
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- 3. Add active/disabled columns to api_keys
ALTER TABLE api_keys
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- 4. Add downgrade tracking to user_billing
ALTER TABLE user_billing
ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- =============================================
-- FUNCTION: handle_subscription_downgrade
-- Called when trial expires or subscription canceled
-- Locks excess boards/blocks/keys beyond free tier limits
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_subscription_downgrade(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_limit INTEGER := 1;
  v_block_limit INTEGER := 3;
  v_api_key_limit INTEGER := 3;
  v_board_count INTEGER;
  v_api_key_count INTEGER;
BEGIN
  -- Count user's current boards and API keys
  SELECT COUNT(*) INTO v_board_count FROM boards WHERE user_id = p_user_id AND team_id IS NULL;
  SELECT COUNT(*) INTO v_api_key_count FROM api_keys WHERE user_id = p_user_id AND team_id IS NULL;

  -- First unlock everything (in case of re-downgrade)
  UPDATE boards SET is_locked = false, locked_at = NULL, locked_reason = NULL
  WHERE user_id = p_user_id AND team_id IS NULL;
  
  UPDATE blocks SET is_locked = false, locked_at = NULL
  WHERE user_id = p_user_id;

  UPDATE api_keys SET is_active = true, disabled_at = NULL, disabled_reason = NULL
  WHERE user_id = p_user_id AND team_id IS NULL;

  -- Lock boards beyond free limit (keep oldest ones unlocked)
  IF v_board_count > v_board_limit THEN
    UPDATE boards
    SET 
      is_locked = true,
      locked_at = NOW(),
      locked_reason = 'Exceeds free tier limit - Upgrade to unlock'
    WHERE user_id = p_user_id
      AND team_id IS NULL
      AND id NOT IN (
        SELECT id FROM boards 
        WHERE user_id = p_user_id AND team_id IS NULL
        ORDER BY created_at ASC 
        LIMIT v_board_limit
      );
  END IF;

  -- Lock blocks beyond 3 per board (free tier limit)
  UPDATE blocks
  SET 
    is_locked = true,
    locked_at = NOW()
  WHERE board_id IN (SELECT id FROM boards WHERE user_id = p_user_id)
    AND id NOT IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY board_id ORDER BY created_at ASC) as rn
        FROM blocks
        WHERE board_id IN (SELECT id FROM boards WHERE user_id = p_user_id)
      ) sub WHERE sub.rn <= v_block_limit
    );

  -- Disable API keys beyond free limit (keep oldest ones active)
  IF v_api_key_count > v_api_key_limit THEN
    UPDATE api_keys
    SET 
      is_active = false,
      disabled_at = NOW(),
      disabled_reason = 'Exceeds free tier limit - Upgrade to enable'
    WHERE user_id = p_user_id
      AND team_id IS NULL
      AND id NOT IN (
        SELECT id FROM api_keys 
        WHERE user_id = p_user_id AND team_id IS NULL
        ORDER BY created_at ASC 
        LIMIT v_api_key_limit
      );
  END IF;

  -- Update user_billing
  UPDATE user_billing
  SET 
    downgraded_at = NOW(),
    grace_period_ends_at = NOW() + INTERVAL '3 days',
    active_plan = 'free',
    subscription_status = 'inactive',
    boards = 1,
    blocks = 3,
    storage_gb = 0,
    seats = 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- =============================================
-- FUNCTION: handle_subscription_upgrade
-- Called when user upgrades - removes all locks
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_subscription_upgrade(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Unlock all boards
  UPDATE boards
  SET is_locked = false, locked_at = NULL, locked_reason = NULL
  WHERE user_id = p_user_id AND is_locked = true;

  -- Unlock all blocks
  UPDATE blocks
  SET is_locked = false, locked_at = NULL
  WHERE user_id = p_user_id AND is_locked = true;

  -- Re-enable all API keys
  UPDATE api_keys
  SET is_active = true, disabled_at = NULL, disabled_reason = NULL
  WHERE user_id = p_user_id AND is_active = false;

  -- Clear downgrade tracking
  UPDATE user_billing
  SET downgraded_at = NULL, grace_period_ends_at = NULL
  WHERE user_id = p_user_id;
END;
$$;

-- =============================================
-- FUNCTION: check_board_locked
-- Check if a board is locked (for use in RLS/app logic)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_board_locked(p_board_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_locked FROM boards WHERE id = p_board_id),
    false
  );
$$;

-- =============================================
-- FUNCTION: is_block_locked
-- Check if a block or its parent board is locked
-- =============================================
CREATE OR REPLACE FUNCTION public.is_block_locked(p_block_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT b.is_locked OR COALESCE(bo.is_locked, false)
     FROM blocks b
     JOIN boards bo ON bo.id = b.board_id
     WHERE b.id = p_block_id),
    false
  );
$$;

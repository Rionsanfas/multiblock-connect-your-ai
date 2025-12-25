-- ============================================================================
-- MIGRATION 1: SCHEMA CHANGES
-- ============================================================================

-- Drop unique constraint on tier
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_tier_key;

-- Add starter to enum
DO $$ BEGIN ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'starter'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create enums
DO $$ BEGIN CREATE TYPE public.billing_period AS ENUM ('monthly', 'yearly', 'lifetime', 'one_time'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.grace_status AS ENUM ('none', 'exceeded_boards', 'exceeded_storage', 'exceeded_both', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add columns to subscription_plans
ALTER TABLE public.subscription_plans 
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS storage_mb INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS billing_period public.billing_period NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS price_lifetime INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_boards INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.subscription_plans ALTER COLUMN tier DROP NOT NULL;

-- Add columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
  ADD COLUMN IF NOT EXISTS grace_status public.grace_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS grace_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snapshot_max_boards INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_max_blocks_per_board INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_max_messages_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_max_api_keys INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_max_seats INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_storage_mb INTEGER;

-- Unique active subscription
DROP INDEX IF EXISTS idx_user_subscriptions_unique_active;
CREATE UNIQUE INDEX idx_user_subscriptions_unique_active ON public.user_subscriptions(user_id) WHERE status = 'active';

-- Create user_addons table
CREATE TABLE IF NOT EXISTS public.user_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addon_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  polar_order_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  quantity INTEGER NOT NULL DEFAULT 1,
  snapshot_extra_boards INTEGER,
  snapshot_storage_mb INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_user_addons_polar_order_unique;
CREATE UNIQUE INDEX idx_user_addons_polar_order_unique ON public.user_addons(polar_order_id) WHERE polar_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_addons_user_active ON public.user_addons(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_addons_plan ON public.user_addons(addon_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_expires ON public.user_addons(expires_at) WHERE expires_at IS NOT NULL;

-- RLS for user_addons
ALTER TABLE public.user_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own addons" ON public.user_addons;
CREATE POLICY "Users can view their own addons" ON public.user_addons FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage all addons" ON public.user_addons;
CREATE POLICY "Service role can manage all addons" ON public.user_addons FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Triggers
CREATE OR REPLACE FUNCTION public.validate_addon_plan_type() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE id = NEW.addon_plan_id AND plan_type = 'addon') THEN RAISE EXCEPTION 'addon_plan_id must reference addon'; END IF; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_validate_addon_plan_type ON public.user_addons;
CREATE TRIGGER trg_validate_addon_plan_type BEFORE INSERT OR UPDATE ON public.user_addons FOR EACH ROW EXECUTE FUNCTION public.validate_addon_plan_type();

CREATE OR REPLACE FUNCTION public.snapshot_subscription_limits() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN SELECT sp.max_boards, sp.max_blocks_per_board, sp.max_messages_per_day, sp.max_api_keys, sp.max_seats, sp.storage_mb INTO NEW.snapshot_max_boards, NEW.snapshot_max_blocks_per_board, NEW.snapshot_max_messages_per_day, NEW.snapshot_max_api_keys, NEW.snapshot_max_seats, NEW.snapshot_storage_mb FROM public.subscription_plans sp WHERE sp.id = NEW.plan_id; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_snapshot_subscription_limits ON public.user_subscriptions;
CREATE TRIGGER trg_snapshot_subscription_limits BEFORE INSERT OR UPDATE OF plan_id ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.snapshot_subscription_limits();

CREATE OR REPLACE FUNCTION public.snapshot_addon_limits() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN SELECT sp.extra_boards, sp.storage_mb INTO NEW.snapshot_extra_boards, NEW.snapshot_storage_mb FROM public.subscription_plans sp WHERE sp.id = NEW.addon_plan_id; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_snapshot_addon_limits ON public.user_addons;
CREATE TRIGGER trg_snapshot_addon_limits BEFORE INSERT ON public.user_addons FOR EACH ROW EXECUTE FUNCTION public.snapshot_addon_limits();

DROP TRIGGER IF EXISTS set_user_addons_updated_at ON public.user_addons;
CREATE TRIGGER set_user_addons_updated_at BEFORE UPDATE ON public.user_addons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Drop and recreate functions with new signatures
DROP FUNCTION IF EXISTS public.get_user_effective_limits(UUID);
DROP FUNCTION IF EXISTS public.get_user_subscription(UUID);

CREATE FUNCTION public.get_user_effective_limits(p_user_id UUID)
RETURNS TABLE (max_boards INTEGER, max_blocks_per_board INTEGER, max_messages_per_day INTEGER, max_api_keys INTEGER, max_seats INTEGER, storage_mb INTEGER, addon_extra_boards INTEGER, addon_extra_storage_mb INTEGER, grace_status public.grace_status, grace_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_base_boards INTEGER := 3; v_base_blocks INTEGER := 10; v_base_messages INTEGER := 50; v_base_api_keys INTEGER := 2; v_base_seats INTEGER := 1; v_base_storage INTEGER := 100; v_addon_boards INTEGER := 0; v_addon_storage INTEGER := 0; v_grace_status public.grace_status := 'none'; v_grace_expires TIMESTAMPTZ := NULL; v_has_subscription BOOLEAN := FALSE;
BEGIN
  SELECT COALESCE(us.snapshot_max_boards, sp.max_boards), COALESCE(us.snapshot_max_blocks_per_board, sp.max_blocks_per_board), COALESCE(us.snapshot_max_messages_per_day, sp.max_messages_per_day), COALESCE(us.snapshot_max_api_keys, sp.max_api_keys), COALESCE(us.snapshot_max_seats, sp.max_seats), COALESCE(us.snapshot_storage_mb, sp.storage_mb), us.grace_status, us.grace_expires_at, TRUE INTO v_base_boards, v_base_blocks, v_base_messages, v_base_api_keys, v_base_seats, v_base_storage, v_grace_status, v_grace_expires, v_has_subscription FROM public.user_subscriptions us JOIN public.subscription_plans sp ON sp.id = us.plan_id WHERE us.user_id = p_user_id AND us.status = 'active' LIMIT 1;
  IF NOT v_has_subscription THEN v_base_boards := 3; v_base_blocks := 10; v_base_messages := 50; v_base_api_keys := 2; v_base_seats := 1; v_base_storage := 100; END IF;
  SELECT COALESCE(SUM(COALESCE(ua.snapshot_extra_boards, sp.extra_boards) * ua.quantity), 0), COALESCE(SUM(COALESCE(ua.snapshot_storage_mb, sp.storage_mb) * ua.quantity), 0) INTO v_addon_boards, v_addon_storage FROM public.user_addons ua JOIN public.subscription_plans sp ON sp.id = ua.addon_plan_id WHERE ua.user_id = p_user_id AND ua.is_active = TRUE AND (ua.expires_at IS NULL OR ua.expires_at > NOW());
  RETURN QUERY SELECT CASE WHEN v_base_boards = -1 THEN -1 ELSE v_base_boards + v_addon_boards END, v_base_blocks, v_base_messages, v_base_api_keys, v_base_seats, CASE WHEN v_base_storage = -1 THEN -1 ELSE v_base_storage + v_addon_storage END, v_addon_boards, v_addon_storage, v_grace_status, v_grace_expires;
END; $$;

CREATE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (subscription_id UUID, plan_id UUID, plan_name TEXT, tier public.subscription_tier, status public.subscription_status, max_boards INTEGER, max_blocks_per_board INTEGER, max_messages_per_day INTEGER, max_api_keys INTEGER, max_seats INTEGER, storage_mb INTEGER, messages_used_today INTEGER, current_period_end TIMESTAMPTZ, grace_status public.grace_status)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limits RECORD;
BEGIN
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  RETURN QUERY SELECT us.id, us.plan_id, sp.name, sp.tier, us.status, v_limits.max_boards, v_limits.max_blocks_per_board, v_limits.max_messages_per_day, v_limits.max_api_keys, v_limits.max_seats, v_limits.storage_mb, us.messages_used_today, us.current_period_end, v_limits.grace_status FROM public.user_subscriptions us JOIN public.subscription_plans sp ON sp.id = us.plan_id WHERE us.user_id = p_user_id AND us.status = 'active' LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT NULL::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Free'::TEXT, 'free'::public.subscription_tier, 'active'::public.subscription_status, v_limits.max_boards, v_limits.max_blocks_per_board, v_limits.max_messages_per_day, v_limits.max_api_keys, v_limits.max_seats, v_limits.storage_mb, 0, NULL::TIMESTAMPTZ, 'none'::public.grace_status; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.can_create_board(p_user_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limits RECORD; v_current_count INTEGER;
BEGIN IF p_user_id IS NULL THEN RETURN FALSE; END IF; SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id); IF v_limits.max_boards = -1 THEN RETURN TRUE; END IF; IF v_limits.grace_status IN ('exceeded_boards', 'exceeded_both') THEN RETURN FALSE; END IF; SELECT public.get_user_board_count(p_user_id) INTO v_current_count; RETURN v_current_count < v_limits.max_boards; END; $$;

CREATE OR REPLACE FUNCTION public.can_create_block(p_user_id UUID, p_board_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limits RECORD; v_current_count INTEGER;
BEGIN IF p_user_id IS NULL OR p_board_id IS NULL THEN RETURN FALSE; END IF; SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id); IF v_limits.max_blocks_per_board = -1 THEN RETURN TRUE; END IF; SELECT public.get_board_block_count(p_board_id) INTO v_current_count; RETURN v_current_count < v_limits.max_blocks_per_board; END; $$;

CREATE OR REPLACE FUNCTION public.can_send_message(p_user_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limits RECORD; v_messages_used INTEGER;
BEGIN IF p_user_id IS NULL THEN RETURN FALSE; END IF; SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id); IF v_limits.max_messages_per_day = -1 THEN RETURN TRUE; END IF; SELECT COALESCE(us.messages_used_today, 0) INTO v_messages_used FROM public.user_subscriptions us WHERE us.user_id = p_user_id AND us.status = 'active'; IF NOT FOUND THEN v_messages_used := 0; END IF; RETURN v_messages_used < v_limits.max_messages_per_day; END; $$;

CREATE OR REPLACE FUNCTION public.update_user_grace_status(p_user_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limits RECORD; v_board_count INTEGER; v_exceeded_boards BOOLEAN := FALSE; v_new_status public.grace_status := 'none';
BEGIN
  SELECT * INTO v_limits FROM public.get_user_effective_limits(p_user_id);
  IF v_limits.max_boards != -1 THEN SELECT public.get_user_board_count(p_user_id) INTO v_board_count; v_exceeded_boards := v_board_count > v_limits.max_boards; END IF;
  IF v_exceeded_boards THEN v_new_status := 'exceeded_boards'; ELSE v_new_status := 'none'; END IF;
  UPDATE public.user_subscriptions SET grace_status = v_new_status, grace_started_at = CASE WHEN v_new_status != 'none' AND grace_status = 'none' THEN NOW() WHEN v_new_status = 'none' THEN NULL ELSE grace_started_at END, grace_expires_at = CASE WHEN v_new_status != 'none' AND grace_status = 'none' THEN NOW() + INTERVAL '7 days' WHEN v_new_status = 'none' THEN NULL ELSE grace_expires_at END WHERE user_id = p_user_id AND status = 'active';
END; $$;
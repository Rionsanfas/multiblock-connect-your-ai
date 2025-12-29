-- =============================================
-- BILLING SYSTEM OVERHAUL: Remove Stripe, Add Polar Tables
-- =============================================

-- 1. Remove Stripe-specific columns from user_subscriptions
ALTER TABLE public.user_subscriptions 
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- 2. Create new subscriptions table (Polar-focused)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'polar',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  period TEXT NOT NULL DEFAULT 'annual' CHECK (period IN ('annual', 'lifetime', 'monthly')),
  is_lifetime BOOLEAN NOT NULL DEFAULT false,
  polar_subscription_id TEXT,
  polar_customer_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Create subscription_entitlements table (THE SOURCE OF TRUTH)
CREATE TABLE IF NOT EXISTS public.subscription_entitlements (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  boards_limit INTEGER NOT NULL DEFAULT 1,
  storage_gb INTEGER NOT NULL DEFAULT 1,
  seats INTEGER NOT NULL DEFAULT 1,
  blocks_unlimited BOOLEAN NOT NULL DEFAULT false,
  source_plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create subscription_addons table
CREATE TABLE IF NOT EXISTS public.subscription_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addon_key TEXT NOT NULL,
  extra_boards INTEGER NOT NULL DEFAULT 0,
  extra_storage_gb INTEGER NOT NULL DEFAULT 0,
  polar_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Enable RLS on new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_addons ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 7. RLS policies for subscription_entitlements
CREATE POLICY "Users can view their own entitlements"
  ON public.subscription_entitlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all entitlements"
  ON public.subscription_entitlements FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. RLS policies for subscription_addons
CREATE POLICY "Users can view their own addons"
  ON public.subscription_addons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all addons"
  ON public.subscription_addons FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_addons_user_id ON public.subscription_addons(user_id);

-- 10. Create trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscription_entitlements_updated_at
  BEFORE UPDATE ON public.subscription_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscription_addons_updated_at
  BEFORE UPDATE ON public.subscription_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 11. Create function to get user entitlements with addon stacking
CREATE OR REPLACE FUNCTION public.get_user_entitlements(p_user_id UUID)
RETURNS TABLE (
  boards_limit INTEGER,
  storage_gb INTEGER,
  seats INTEGER,
  blocks_unlimited BOOLEAN,
  source_plan TEXT,
  extra_boards INTEGER,
  extra_storage_gb INTEGER,
  total_boards INTEGER,
  total_storage_gb INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_boards INTEGER := 1;
  v_storage INTEGER := 1;
  v_seats INTEGER := 1;
  v_blocks_unlimited BOOLEAN := false;
  v_source TEXT := 'free';
  v_extra_boards INTEGER := 0;
  v_extra_storage INTEGER := 0;
BEGIN
  -- Get base entitlements
  SELECT 
    COALESCE(e.boards_limit, 1),
    COALESCE(e.storage_gb, 1),
    COALESCE(e.seats, 1),
    COALESCE(e.blocks_unlimited, false),
    COALESCE(e.source_plan, 'free')
  INTO v_boards, v_storage, v_seats, v_blocks_unlimited, v_source
  FROM public.subscription_entitlements e
  WHERE e.user_id = p_user_id;

  -- Sum up addon bonuses
  SELECT 
    COALESCE(SUM(a.extra_boards), 0),
    COALESCE(SUM(a.extra_storage_gb), 0)
  INTO v_extra_boards, v_extra_storage
  FROM public.subscription_addons a
  WHERE a.user_id = p_user_id;

  RETURN QUERY SELECT
    v_boards,
    v_storage,
    v_seats,
    v_blocks_unlimited,
    v_source,
    v_extra_boards,
    v_extra_storage,
    v_boards + v_extra_boards,
    v_storage + v_extra_storage;
END;
$$;

-- 12. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_entitlements(UUID) TO authenticated;
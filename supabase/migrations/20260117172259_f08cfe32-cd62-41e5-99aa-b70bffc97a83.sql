-- Create user_addons table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_addons_user_active ON public.user_addons(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_addons_plan ON public.user_addons(addon_plan_id);

-- Enable RLS
ALTER TABLE public.user_addons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own addons" ON public.user_addons;
CREATE POLICY "Users can view their own addons" ON public.user_addons FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all addons" ON public.user_addons;
CREATE POLICY "Service role can manage all addons" ON public.user_addons FOR ALL 
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
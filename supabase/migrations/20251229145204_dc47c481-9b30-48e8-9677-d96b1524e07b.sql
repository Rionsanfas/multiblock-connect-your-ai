-- Add missing columns to user_billing table for complete entitlement tracking
ALTER TABLE public.user_billing
  ADD COLUMN IF NOT EXISTS boards INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS blocks INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS storage_gb INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN public.user_billing.boards IS 'Total boards allowed (plan + add-ons)';
COMMENT ON COLUMN public.user_billing.blocks IS 'Blocks per board limit (-1 for unlimited)';
COMMENT ON COLUMN public.user_billing.storage_gb IS 'Total storage in GB (plan + add-ons)';
COMMENT ON COLUMN public.user_billing.seats IS 'Number of seats for the plan';
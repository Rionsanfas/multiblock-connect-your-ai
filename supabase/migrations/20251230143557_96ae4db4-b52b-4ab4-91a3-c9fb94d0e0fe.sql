-- Consolidate billing into a single table (user_billing) and remove unused billing tables

-- 1) Extend user_billing with additional fields directly from Polar payloads
ALTER TABLE public.user_billing
ADD COLUMN IF NOT EXISTS polar_subscription_id text,
ADD COLUMN IF NOT EXISTS product_id text,
ADD COLUMN IF NOT EXISTS product_price_id text,
ADD COLUMN IF NOT EXISTS last_event_type text,
ADD COLUMN IF NOT EXISTS last_event_id text;

-- 2) Remove empty/unused billing tables (webhook will be updated to stop using them)
DROP TABLE IF EXISTS public.subscriptions;
DROP TABLE IF EXISTS public.subscription_entitlements;
DROP TABLE IF EXISTS public.subscription_addons;
DROP TABLE IF EXISTS public.user_addons;
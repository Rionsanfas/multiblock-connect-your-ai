
-- ============================================
-- 1. Deactivate all existing active plans
-- ============================================
UPDATE public.subscription_plans
SET is_active = false, updated_at = now()
WHERE is_active = true;

-- ============================================
-- 2. Fix Free Plan limits
-- ============================================
UPDATE public.subscription_plans
SET
  max_boards = 1,
  max_blocks_per_board = 3,
  storage_mb = 100,
  max_messages_per_day = 50,
  max_api_keys = 3,
  max_seats = 1,
  is_active = true,
  updated_at = now()
WHERE name = 'Free' AND tier = 'free';

-- ============================================
-- 3. Insert Pro Monthly
-- ============================================
INSERT INTO public.subscription_plans (
  name, tier, plan_type, billing_period, is_lifetime,
  price_monthly, price_yearly, price_lifetime,
  max_boards, max_blocks_per_board, max_messages_per_day,
  storage_mb, max_seats, max_api_keys, max_file_size_mb,
  max_files_per_day, max_images_per_day, max_message_size_bytes,
  checkout_url, features, is_active, sort_order
) VALUES (
  'Pro Monthly', 'pro', 'subscription', 'monthly', false,
  1900, 0, 0,
  50, 9999, 9999,
  5120, 1, 9999, 50,
  100, 100, 524288,
  'https://polar.sh/multiblock/checkout?product=8756df4f-5d81-4e88-8f9f-0e8d2dfe03a3',
  '{"priority_support": true, "all_models": true, "export": true, "mobile_app": true, "infinite_history": true}'::jsonb,
  true, 1
);

-- ============================================
-- 4. Insert Pro Annual
-- ============================================
INSERT INTO public.subscription_plans (
  name, tier, plan_type, billing_period, is_lifetime,
  price_monthly, price_yearly, price_lifetime,
  max_boards, max_blocks_per_board, max_messages_per_day,
  storage_mb, max_seats, max_api_keys, max_file_size_mb,
  max_files_per_day, max_images_per_day, max_message_size_bytes,
  checkout_url, features, is_active, sort_order
) VALUES (
  'Pro Annual', 'pro', 'subscription', 'yearly', false,
  0, 18200, 0,
  50, 9999, 9999,
  5120, 1, 9999, 50,
  100, 100, 524288,
  'https://polar.sh/multiblock/checkout?product=7ce03e88-d1a3-45f7-a60d-f282aa83e94a',
  '{"priority_support": true, "all_models": true, "export": true, "mobile_app": true, "infinite_history": true}'::jsonb,
  true, 2
);

-- ============================================
-- 5. Insert Pro Team Monthly
-- ============================================
INSERT INTO public.subscription_plans (
  name, tier, plan_type, billing_period, is_lifetime,
  price_monthly, price_yearly, price_lifetime,
  max_boards, max_blocks_per_board, max_messages_per_day,
  storage_mb, max_seats, max_api_keys, max_file_size_mb,
  max_files_per_day, max_images_per_day, max_message_size_bytes,
  checkout_url, features, is_active, sort_order
) VALUES (
  'Pro Team Monthly', 'team', 'subscription', 'monthly', false,
  4900, 0, 0,
  50, 9999, 9999,
  20480, 10, 9999, 50,
  100, 100, 524288,
  'https://polar.sh/multiblock/checkout?product=bbace997-28ad-4afe-877e-b932e41e29c6',
  '{"priority_support": true, "all_models": true, "export": true, "mobile_app": true, "infinite_history": true, "shared_boards": true, "team_context": true, "admin_controls": true, "analytics": true, "audit_logs": true}'::jsonb,
  true, 3
);

-- ============================================
-- 6. Insert Pro Team Annual
-- ============================================
INSERT INTO public.subscription_plans (
  name, tier, plan_type, billing_period, is_lifetime,
  price_monthly, price_yearly, price_lifetime,
  max_boards, max_blocks_per_board, max_messages_per_day,
  storage_mb, max_seats, max_api_keys, max_file_size_mb,
  max_files_per_day, max_images_per_day, max_message_size_bytes,
  checkout_url, features, is_active, sort_order
) VALUES (
  'Pro Team Annual', 'team', 'subscription', 'yearly', false,
  0, 47000, 0,
  50, 9999, 9999,
  20480, 10, 9999, 50,
  100, 100, 524288,
  'https://polar.sh/multiblock/checkout?product=4bf80645-0f04-4cac-b614-35af721dc294',
  '{"priority_support": true, "all_models": true, "export": true, "mobile_app": true, "infinite_history": true, "shared_boards": true, "team_context": true, "admin_controls": true, "analytics": true, "audit_logs": true}'::jsonb,
  true, 4
);

-- ============================================
-- 7. Add grandfathering columns to user_billing
-- ============================================
ALTER TABLE public.user_billing
  ADD COLUMN IF NOT EXISTS is_grandfathered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS grandfathered_plan_name text,
  ADD COLUMN IF NOT EXISTS grandfathered_price_cents integer;

-- ============================================
-- 8. Grandfather existing paid users (CORRECTED plan names)
-- ============================================
UPDATE public.user_billing
SET 
  is_grandfathered = true,
  grandfathered_plan_name = active_plan,
  grandfathered_price_cents = CASE
    WHEN active_plan = 'pro-individual-annual' THEN 3000
    WHEN active_plan = 'pro-team-annual' THEN 3900
    WHEN active_plan = 'ltd-pro-individual' THEN 12000
    WHEN active_plan = 'ltd-pro-team' THEN 12900
    ELSE 3000
  END
WHERE active_plan IS NOT NULL 
  AND active_plan != 'free'
  AND (subscription_status = 'active' OR is_lifetime = true);

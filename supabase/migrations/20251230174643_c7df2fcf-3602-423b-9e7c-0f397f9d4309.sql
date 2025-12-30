-- ============================================
-- CANONICAL PLAN ALIGNMENT MIGRATION (FIXED v2)
-- Respects all check constraints
-- ============================================

-- Step 1: Add missing columns to user_billing
ALTER TABLE public.user_billing 
  ADD COLUMN IF NOT EXISTS plan_category TEXT DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'annual',
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS applied_addons JSONB DEFAULT '[]'::jsonb;

-- Step 2: Update the FREE plan
UPDATE public.subscription_plans
SET 
  name = 'Free',
  tier = 'free',
  plan_type = 'subscription',
  billing_period = 'monthly',
  description = 'Perfect for trying out MultiBlock',
  max_boards = 1,
  max_blocks_per_board = 3,
  storage_mb = 100,
  max_seats = 1,
  max_messages_per_day = 50,
  max_api_keys = 2,
  max_images_per_day = 5,
  max_files_per_day = 3,
  max_file_size_mb = 5,
  max_message_size_bytes = 51200,
  price_monthly = 0,
  price_yearly = 0,
  price_lifetime = 0,
  is_lifetime = false,
  is_active = true,
  sort_order = 0,
  extra_boards = 0,
  features = '["1 board", "3 blocks per board", "100 MB storage", "50 messages/day", "Community support"]'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 3: Delete old plans not referenced
DELETE FROM public.subscription_plans 
WHERE id NOT IN ('00000000-0000-0000-0000-000000000001')
  AND id NOT IN (SELECT DISTINCT plan_id FROM public.user_subscriptions);

-- Step 4: INDIVIDUAL ANNUAL plans
INSERT INTO public.subscription_plans (
  id, name, tier, plan_type, billing_period, description,
  max_boards, max_blocks_per_board, storage_mb, max_seats,
  max_messages_per_day, max_api_keys, max_images_per_day, max_files_per_day,
  max_file_size_mb, max_message_size_bytes,
  price_monthly, price_yearly, price_lifetime,
  is_lifetime, is_active, sort_order, extra_boards, features, checkout_url
) VALUES 
(
  '00000000-0000-0000-0000-000000000010',
  'Starter (Individual)', 'starter', 'subscription', 'yearly',
  'For individuals getting started',
  50, -1, 2048, 1, -1, 5, -1, -1, 25, 204800,
  0, 9999, 0, false, true, 10, 0,
  '["50 boards", "Unlimited blocks", "2 GB storage", "1 seat", "1-year access"]'::jsonb,
  'https://buy.polar.sh/polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v'
),
(
  '00000000-0000-0000-0000-000000000011',
  'Pro (Individual)', 'pro', 'subscription', 'yearly',
  'For power users and professionals',
  100, -1, 4096, 1, -1, 10, -1, -1, 50, 512000,
  0, 14999, 0, false, true, 11, 0,
  '["100 boards", "Unlimited blocks", "4 GB storage", "1 seat", "1-year access", "Priority support"]'::jsonb,
  'https://buy.polar.sh/polar_cl_0ANxHBAcEKSneKreosoVddmOPsNRvBMDaHKgv1QrrU9'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, tier = EXCLUDED.tier, max_boards = EXCLUDED.max_boards,
  max_blocks_per_board = EXCLUDED.max_blocks_per_board, storage_mb = EXCLUDED.storage_mb,
  max_seats = EXCLUDED.max_seats, price_yearly = EXCLUDED.price_yearly,
  checkout_url = EXCLUDED.checkout_url, billing_period = EXCLUDED.billing_period,
  is_lifetime = EXCLUDED.is_lifetime, features = EXCLUDED.features, description = EXCLUDED.description;

-- Step 5: TEAM ANNUAL plans
INSERT INTO public.subscription_plans (
  id, name, tier, plan_type, billing_period, description,
  max_boards, max_blocks_per_board, storage_mb, max_seats,
  max_messages_per_day, max_api_keys, max_images_per_day, max_files_per_day,
  max_file_size_mb, max_message_size_bytes,
  price_monthly, price_yearly, price_lifetime,
  is_lifetime, is_active, sort_order, extra_boards, features, checkout_url
) VALUES 
(
  '00000000-0000-0000-0000-000000000020',
  'Starter (Team)', 'starter', 'subscription', 'yearly',
  'For small teams getting started',
  50, -1, 5120, 10, -1, 10, -1, -1, 50, 512000,
  0, 12999, 0, false, true, 20, 0,
  '["50 boards", "Unlimited blocks", "5 GB storage", "10 seats", "1-year access"]'::jsonb,
  'https://buy.polar.sh/polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy'
),
(
  '00000000-0000-0000-0000-000000000021',
  'Pro (Team)', 'pro', 'subscription', 'yearly',
  'For growing teams',
  100, -1, 6144, 20, -1, 25, -1, -1, 100, 1048576,
  0, 17999, 0, false, true, 21, 0,
  '["100 boards", "Unlimited blocks", "6 GB storage", "20 seats", "1-year access", "SSO"]'::jsonb,
  'https://buy.polar.sh/polar_cl_kEOB6DUJjs7JONbOH91zrlACAQDEub2L9px0f3s4BuS'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, tier = EXCLUDED.tier, max_boards = EXCLUDED.max_boards,
  max_blocks_per_board = EXCLUDED.max_blocks_per_board, storage_mb = EXCLUDED.storage_mb,
  max_seats = EXCLUDED.max_seats, price_yearly = EXCLUDED.price_yearly,
  checkout_url = EXCLUDED.checkout_url, billing_period = EXCLUDED.billing_period,
  is_lifetime = EXCLUDED.is_lifetime, features = EXCLUDED.features, description = EXCLUDED.description;

-- Step 6: LIFETIME INDIVIDUAL plans
INSERT INTO public.subscription_plans (
  id, name, tier, plan_type, billing_period, description,
  max_boards, max_blocks_per_board, storage_mb, max_seats,
  max_messages_per_day, max_api_keys, max_images_per_day, max_files_per_day,
  max_file_size_mb, max_message_size_bytes,
  price_monthly, price_yearly, price_lifetime,
  is_lifetime, is_active, sort_order, extra_boards, features, checkout_url
) VALUES 
(
  '00000000-0000-0000-0000-000000000030',
  'LTD Starter (Individual)', 'starter', 'subscription', 'lifetime',
  'Lifetime access for individuals',
  50, -1, 6144, 1, -1, 5, -1, -1, 50, 512000,
  0, 0, 39999, true, true, 30, 0,
  '["50 boards", "Unlimited blocks", "6 GB storage", "1 seat", "Lifetime access"]'::jsonb,
  'https://buy.polar.sh/polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw'
),
(
  '00000000-0000-0000-0000-000000000031',
  'LTD Pro (Individual)', 'pro', 'subscription', 'lifetime',
  'Lifetime Pro for individuals',
  150, -1, 7168, 1, -1, 10, -1, -1, 100, 1048576,
  0, 0, 49999, true, true, 31, 0,
  '["150 boards", "Unlimited blocks", "7 GB storage", "1 seat", "Lifetime access"]'::jsonb,
  'https://buy.polar.sh/polar_cl_j6g5GaxCZ3MqM7FVpqt6vbsqk8zUUuLyUOIgR03k0oU'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, tier = EXCLUDED.tier, max_boards = EXCLUDED.max_boards,
  max_blocks_per_board = EXCLUDED.max_blocks_per_board, storage_mb = EXCLUDED.storage_mb,
  max_seats = EXCLUDED.max_seats, price_lifetime = EXCLUDED.price_lifetime,
  checkout_url = EXCLUDED.checkout_url, billing_period = EXCLUDED.billing_period,
  is_lifetime = EXCLUDED.is_lifetime, features = EXCLUDED.features, description = EXCLUDED.description;

-- Step 7: LIFETIME TEAM plans
INSERT INTO public.subscription_plans (
  id, name, tier, plan_type, billing_period, description,
  max_boards, max_blocks_per_board, storage_mb, max_seats,
  max_messages_per_day, max_api_keys, max_images_per_day, max_files_per_day,
  max_file_size_mb, max_message_size_bytes,
  price_monthly, price_yearly, price_lifetime,
  is_lifetime, is_active, sort_order, extra_boards, features, checkout_url
) VALUES 
(
  '00000000-0000-0000-0000-000000000040',
  'LTD Starter (Team)', 'starter', 'subscription', 'lifetime',
  'Lifetime access for teams',
  150, -1, 8192, 10, -1, 10, -1, -1, 100, 1048576,
  0, 0, 42999, true, true, 40, 0,
  '["150 boards", "Unlimited blocks", "8 GB storage", "10 seats", "Lifetime access"]'::jsonb,
  'https://buy.polar.sh/polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc'
),
(
  '00000000-0000-0000-0000-000000000041',
  'LTD Pro (Team)', 'pro', 'subscription', 'lifetime',
  'Ultimate lifetime team plan',
  200, -1, 9216, 15, -1, 25, -1, -1, 100, 1048576,
  0, 0, 99999, true, true, 41, 0,
  '["200 boards", "Unlimited blocks", "9 GB storage", "15 seats", "Lifetime access", "SSO"]'::jsonb,
  'https://buy.polar.sh/polar_cl_pQBNRD7r0QBz4pp47hOhg21aTfj5MLn9ffRnL0dxbnR'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, tier = EXCLUDED.tier, max_boards = EXCLUDED.max_boards,
  max_blocks_per_board = EXCLUDED.max_blocks_per_board, storage_mb = EXCLUDED.storage_mb,
  max_seats = EXCLUDED.max_seats, price_lifetime = EXCLUDED.price_lifetime,
  checkout_url = EXCLUDED.checkout_url, billing_period = EXCLUDED.billing_period,
  is_lifetime = EXCLUDED.is_lifetime, features = EXCLUDED.features, description = EXCLUDED.description;

-- Step 8: ADD-ONS (tier = NULL, price_lifetime > 0, price_monthly = 0, price_yearly = 0)
-- Also: max_boards = 0, max_blocks_per_board = 0, max_messages_per_day = 0, max_api_keys = 0, max_seats = 0
INSERT INTO public.subscription_plans (
  id, name, tier, plan_type, billing_period, description,
  max_boards, max_blocks_per_board, storage_mb, max_seats,
  max_messages_per_day, max_api_keys, max_images_per_day, max_files_per_day,
  max_file_size_mb, max_message_size_bytes,
  price_monthly, price_yearly, price_lifetime,
  is_lifetime, is_active, sort_order, extra_boards, features, checkout_url
) VALUES 
(
  '00000000-0000-0000-0000-000000000100',
  '+1 GB Add-On', NULL, 'addon', 'one_time',
  '+1 GB storage + 10 boards',
  0, 0, 1024, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 1499, false, true, 100, 10,
  '["+ 1 GB storage", "+ 10 boards"]'::jsonb,
  'https://buy.polar.sh/polar_cl_OBo7BCQ6ZYvqCFhc59DMFZJqfSg2ORRsow1RI3e8hEM'
),
(
  '00000000-0000-0000-0000-000000000101',
  '+2 GB Add-On', NULL, 'addon', 'one_time',
  '+2 GB storage + 20 boards',
  0, 0, 2048, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 1999, false, true, 101, 20,
  '["+ 2 GB storage", "+ 20 boards"]'::jsonb,
  'https://buy.polar.sh/polar_cl_3jJPkH6afjDo1zVJUsauoPKlIclTotWyV9ssE006a3k'
),
(
  '00000000-0000-0000-0000-000000000102',
  '+4 GB Add-On', NULL, 'addon', 'one_time',
  '+4 GB storage + 50 boards',
  0, 0, 4096, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 2999, false, true, 102, 50,
  '["+ 4 GB storage", "+ 50 boards"]'::jsonb,
  'https://buy.polar.sh/polar_cl_1Oj5sYbfwJyVjmzPXnnjnlr9YS2TVCQd7OsyG1IzSMj'
),
(
  '00000000-0000-0000-0000-000000000103',
  '+5 GB Add-On', NULL, 'addon', 'one_time',
  '+5 GB storage + 60 boards',
  0, 0, 5120, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 3499, false, true, 103, 60,
  '["+ 5 GB storage", "+ 60 boards"]'::jsonb,
  'https://buy.polar.sh/polar_cl_BL5ku7NkvCcIsfr2pjq1gHnmn5sN87tkja0IP0PaJDT'
),
(
  '00000000-0000-0000-0000-000000000104',
  '+10 GB Add-On', NULL, 'addon', 'one_time',
  '+10 GB storage + 120 boards',
  0, 0, 10240, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 5999, false, true, 104, 120,
  '["+ 10 GB storage", "+ 120 boards"]'::jsonb,
  'https://buy.polar.sh/polar_cl_JCkbiUFVssy28q7auRRSmERW2XUwIhqt2JnrY2yCy9b'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, storage_mb = EXCLUDED.storage_mb, extra_boards = EXCLUDED.extra_boards,
  checkout_url = EXCLUDED.checkout_url, price_lifetime = EXCLUDED.price_lifetime,
  price_monthly = EXCLUDED.price_monthly, price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features, description = EXCLUDED.description;
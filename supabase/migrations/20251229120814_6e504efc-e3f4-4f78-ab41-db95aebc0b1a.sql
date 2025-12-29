-- Provision subscription for user c67112be-e9b0-43e1-8cd0-e9ead7d19145 (gozusaan@gmail.com)
-- They subscribed to Starter Individual Annual plan

-- 1. Insert into new subscriptions table
INSERT INTO public.subscriptions (user_id, plan_key, provider, status, period, is_lifetime, started_at)
VALUES ('c67112be-e9b0-43e1-8cd0-e9ead7d19145', 'starter-individual-annual', 'polar', 'active', 'annual', false, now())
ON CONFLICT (user_id) DO UPDATE SET
  plan_key = 'starter-individual-annual',
  status = 'active',
  updated_at = now();

-- 2. Insert entitlements (Starter Individual: 50 boards, 2GB storage, 1 seat, unlimited blocks)
INSERT INTO public.subscription_entitlements (user_id, boards_limit, storage_gb, seats, blocks_unlimited, source_plan)
VALUES ('c67112be-e9b0-43e1-8cd0-e9ead7d19145', 50, 2, 1, true, 'starter-individual-annual')
ON CONFLICT (user_id) DO UPDATE SET
  boards_limit = 50,
  storage_gb = 2,
  seats = 1,
  blocks_unlimited = true,
  source_plan = 'starter-individual-annual',
  updated_at = now();

-- 3. ALSO update the OLD user_subscriptions table for backward compatibility
UPDATE public.user_subscriptions
SET 
  snapshot_max_boards = 50,
  snapshot_max_blocks_per_board = 999999,
  snapshot_storage_mb = 2048,
  snapshot_max_seats = 1,
  updated_at = now()
WHERE user_id = 'c67112be-e9b0-43e1-8cd0-e9ead7d19145';
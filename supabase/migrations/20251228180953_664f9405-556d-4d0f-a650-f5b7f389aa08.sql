-- Fix Free plan limits: 1 board, 3 blocks per board
UPDATE subscription_plans
SET 
  max_boards = 1,
  max_blocks_per_board = 3,
  updated_at = now()
WHERE tier = 'free';

-- Also update any existing user_subscriptions on the free plan to have correct snapshot limits
UPDATE user_subscriptions
SET 
  snapshot_max_boards = 1,
  snapshot_max_blocks_per_board = 3,
  updated_at = now()
WHERE plan_id = '00000000-0000-0000-0000-000000000001';
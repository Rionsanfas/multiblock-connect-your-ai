-- Update rionsanfas@gmail.com to starter-individual-annual plan
UPDATE user_billing 
SET 
  active_plan = 'starter-individual-annual',
  plan_category = 'individual',
  billing_type = 'annual',
  subscription_status = 'active',
  is_lifetime = false,
  boards = 50,
  blocks = -1,
  storage_gb = 2,
  seats = 1,
  access_expires_at = NOW() + INTERVAL '1 year',
  current_period_end = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE user_id = 'ae6e340b-d91c-43da-98d5-9d731ff82897';
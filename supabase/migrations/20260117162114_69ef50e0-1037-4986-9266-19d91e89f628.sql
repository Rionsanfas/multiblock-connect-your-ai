-- Remove legacy team API key access-request workflow (team keys are shared to all members now)
DROP TABLE IF EXISTS public.api_key_access_requests CASCADE;

DROP FUNCTION IF EXISTS public.request_api_key_access(UUID, UUID);
DROP FUNCTION IF EXISTS public.resolve_api_key_request(UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.has_team_api_key_access(UUID);
DROP FUNCTION IF EXISTS public.get_pending_api_key_requests_count(UUID);

-- Enum only used by the removed request table
DROP TYPE IF EXISTS public.api_key_request_status;

-- Free plan: allow 3 personal API keys
UPDATE public.subscription_plans
SET max_api_keys = 3
WHERE tier = 'free';

-- Ensure existing free users get the new limit (snapshots are used for enforcement)
UPDATE public.user_subscriptions us
SET snapshot_max_api_keys = 3
FROM public.subscription_plans sp
WHERE us.plan_id = sp.id
  AND sp.tier = 'free';

-- Drop the old unique constraint that doesn't account for team_id
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_provider_key;

-- Create two partial unique indexes:
-- 1. Personal keys: unique per user + provider where team_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_personal_unique 
ON public.api_keys (user_id, provider) 
WHERE team_id IS NULL;

-- 2. Team keys: unique per team + provider
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_team_unique 
ON public.api_keys (team_id, provider) 
WHERE team_id IS NOT NULL;
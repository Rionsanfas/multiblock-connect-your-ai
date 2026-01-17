-- Drop the team unique constraint that's blocking multiple keys per provider for teams
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_team_unique;
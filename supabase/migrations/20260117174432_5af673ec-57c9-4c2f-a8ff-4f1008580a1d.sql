-- Drop the unique indexes that prevent multiple keys per provider
DROP INDEX IF EXISTS public.api_keys_team_unique;
DROP INDEX IF EXISTS public.api_keys_personal_unique;
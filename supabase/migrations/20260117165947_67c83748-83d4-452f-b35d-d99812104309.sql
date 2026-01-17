-- Fix security definer view warning by adding security_invoker=on
-- This ensures the view uses the querying user's permissions, not the view creator's

DROP VIEW IF EXISTS public.api_keys_safe;

CREATE VIEW public.api_keys_safe
WITH (security_invoker=on) AS
SELECT
  id,
  user_id,
  team_id,
  provider,
  key_hint,
  is_valid,
  last_validated_at,
  created_at,
  updated_at
FROM public.api_keys
WHERE 
  -- Personal keys: user owns the key and no team
  (user_id = auth.uid() AND team_id IS NULL)
  OR
  -- Team keys: user is a member of the team
  (team_id IS NOT NULL AND _internal_is_team_member(team_id, auth.uid()));
-- Fix api_keys_safe view to have proper RLS
-- The view needs security barrier and invoker security

-- Drop the existing view
DROP VIEW IF EXISTS public.api_keys_safe;

-- Recreate with security_invoker = true so RLS from api_keys table applies
CREATE VIEW public.api_keys_safe 
WITH (security_invoker = true, security_barrier = true)
AS
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
  -- User owns the key personally
  (user_id = auth.uid() AND team_id IS NULL)
  OR
  -- Key belongs to a team the user is a member of
  (team_id IS NOT NULL AND public._internal_is_team_member(team_id, auth.uid()));

-- Grant access to authenticated users
GRANT SELECT ON public.api_keys_safe TO authenticated;
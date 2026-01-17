-- Drop and recreate the api_keys_safe view with proper function reference
DROP VIEW IF EXISTS public.api_keys_safe;

-- Create view using is_team_member (public function) instead of _internal_is_team_member
CREATE VIEW public.api_keys_safe 
WITH (security_invoker = on) AS
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
  -- Personal keys: user owns them and no team
  ((user_id = auth.uid()) AND (team_id IS NULL))
  OR 
  -- Team keys: user is a member of that team
  ((team_id IS NOT NULL) AND is_team_member(team_id, auth.uid()));

-- Grant select on the view to authenticated users
GRANT SELECT ON public.api_keys_safe TO authenticated;
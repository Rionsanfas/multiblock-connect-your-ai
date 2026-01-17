-- Fix the api_keys_safe view - parameters were in wrong order for is_team_member
DROP VIEW IF EXISTS public.api_keys_safe;

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
  -- FIXED: is_team_member takes (user_id, team_id) not (team_id, user_id)
  ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id));

-- Grant select on the view to authenticated users
GRANT SELECT ON public.api_keys_safe TO authenticated;
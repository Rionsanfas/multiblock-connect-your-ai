-- Fix api_keys_safe view: correct parameter order in _internal_is_team_member
-- The function signature is _internal_is_team_member(p_team_id, p_user_id)
-- but the view was calling it with (auth.uid(), team_id) which is incorrect

CREATE OR REPLACE VIEW public.api_keys_safe AS
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
  -- Team keys: user is a member of the team (correct parameter order: team_id, user_id)
  (team_id IS NOT NULL AND _internal_is_team_member(team_id, auth.uid()));
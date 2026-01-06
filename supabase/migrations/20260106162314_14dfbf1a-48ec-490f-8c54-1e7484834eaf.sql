-- Add team_id column to api_keys table
ALTER TABLE public.api_keys 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- Create index for team API key lookups
CREATE INDEX idx_api_keys_team_id ON public.api_keys(team_id) WHERE team_id IS NOT NULL;

-- Helper function: Check if user can view team API keys
CREATE OR REPLACE FUNCTION public.can_view_team_api_key(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  )
$$;

-- Helper function: Check if user can manage team API keys (owner/admin only)
CREATE OR REPLACE FUNCTION public.can_manage_team_api_key(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
$$;

-- Update RLS policies for api_keys to handle team keys

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own_keys_safe" ON public.api_keys;
DROP POLICY IF EXISTS "users_insert_own_keys" ON public.api_keys;
DROP POLICY IF EXISTS "users_update_own_keys" ON public.api_keys;
DROP POLICY IF EXISTS "users_delete_own_keys" ON public.api_keys;

-- New SELECT policy: personal keys OR team keys where user is member
CREATE POLICY "users_can_view_api_keys"
ON public.api_keys
FOR SELECT
USING (
  (team_id IS NULL AND auth.uid() = user_id) OR
  (team_id IS NOT NULL AND can_view_team_api_key(team_id))
);

-- New INSERT policy: personal keys OR team keys if admin/owner
CREATE POLICY "users_can_insert_api_keys"
ON public.api_keys
FOR INSERT
WITH CHECK (
  (team_id IS NULL AND auth.uid() = user_id) OR
  (team_id IS NOT NULL AND auth.uid() = user_id AND can_manage_team_api_key(team_id))
);

-- New UPDATE policy: personal keys OR team keys if admin/owner
CREATE POLICY "users_can_update_api_keys"
ON public.api_keys
FOR UPDATE
USING (
  (team_id IS NULL AND auth.uid() = user_id) OR
  (team_id IS NOT NULL AND can_manage_team_api_key(team_id))
)
WITH CHECK (
  (team_id IS NULL AND auth.uid() = user_id) OR
  (team_id IS NOT NULL AND can_manage_team_api_key(team_id))
);

-- New DELETE policy: personal keys OR team keys if admin/owner
CREATE POLICY "users_can_delete_api_keys"
ON public.api_keys
FOR DELETE
USING (
  (team_id IS NULL AND auth.uid() = user_id) OR
  (team_id IS NOT NULL AND can_manage_team_api_key(team_id))
);

-- Update api_keys_safe view to include team_id
DROP VIEW IF EXISTS public.api_keys_safe;
CREATE VIEW public.api_keys_safe AS
SELECT 
  id,
  user_id,
  team_id,
  provider,
  key_hint,
  is_valid,
  created_at,
  updated_at,
  last_validated_at
FROM public.api_keys;

-- Grant access to the view
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- Function to get team API keys for chat-proxy
CREATE OR REPLACE FUNCTION public.get_team_api_key(p_team_id uuid, p_provider llm_provider)
RETURNS TABLE(api_key_encrypted text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT api_key_encrypted
  FROM public.api_keys
  WHERE team_id = p_team_id 
    AND provider = p_provider
    AND is_valid = true
  LIMIT 1
$$;
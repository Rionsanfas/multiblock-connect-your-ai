-- Fix RLS policy for team_invitations - use wrapper function instead of internal
DROP POLICY IF EXISTS "Authorized users can view invitations" ON public.team_invitations;

CREATE POLICY "Authorized users can view invitations"
ON public.team_invitations
FOR SELECT
USING (
  is_team_admin_or_owner(auth.uid(), team_id) 
  OR (invited_by = auth.uid()) 
  OR (email = (SELECT profiles.email FROM profiles WHERE profiles.id = auth.uid()))
);

-- Create a function to get pending invitations for a user by email
CREATE OR REPLACE FUNCTION public.get_user_pending_invitations()
RETURNS TABLE(
  invitation_id uuid,
  team_id uuid,
  team_name text,
  team_slug text,
  role team_role,
  invited_by_email text,
  invited_by_name text,
  token text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF v_user_email IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    ti.id AS invitation_id,
    ti.team_id,
    t.name AS team_name,
    t.slug AS team_slug,
    ti.role,
    p.email AS invited_by_email,
    p.full_name AS invited_by_name,
    ti.token,
    ti.expires_at,
    ti.created_at
  FROM public.team_invitations ti
  JOIN public.teams t ON t.id = ti.team_id
  JOIN public.profiles p ON p.id = ti.invited_by
  WHERE ti.email = v_user_email
    AND ti.accepted_at IS NULL
    AND ti.expires_at > now()
  ORDER BY ti.created_at DESC;
END;
$$;

-- Create function to decline an invitation
CREATE OR REPLACE FUNCTION public.decline_team_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_invitation_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = auth.uid();
  
  SELECT email INTO v_invitation_email
  FROM public.team_invitations
  WHERE id = p_invitation_id;
  
  IF v_invitation_email IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND';
  END IF;
  
  IF v_invitation_email != v_user_email THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  
  DELETE FROM public.team_invitations WHERE id = p_invitation_id;
  
  RETURN TRUE;
END;
$$;

-- Fix: use correct wrapper in create_team_invitation RLS-like checks
-- The create_team_invitation function already uses _internal_is_team_admin_or_owner internally
-- which is correct since it's a SECURITY DEFINER function
-- Drop existing function to change return type
DROP FUNCTION IF EXISTS public.accept_team_invitation(text);

-- ==========================================
-- FIX 1: Improved accept_team_invitation with email verification
-- ==========================================

CREATE FUNCTION public.accept_team_invitation(p_token text)
RETURNS TABLE(
  success boolean,
  error_message text,
  team_id uuid,
  team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_user_email text;
  v_user_id uuid;
  v_team_name text;
  v_existing_member boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'NOT_AUTHENTICATED'::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  SELECT ti.*, t.name as team_name_val
  INTO v_invitation
  FROM team_invitations ti
  JOIN teams t ON t.id = ti.team_id
  WHERE ti.token = p_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'INVITATION_NOT_FOUND'::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  v_team_name := v_invitation.team_name_val;
  
  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'INVITATION_ALREADY_ACCEPTED'::text, v_invitation.team_id, v_team_name;
    RETURN;
  END IF;
  
  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT false, 'INVITATION_EXPIRED'::text, v_invitation.team_id, v_team_name;
    RETURN;
  END IF;
  
  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RETURN QUERY SELECT false, 'EMAIL_MISMATCH'::text, v_invitation.team_id, v_team_name;
    RETURN;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM team_members 
    WHERE team_id = v_invitation.team_id AND user_id = v_user_id
  ) INTO v_existing_member;
  
  IF v_existing_member THEN
    UPDATE team_invitations SET accepted_at = now() WHERE id = v_invitation.id;
    RETURN QUERY SELECT true, 'ALREADY_MEMBER'::text, v_invitation.team_id, v_team_name;
    RETURN;
  END IF;
  
  IF NOT public.team_can_add_member(v_invitation.team_id) THEN
    RETURN QUERY SELECT false, 'SEAT_LIMIT_REACHED'::text, v_invitation.team_id, v_team_name;
    RETURN;
  END IF;
  
  INSERT INTO team_members (team_id, user_id, role, joined_at)
  VALUES (v_invitation.team_id, v_user_id, v_invitation.role, now());
  
  UPDATE team_invitations SET accepted_at = now() WHERE id = v_invitation.id;
  
  RETURN QUERY SELECT true, NULL::text, v_invitation.team_id, v_team_name;
END;
$$;

-- ==========================================
-- FIX 2: Account deletion function
-- ==========================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_owned_team_count int;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'NOT_AUTHENTICATED'::text;
    RETURN;
  END IF;
  
  SELECT COUNT(*) INTO v_owned_team_count FROM teams WHERE owner_id = v_user_id;
  
  IF v_owned_team_count > 0 THEN
    RETURN QUERY SELECT false, 'MUST_TRANSFER_OR_DELETE_TEAMS'::text;
    RETURN;
  END IF;
  
  DELETE FROM team_members WHERE user_id = v_user_id;
  DELETE FROM team_invitations WHERE invited_by = v_user_id;
  DELETE FROM blocks WHERE user_id = v_user_id;
  DELETE FROM boards WHERE user_id = v_user_id;
  DELETE FROM block_connections WHERE user_id = v_user_id;
  DELETE FROM api_keys WHERE user_id = v_user_id;
  DELETE FROM uploads WHERE user_id = v_user_id;
  DELETE FROM user_subscriptions WHERE user_id = v_user_id;
  DELETE FROM user_billing WHERE user_id = v_user_id;
  DELETE FROM user_storage_usage WHERE user_id = v_user_id;
  DELETE FROM user_roles WHERE user_id = v_user_id;
  DELETE FROM profiles WHERE id = v_user_id;
  
  RETURN QUERY SELECT true, NULL::text;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_team_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_invitation(uuid, text, team_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_name(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_with_options(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_can_add_member(uuid) TO authenticated;
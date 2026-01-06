-- Fix the team_id ambiguity in accept_team_invitation function
CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token text)
 RETURNS TABLE(success boolean, error_message text, team_id uuid, team_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invitation record;
  v_user_email text;
  v_user_id uuid;
  v_team_name text;
  v_team_id uuid;
  v_existing_member boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'NOT_AUTHENTICATED'::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = v_user_id;
  
  SELECT ti.*, t.name as team_name_val, ti.team_id as invitation_team_id
  INTO v_invitation
  FROM team_invitations ti
  JOIN teams t ON t.id = ti.team_id
  WHERE ti.token = p_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'INVITATION_NOT_FOUND'::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  v_team_name := v_invitation.team_name_val;
  v_team_id := v_invitation.invitation_team_id;
  
  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'INVITATION_ALREADY_ACCEPTED'::text, v_team_id, v_team_name;
    RETURN;
  END IF;
  
  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT false, 'INVITATION_EXPIRED'::text, v_team_id, v_team_name;
    RETURN;
  END IF;
  
  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RETURN QUERY SELECT false, 'EMAIL_MISMATCH'::text, v_team_id, v_team_name;
    RETURN;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = v_team_id AND tm.user_id = v_user_id
  ) INTO v_existing_member;
  
  IF v_existing_member THEN
    UPDATE team_invitations SET accepted_at = now() WHERE id = v_invitation.id;
    RETURN QUERY SELECT true, 'ALREADY_MEMBER'::text, v_team_id, v_team_name;
    RETURN;
  END IF;
  
  IF NOT public.team_can_add_member(v_team_id) THEN
    RETURN QUERY SELECT false, 'SEAT_LIMIT_REACHED'::text, v_team_id, v_team_name;
    RETURN;
  END IF;
  
  INSERT INTO team_members (team_id, user_id, role, joined_at)
  VALUES (v_team_id, v_user_id, v_invitation.role, now());
  
  UPDATE team_invitations SET accepted_at = now() WHERE id = v_invitation.id;
  
  RETURN QUERY SELECT true, NULL::text, v_team_id, v_team_name;
END;
$function$;
-- Create delete_team function that properly handles deletion
-- Only team owner can delete their own team
CREATE OR REPLACE FUNCTION public.delete_team(p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner boolean;
BEGIN
  -- Check if current user is the owner
  SELECT EXISTS(
    SELECT 1 FROM teams 
    WHERE id = p_team_id AND owner_id = auth.uid()
  ) INTO v_is_owner;
  
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Only the team owner can delete the team';
  END IF;
  
  -- Delete team boards first (cascade will handle blocks/messages)
  DELETE FROM boards WHERE team_id = p_team_id;
  
  -- Delete team invitations
  DELETE FROM team_invitations WHERE team_id = p_team_id;
  
  -- Delete team members
  DELETE FROM team_members WHERE team_id = p_team_id;
  
  -- Delete the team
  DELETE FROM teams WHERE id = p_team_id;
  
  RETURN true;
END;
$$;
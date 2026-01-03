-- Create function to update team name (only owner can update)
CREATE OR REPLACE FUNCTION public.update_team_name(p_team_id uuid, p_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role team_role;
BEGIN
  -- Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Input validation
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'INVALID_TEAM_NAME';
  END IF;
  
  -- Get user's role in team
  SELECT role INTO v_user_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  -- Only owner can update team name
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  
  IF v_user_role != 'owner' THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: Only owner can rename team';
  END IF;
  
  -- Update team name
  UPDATE public.teams
  SET name = trim(p_name), updated_at = now()
  WHERE id = p_team_id;
  
  RETURN TRUE;
END;
$$;
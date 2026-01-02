-- ============================================
-- DELETE TEAM WITH OPTIONS
-- Allows owner/admin to delete team with option to transfer boards
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_team_with_options(
  p_team_id UUID,
  p_transfer_boards BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role team_role;
  v_owner_id UUID;
BEGIN
  -- Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Get user's role in team
  SELECT role INTO v_user_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  
  -- Only owner or admin can delete
  IF v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: Only owner or admin can delete teams';
  END IF;
  
  -- Get team owner for board transfer
  SELECT owner_id INTO v_owner_id
  FROM public.teams
  WHERE id = p_team_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'TEAM_NOT_FOUND';
  END IF;
  
  -- Handle boards
  IF p_transfer_boards THEN
    -- Transfer all team boards to the owner's personal workspace
    UPDATE public.boards
    SET 
      team_id = NULL,
      user_id = v_owner_id,
      updated_at = now()
    WHERE team_id = p_team_id;
  ELSE
    -- Delete all team boards (cascades to blocks, messages, etc.)
    DELETE FROM public.boards WHERE team_id = p_team_id;
  END IF;
  
  -- Delete all invitations for this team
  DELETE FROM public.team_invitations WHERE team_id = p_team_id;
  
  -- Delete all team members
  DELETE FROM public.team_members WHERE team_id = p_team_id;
  
  -- Delete the team itself
  DELETE FROM public.teams WHERE id = p_team_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- ADMIN LEAVE TEAM (requires another admin first)
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_leave_team(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role team_role;
  v_other_admin_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Get user's role
  SELECT role INTO v_user_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;
  
  -- Owner cannot leave (must transfer ownership first)
  IF v_user_role = 'owner' THEN
    RAISE EXCEPTION 'OWNER_CANNOT_LEAVE: Transfer ownership first';
  END IF;
  
  -- Admin must ensure there's another admin or owner before leaving
  IF v_user_role = 'admin' THEN
    SELECT COUNT(*) INTO v_other_admin_count
    FROM public.team_members
    WHERE team_id = p_team_id 
      AND user_id != v_user_id
      AND role IN ('owner', 'admin');
    
    IF v_other_admin_count = 0 THEN
      RAISE EXCEPTION 'ADMIN_REQUIRED: Assign another admin before leaving';
    END IF;
  END IF;
  
  -- Remove the member
  DELETE FROM public.team_members
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- UPDATE: remove_team_member - enforce proper permissions
-- ============================================

CREATE OR REPLACE FUNCTION public.remove_team_member(p_team_id uuid, p_member_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role team_role;
  v_member_role team_role;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Get caller's role
  SELECT role INTO v_user_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  -- Get target member's role
  SELECT role INTO v_member_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  IF v_member_role IS NULL THEN
    RAISE EXCEPTION 'MEMBER_NOT_FOUND';
  END IF;
  
  -- Self-removal uses admin_leave_team for proper checks
  IF v_user_id = p_member_user_id THEN
    RETURN public.admin_leave_team(p_team_id);
  END IF;
  
  -- Only owner/admin can remove others
  IF v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: Only owner or admin can remove members';
  END IF;
  
  -- Cannot remove owner
  IF v_member_role = 'owner' THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_OWNER';
  END IF;
  
  -- Admin cannot remove another admin (only owner can)
  IF v_user_role = 'admin' AND v_member_role = 'admin' THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: Only owner can remove admins';
  END IF;
  
  DELETE FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- UPDATE: update_team_member_role - enforce proper permissions
-- ============================================

CREATE OR REPLACE FUNCTION public.update_team_member_role(p_team_id uuid, p_member_user_id uuid, p_new_role team_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role team_role;
  v_current_role team_role;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Get caller's role
  SELECT role INTO v_user_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  -- Only owner/admin can change roles
  IF v_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  
  -- Get current role of target
  SELECT role INTO v_current_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'MEMBER_NOT_FOUND';
  END IF;
  
  -- Cannot modify owner role
  IF v_current_role = 'owner' THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_OWNER: Use transfer ownership';
  END IF;
  
  -- Cannot set role to owner (use transfer)
  IF p_new_role = 'owner' THEN
    RAISE EXCEPTION 'USE_TRANSFER_FOR_OWNERSHIP';
  END IF;
  
  -- Admin can only promote to admin or demote, not demote other admins
  IF v_user_role = 'admin' AND v_current_role = 'admin' THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: Only owner can modify admin roles';
  END IF;
  
  UPDATE public.team_members
  SET role = p_new_role, updated_at = now()
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- Check if user can delete team (for UI)
-- ============================================

CREATE OR REPLACE FUNCTION public.can_delete_team(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_role team_role;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO v_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  RETURN v_role IN ('owner', 'admin');
END;
$$;
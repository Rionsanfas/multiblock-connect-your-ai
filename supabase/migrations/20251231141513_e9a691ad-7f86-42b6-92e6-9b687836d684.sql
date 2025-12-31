-- ============================================================
-- TEAMS SYSTEM - CORE TABLES
-- ============================================================

-- Team role enum
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member');

-- Teams table - the core team entity
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members - tracks membership and roles
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team invitations - pending invites with expiry
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.team_role NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Add team_id to boards table for team ownership
ALTER TABLE public.boards 
  ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY DEFINER FUNCTIONS FOR PERMISSION CHECKS
-- ============================================================

-- Check if user is a member of a team (any role)
CREATE OR REPLACE FUNCTION public.is_team_member(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
  );
$$;

-- Check if user has specific role in team
CREATE OR REPLACE FUNCTION public.has_team_role(p_user_id UUID, p_team_id UUID, p_role public.team_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id AND team_id = p_team_id AND role = p_role
  );
$$;

-- Check if user is team owner or admin
CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id 
      AND team_id = p_team_id 
      AND role IN ('owner', 'admin')
  );
$$;

-- Check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id AND team_id = p_team_id AND role = 'owner'
  );
$$;

-- Get user's role in a team
CREATE OR REPLACE FUNCTION public.get_user_team_role(p_user_id UUID, p_team_id UUID)
RETURNS public.team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.team_members
  WHERE user_id = p_user_id AND team_id = p_team_id
  LIMIT 1;
$$;

-- Get team seat count
CREATE OR REPLACE FUNCTION public.get_team_seat_count(p_team_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.team_members
  WHERE team_id = p_team_id;
$$;

-- Get team's max seats (from owner's plan)
CREATE OR REPLACE FUNCTION public.get_team_max_seats(p_team_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_max_seats INTEGER;
BEGIN
  -- Get team owner
  SELECT owner_id INTO v_owner_id FROM public.teams WHERE id = p_team_id;
  
  IF v_owner_id IS NULL THEN
    RETURN 1;
  END IF;
  
  -- Get owner's plan limits
  SELECT COALESCE(ub.seats, 1) INTO v_max_seats
  FROM public.user_billing ub
  WHERE ub.user_id = v_owner_id;
  
  RETURN COALESCE(v_max_seats, 1);
END;
$$;

-- Check if team can add more members
CREATE OR REPLACE FUNCTION public.team_can_add_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_seats INTEGER;
  v_max_seats INTEGER;
BEGIN
  SELECT public.get_team_seat_count(p_team_id) INTO v_current_seats;
  SELECT public.get_team_max_seats(p_team_id) INTO v_max_seats;
  
  RETURN v_current_seats < v_max_seats;
END;
$$;

-- Get team limits (from owner's plan)
CREATE OR REPLACE FUNCTION public.get_team_limits(p_team_id UUID)
RETURNS TABLE(
  max_boards INTEGER,
  max_blocks_per_board INTEGER,
  max_seats INTEGER,
  storage_gb INTEGER,
  current_seats INTEGER,
  current_boards INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.teams WHERE id = p_team_id;
  
  RETURN QUERY
  SELECT 
    COALESCE(ub.boards, 3) AS max_boards,
    COALESCE(ub.blocks, 10) AS max_blocks_per_board,
    COALESCE(ub.seats, 1) AS max_seats,
    COALESCE(ub.storage_gb, 1) AS storage_gb,
    (SELECT COUNT(*)::INTEGER FROM public.team_members WHERE team_id = p_team_id) AS current_seats,
    (SELECT COUNT(*)::INTEGER FROM public.boards WHERE team_id = p_team_id AND is_archived = false) AS current_boards
  FROM public.user_billing ub
  WHERE ub.user_id = v_owner_id;
END;
$$;

-- ============================================================
-- RLS POLICIES FOR TEAMS
-- ============================================================

-- Teams: Members can view their teams
CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (public.is_team_member(auth.uid(), id));

-- Teams: Any authenticated user can create a team
CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Teams: Only owner can update team
CREATE POLICY "Team owner can update team"
ON public.teams FOR UPDATE
USING (public.is_team_owner(auth.uid(), id))
WITH CHECK (public.is_team_owner(auth.uid(), id));

-- Teams: Only owner can delete team
CREATE POLICY "Team owner can delete team"
ON public.teams FOR DELETE
USING (public.is_team_owner(auth.uid(), id));

-- ============================================================
-- RLS POLICIES FOR TEAM_MEMBERS
-- ============================================================

-- Team members: Members can view team members
CREATE POLICY "Team members can view members"
ON public.team_members FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

-- Team members: Owner/Admin can add members
CREATE POLICY "Team admin can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  public.is_team_admin_or_owner(auth.uid(), team_id)
  AND public.team_can_add_member(team_id)
);

-- Team members: Owner/Admin can update members (but not change owner role)
CREATE POLICY "Team admin can update members"
ON public.team_members FOR UPDATE
USING (
  public.is_team_admin_or_owner(auth.uid(), team_id)
  AND role != 'owner' -- Cannot modify the owner
)
WITH CHECK (
  public.is_team_admin_or_owner(auth.uid(), team_id)
  AND role != 'owner' -- Cannot make someone owner
);

-- Team members: Owner/Admin can remove members (except owner)
CREATE POLICY "Team admin can remove members"
ON public.team_members FOR DELETE
USING (
  public.is_team_admin_or_owner(auth.uid(), team_id)
  AND role != 'owner'
);

-- Team members: Members can leave team (except owner)
CREATE POLICY "Members can leave team"
ON public.team_members FOR DELETE
USING (
  auth.uid() = user_id
  AND role != 'owner'
);

-- ============================================================
-- RLS POLICIES FOR TEAM_INVITATIONS
-- ============================================================

-- Invitations: Team admins can view invitations
CREATE POLICY "Team admin can view invitations"
ON public.team_invitations FOR SELECT
USING (public.is_team_admin_or_owner(auth.uid(), team_id));

-- Invitations: Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.team_invitations FOR SELECT
USING (true); -- Token validation happens in application

-- Invitations: Team admins can create invitations
CREATE POLICY "Team admin can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  public.is_team_admin_or_owner(auth.uid(), team_id)
  AND public.team_can_add_member(team_id)
);

-- Invitations: Team admins can delete invitations
CREATE POLICY "Team admin can delete invitations"
ON public.team_invitations FOR DELETE
USING (public.is_team_admin_or_owner(auth.uid(), team_id));

-- Invitations: Allow updating (accepting) invitations
CREATE POLICY "Can accept invitation"
ON public.team_invitations FOR UPDATE
USING (true) -- Token validation in application
WITH CHECK (true);

-- ============================================================
-- UPDATE BOARDS RLS FOR TEAM ACCESS
-- ============================================================

-- Add policy for team members to view team boards
CREATE POLICY "Team members can view team boards"
ON public.boards FOR SELECT
USING (
  team_id IS NOT NULL 
  AND public.is_team_member(auth.uid(), team_id)
);

-- Add policy for team members to create boards in team
CREATE POLICY "Team members can create team boards"
ON public.boards FOR INSERT
WITH CHECK (
  team_id IS NOT NULL 
  AND public.is_team_member(auth.uid(), team_id)
);

-- Add policy for team admin to update team boards
CREATE POLICY "Team admin can update team boards"
ON public.boards FOR UPDATE
USING (
  team_id IS NOT NULL 
  AND public.is_team_admin_or_owner(auth.uid(), team_id)
)
WITH CHECK (
  team_id IS NOT NULL 
  AND public.is_team_admin_or_owner(auth.uid(), team_id)
);

-- Add policy for team admin to delete team boards
CREATE POLICY "Team admin can delete team boards"
ON public.boards FOR DELETE
USING (
  team_id IS NOT NULL 
  AND public.is_team_admin_or_owner(auth.uid(), team_id)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-add creator as owner when team is created
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_team();

-- Update timestamp trigger for teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update timestamp trigger for team_members
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCTION: Accept team invitation
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token TEXT)
RETURNS TABLE(
  success BOOLEAN,
  team_id UUID,
  team_name TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_can_add BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Get invitation
  SELECT ti.*, t.name AS team_name
  INTO v_invitation
  FROM public.team_invitations ti
  JOIN public.teams t ON t.id = ti.team_id
  WHERE ti.token = p_token
    AND ti.accepted_at IS NULL
    AND ti.expires_at > now();
  
  IF v_invitation IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Invalid or expired invitation'::TEXT;
    RETURN;
  END IF;
  
  -- Check seat availability
  SELECT public.team_can_add_member(v_invitation.team_id) INTO v_can_add;
  
  IF NOT v_can_add THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Team has reached maximum seat limit'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user is already a member
  IF public.is_team_member(v_user_id, v_invitation.team_id) THEN
    RETURN QUERY SELECT false, v_invitation.team_id, v_invitation.team_name, 'Already a team member'::TEXT;
    RETURN;
  END IF;
  
  -- Add user to team
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_invitation.team_id, v_user_id, v_invitation.role);
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET accepted_at = now()
  WHERE id = v_invitation.id;
  
  RETURN QUERY SELECT true, v_invitation.team_id, v_invitation.team_name, NULL::TEXT;
END;
$$;

-- ============================================================
-- FUNCTION: Get user's teams
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_teams(p_user_id UUID)
RETURNS TABLE(
  team_id UUID,
  team_name TEXT,
  team_slug TEXT,
  user_role public.team_role,
  member_count INTEGER,
  board_count INTEGER,
  is_owner BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    t.slug AS team_slug,
    tm.role AS user_role,
    (SELECT COUNT(*)::INTEGER FROM public.team_members WHERE team_id = t.id) AS member_count,
    (SELECT COUNT(*)::INTEGER FROM public.boards WHERE team_id = t.id AND is_archived = false) AS board_count,
    (t.owner_id = p_user_id) AS is_owner
  FROM public.teams t
  JOIN public.team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = p_user_id
  ORDER BY tm.role = 'owner' DESC, t.name ASC;
END;
$$;

-- ============================================================
-- FUNCTION: Transfer board to team
-- ============================================================

CREATE OR REPLACE FUNCTION public.transfer_board_to_team(p_board_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_board_owner UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user owns the board
  SELECT user_id INTO v_board_owner
  FROM public.boards
  WHERE id = p_board_id AND team_id IS NULL;
  
  IF v_board_owner IS NULL OR v_board_owner != v_user_id THEN
    RAISE EXCEPTION 'You do not own this board';
  END IF;
  
  -- Check if user is team member
  IF NOT public.is_team_member(v_user_id, p_team_id) THEN
    RAISE EXCEPTION 'You are not a member of this team';
  END IF;
  
  -- Transfer board
  UPDATE public.boards
  SET team_id = p_team_id, updated_at = now()
  WHERE id = p_board_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================================
-- FUNCTION: Create team with validation
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_team(p_name TEXT, p_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_team_id UUID;
  v_max_seats INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user's plan allows teams (seats > 1)
  SELECT COALESCE(ub.seats, 1) INTO v_max_seats
  FROM public.user_billing ub
  WHERE ub.user_id = v_user_id;
  
  IF COALESCE(v_max_seats, 1) < 2 THEN
    RAISE EXCEPTION 'Your plan does not support teams. Please upgrade to a plan with multiple seats.';
  END IF;
  
  -- Create team
  INSERT INTO public.teams (name, slug, owner_id)
  VALUES (p_name, p_slug, v_user_id)
  RETURNING id INTO v_team_id;
  
  RETURN v_team_id;
END;
$$;
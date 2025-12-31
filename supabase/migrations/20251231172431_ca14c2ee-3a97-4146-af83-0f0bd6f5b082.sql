-- ============================================================================
-- PRODUCTION-GRADE TEAMS BACKEND HARDENING
-- Advisory locks, safe billing, explicit ownership, audit-safe FKs, strict RLS
-- ============================================================================

-- ============================================================================
-- PART 1: AUDIT-SAFE FK CASCADES
-- Keep team_id CASCADE (delete team = delete members), but SET NULL for user refs
-- ============================================================================

-- Fix team_members FK - SET NULL on user delete for audit trail
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure team_id cascade exists
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_team_id_fkey;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Fix team_invitations FK - SET NULL on inviter delete
ALTER TABLE public.team_invitations
  DROP CONSTRAINT IF EXISTS team_invitations_invited_by_fkey;
ALTER TABLE public.team_invitations
  ADD CONSTRAINT team_invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure team_id cascade exists  
ALTER TABLE public.team_invitations
  DROP CONSTRAINT IF EXISTS team_invitations_team_id_fkey;
ALTER TABLE public.team_invitations
  ADD CONSTRAINT team_invitations_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Fix teams owner FK - SET NULL on owner delete (team persists for audit)
ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_owner_id_fkey;
ALTER TABLE public.teams
  ADD CONSTRAINT teams_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure unique constraint for team membership
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_team_user_unique;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_team_user_unique UNIQUE (team_id, user_id);

-- ============================================================================
-- PART 2: DROP OLD TRIGGER (explicit ownership in functions)
-- ============================================================================

DROP TRIGGER IF EXISTS sync_team_owner_membership_trigger ON public.teams;
DROP FUNCTION IF EXISTS public.sync_team_owner_membership() CASCADE;

-- ============================================================================
-- PART 3: INTERNAL HELPER FUNCTIONS (not publicly callable)
-- ============================================================================

-- Safe max seats - NEVER fails, defaults to 1
CREATE OR REPLACE FUNCTION public._internal_get_team_max_seats(p_team_id uuid)
RETURNS integer
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
  SELECT owner_id INTO v_owner_id 
  FROM public.teams 
  WHERE id = p_team_id;
  
  IF v_owner_id IS NULL THEN
    RETURN 1; -- Safe default for orphaned teams
  END IF;
  
  -- Get billing with safe default
  SELECT COALESCE(seats, 1) INTO v_max_seats
  FROM public.user_billing
  WHERE user_id = v_owner_id;
  
  -- If no billing row, default to 1
  IF v_max_seats IS NULL THEN
    v_max_seats := 1;
  END IF;
  
  RETURN v_max_seats;
END;
$$;

-- Seat count helper
CREATE OR REPLACE FUNCTION public._internal_get_team_seat_count(p_team_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.team_members 
  WHERE team_id = p_team_id AND user_id IS NOT NULL;
$$;

-- Membership check helper
CREATE OR REPLACE FUNCTION public._internal_is_team_member(p_user_id uuid, p_team_id uuid)
RETURNS boolean
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

-- Admin/owner check helper
CREATE OR REPLACE FUNCTION public._internal_is_team_admin_or_owner(p_user_id uuid, p_team_id uuid)
RETURNS boolean
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

-- Owner check helper
CREATE OR REPLACE FUNCTION public._internal_is_team_owner(p_user_id uuid, p_team_id uuid)
RETURNS boolean
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

-- Revoke public access to internal functions
REVOKE ALL ON FUNCTION public._internal_get_team_max_seats(uuid) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public._internal_get_team_seat_count(uuid) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public._internal_is_team_member(uuid, uuid) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public._internal_is_team_admin_or_owner(uuid, uuid) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public._internal_is_team_owner(uuid, uuid) FROM PUBLIC, authenticated;

-- ============================================================================
-- PART 4: PUBLIC HELPER FUNCTIONS (for RLS and UI)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_team_member(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Can only check own membership (or service role)
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  RETURN public._internal_is_team_member(p_user_id, p_team_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  RETURN public._internal_is_team_owner(p_user_id, p_team_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() != p_user_id THEN
    RETURN FALSE;
  END IF;
  
  RETURN public._internal_is_team_admin_or_owner(p_user_id, p_team_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_seat_count(p_team_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Must be team member to see seat count
  IF NOT public._internal_is_team_member(auth.uid(), p_team_id) THEN
    RETURN 0;
  END IF;
  
  RETURN public._internal_get_team_seat_count(p_team_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_max_seats(p_team_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 1;
  END IF;
  
  IF NOT public._internal_is_team_member(auth.uid(), p_team_id) THEN
    RETURN 1;
  END IF;
  
  RETURN public._internal_get_team_max_seats(p_team_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_team_role(p_user_id uuid, p_team_id uuid)
RETURNS team_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() != p_user_id THEN
    RETURN NULL;
  END IF;
  
  RETURN (
    SELECT role FROM public.team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.team_can_add_member(p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  v_current := public._internal_get_team_seat_count(p_team_id);
  v_max := public._internal_get_team_max_seats(p_team_id);
  
  RETURN v_current < v_max;
END;
$$;

-- ============================================================================
-- PART 5: ATOMIC INVITATION ACCEPTANCE WITH ADVISORY LOCK
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_token text)
RETURNS TABLE(success boolean, team_id uuid, team_name text, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_invitation RECORD;
  v_current_seats INTEGER;
  v_max_seats INTEGER;
  v_lock_key BIGINT;
BEGIN
  -- Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'NOT_AUTHENTICATED'::TEXT;
    RETURN;
  END IF;
  
  -- Validate token
  IF p_token IS NULL OR length(trim(p_token)) < 10 THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'INVALID_TOKEN'::TEXT;
    RETURN;
  END IF;
  
  -- Get invitation with team info
  SELECT 
    ti.id AS invitation_id,
    ti.team_id,
    ti.role,
    ti.email,
    ti.expires_at,
    ti.accepted_at,
    t.name AS team_name
  INTO v_invitation
  FROM public.team_invitations ti
  JOIN public.teams t ON t.id = ti.team_id
  WHERE ti.token = p_token;
  
  IF v_invitation IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'INVITATION_NOT_FOUND'::TEXT;
    RETURN;
  END IF;
  
  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_invitation.team_id, v_invitation.team_name, 'INVITATION_ALREADY_ACCEPTED'::TEXT;
    RETURN;
  END IF;
  
  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT false, v_invitation.team_id, v_invitation.team_name, 'INVITATION_EXPIRED'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already a member
  IF public._internal_is_team_member(v_user_id, v_invitation.team_id) THEN
    RETURN QUERY SELECT false, v_invitation.team_id, v_invitation.team_name, 'ALREADY_MEMBER'::TEXT;
    RETURN;
  END IF;
  
  -- CRITICAL: Acquire advisory lock for atomic seat enforcement
  -- This prevents race conditions when multiple users accept invitations simultaneously
  v_lock_key := hashtext('team_seats_' || v_invitation.team_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Check seat availability (inside lock)
  v_current_seats := public._internal_get_team_seat_count(v_invitation.team_id);
  v_max_seats := public._internal_get_team_max_seats(v_invitation.team_id);
  
  IF v_current_seats >= v_max_seats THEN
    RETURN QUERY SELECT false, v_invitation.team_id, v_invitation.team_name, 'SEAT_LIMIT_REACHED'::TEXT;
    RETURN;
  END IF;
  
  -- Insert member (inside lock, atomic with seat check)
  INSERT INTO public.team_members (team_id, user_id, role, joined_at)
  VALUES (v_invitation.team_id, v_user_id, v_invitation.role, now())
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  -- Mark invitation accepted
  UPDATE public.team_invitations
  SET accepted_at = now()
  WHERE id = v_invitation.invitation_id;
  
  RETURN QUERY SELECT true, v_invitation.team_id, v_invitation.team_name, NULL::TEXT;
END;
$$;

-- ============================================================================
-- PART 6: CREATE TEAM WITH EXPLICIT OWNER MEMBERSHIP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_team(p_name text, p_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_team_id UUID;
  v_max_seats INTEGER;
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
  
  IF p_slug IS NULL OR length(trim(p_slug)) < 2 THEN
    RAISE EXCEPTION 'INVALID_TEAM_SLUG';
  END IF;
  
  -- Check slug uniqueness
  IF EXISTS (SELECT 1 FROM public.teams WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'SLUG_ALREADY_EXISTS';
  END IF;
  
  -- Check billing allows teams (safe default to 1)
  SELECT COALESCE(seats, 1) INTO v_max_seats
  FROM public.user_billing
  WHERE user_id = v_user_id;
  
  IF COALESCE(v_max_seats, 1) < 2 THEN
    RAISE EXCEPTION 'PLAN_NO_TEAMS';
  END IF;
  
  -- Create team
  INSERT INTO public.teams (name, slug, owner_id)
  VALUES (trim(p_name), trim(p_slug), v_user_id)
  RETURNING id INTO v_team_id;
  
  -- EXPLICIT owner membership (no trigger dependency)
  INSERT INTO public.team_members (team_id, user_id, role, joined_at)
  VALUES (v_team_id, v_user_id, 'owner', now())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = 'owner';
  
  RETURN v_team_id;
END;
$$;

-- ============================================================================
-- PART 7: CREATE INVITATION WITH ADVISORY LOCK
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_team_invitation(
  p_team_id uuid,
  p_email text,
  p_role team_role DEFAULT 'member'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_invitation_id UUID;
  v_current_seats INTEGER;
  v_max_seats INTEGER;
  v_pending_invitations INTEGER;
  v_lock_key BIGINT;
BEGIN
  -- Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Input validation
  IF p_email IS NULL OR p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;
  
  -- Permission check
  IF NOT public._internal_is_team_admin_or_owner(v_user_id, p_team_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  
  -- Cannot invite as owner
  IF p_role = 'owner' THEN
    RAISE EXCEPTION 'CANNOT_INVITE_AS_OWNER';
  END IF;
  
  -- Check for existing pending invitation
  IF EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE team_id = p_team_id 
      AND email = lower(trim(p_email))
      AND accepted_at IS NULL 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'INVITATION_ALREADY_PENDING';
  END IF;
  
  -- CRITICAL: Acquire advisory lock for seat check
  v_lock_key := hashtext('team_seats_' || p_team_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Count current + pending to ensure we don't over-invite
  v_current_seats := public._internal_get_team_seat_count(p_team_id);
  
  SELECT COUNT(*) INTO v_pending_invitations
  FROM public.team_invitations
  WHERE team_id = p_team_id 
    AND accepted_at IS NULL 
    AND expires_at > now();
  
  v_max_seats := public._internal_get_team_max_seats(p_team_id);
  
  IF (v_current_seats + v_pending_invitations) >= v_max_seats THEN
    RAISE EXCEPTION 'SEAT_LIMIT_REACHED';
  END IF;
  
  -- Create invitation
  INSERT INTO public.team_invitations (team_id, email, role, invited_by, expires_at)
  VALUES (p_team_id, lower(trim(p_email)), p_role, v_user_id, now() + interval '7 days')
  RETURNING id INTO v_invitation_id;
  
  RETURN v_invitation_id;
END;
$$;

-- ============================================================================
-- PART 8: OTHER TEAM MANAGEMENT FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_team_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_team_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  SELECT team_id INTO v_team_id
  FROM public.team_invitations
  WHERE id = p_invitation_id;
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND';
  END IF;
  
  IF NOT public._internal_is_team_admin_or_owner(v_user_id, v_team_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  
  DELETE FROM public.team_invitations WHERE id = p_invitation_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_team_member_role(
  p_team_id uuid,
  p_member_user_id uuid,
  p_new_role team_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_role team_role;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  IF NOT public._internal_is_team_admin_or_owner(v_user_id, p_team_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  
  -- Get current role
  SELECT role INTO v_current_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'MEMBER_NOT_FOUND';
  END IF;
  
  -- Cannot modify owner
  IF v_current_role = 'owner' THEN
    RAISE EXCEPTION 'CANNOT_MODIFY_OWNER';
  END IF;
  
  -- Cannot promote to owner (use transfer)
  IF p_new_role = 'owner' THEN
    RAISE EXCEPTION 'USE_TRANSFER_FOR_OWNERSHIP';
  END IF;
  
  UPDATE public.team_members
  SET role = p_new_role, updated_at = now()
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_team_member(p_team_id uuid, p_member_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_member_role team_role;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Self-removal is allowed (except owner)
  IF v_user_id = p_member_user_id THEN
    SELECT role INTO v_member_role
    FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_member_user_id;
    
    IF v_member_role = 'owner' THEN
      RAISE EXCEPTION 'OWNER_CANNOT_LEAVE';
    END IF;
    
    DELETE FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_member_user_id;
    
    RETURN TRUE;
  END IF;
  
  -- Admin/owner can remove others
  IF NOT public._internal_is_team_admin_or_owner(v_user_id, p_team_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  
  SELECT role INTO v_member_role
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  IF v_member_role IS NULL THEN
    RAISE EXCEPTION 'MEMBER_NOT_FOUND';
  END IF;
  
  IF v_member_role = 'owner' THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_OWNER';
  END IF;
  
  DELETE FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_member_user_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_team_ownership(p_team_id uuid, p_new_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_lock_key BIGINT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  -- Only current owner can transfer
  IF NOT public._internal_is_team_owner(v_user_id, p_team_id) THEN
    RAISE EXCEPTION 'NOT_OWNER';
  END IF;
  
  -- New owner must be team member
  IF NOT public._internal_is_team_member(p_new_owner_id, p_team_id) THEN
    RAISE EXCEPTION 'NEW_OWNER_NOT_MEMBER';
  END IF;
  
  -- Advisory lock for atomic transfer
  v_lock_key := hashtext('team_ownership_' || p_team_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Demote current owner to admin
  UPDATE public.team_members
  SET role = 'admin', updated_at = now()
  WHERE team_id = p_team_id AND user_id = v_user_id;
  
  -- Promote new owner
  UPDATE public.team_members
  SET role = 'owner', updated_at = now()
  WHERE team_id = p_team_id AND user_id = p_new_owner_id;
  
  -- Update teams table
  UPDATE public.teams
  SET owner_id = p_new_owner_id, updated_at = now()
  WHERE id = p_team_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_board_to_team(p_board_id uuid, p_team_id uuid)
RETURNS boolean
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
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  SELECT user_id INTO v_board_owner
  FROM public.boards
  WHERE id = p_board_id AND team_id IS NULL;
  
  IF v_board_owner IS NULL THEN
    RAISE EXCEPTION 'BOARD_NOT_FOUND';
  END IF;
  
  IF v_board_owner != v_user_id THEN
    RAISE EXCEPTION 'NOT_BOARD_OWNER';
  END IF;
  
  IF NOT public._internal_is_team_member(v_user_id, p_team_id) THEN
    RAISE EXCEPTION 'NOT_TEAM_MEMBER';
  END IF;
  
  UPDATE public.boards
  SET team_id = p_team_id, updated_at = now()
  WHERE id = p_board_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_teams(p_user_id uuid)
RETURNS TABLE(
  team_id uuid,
  team_name text,
  team_slug text,
  user_role team_role,
  member_count integer,
  board_count integer,
  is_owner boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    t.slug AS team_slug,
    tm.role AS user_role,
    public._internal_get_team_seat_count(t.id) AS member_count,
    (SELECT COUNT(*)::INTEGER FROM public.boards WHERE boards.team_id = t.id AND is_archived = false) AS board_count,
    (t.owner_id = p_user_id) AS is_owner
  FROM public.teams t
  JOIN public.team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = p_user_id
  ORDER BY tm.role = 'owner' DESC, t.name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_limits(p_team_id uuid)
RETURNS TABLE(
  max_boards integer,
  max_blocks_per_board integer,
  max_seats integer,
  storage_gb integer,
  current_seats integer,
  current_boards integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  
  IF NOT public._internal_is_team_member(auth.uid(), p_team_id) THEN
    RAISE EXCEPTION 'NOT_TEAM_MEMBER';
  END IF;
  
  SELECT owner_id INTO v_owner_id FROM public.teams WHERE id = p_team_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'TEAM_NOT_FOUND';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(ub.boards, 3) AS max_boards,
    COALESCE(ub.blocks, 10) AS max_blocks_per_board,
    COALESCE(ub.seats, 1) AS max_seats,
    COALESCE(ub.storage_gb, 1) AS storage_gb,
    public._internal_get_team_seat_count(p_team_id) AS current_seats,
    (SELECT COUNT(*)::INTEGER FROM public.boards WHERE boards.team_id = p_team_id AND is_archived = false) AS current_boards
  FROM public.user_billing ub
  WHERE ub.user_id = v_owner_id;
  
  -- If no billing, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT 3, 10, 1, 1, 
      public._internal_get_team_seat_count(p_team_id),
      (SELECT COUNT(*)::INTEGER FROM public.boards WHERE boards.team_id = p_team_id AND is_archived = false);
  END IF;
END;
$$;

-- ============================================================================
-- PART 9: STRICT RLS POLICIES
-- ============================================================================

-- Teams policies
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owner can update team" ON public.teams;
DROP POLICY IF EXISTS "Team owner can delete team" ON public.teams;
DROP POLICY IF EXISTS "block_direct_teams_insert" ON public.teams;
DROP POLICY IF EXISTS "block_direct_teams_update" ON public.teams;
DROP POLICY IF EXISTS "block_direct_teams_delete" ON public.teams;

-- Block all direct writes - must go through functions
CREATE POLICY "block_direct_teams_insert" ON public.teams
  FOR INSERT WITH CHECK (false);

CREATE POLICY "block_direct_teams_update" ON public.teams
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "block_direct_teams_delete" ON public.teams
  FOR DELETE USING (false);

-- Allow reads for members only
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (public._internal_is_team_member(auth.uid(), id));

-- Team members policies
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;
DROP POLICY IF EXISTS "Team admin can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team admin can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Team admin can update members" ON public.team_members;
DROP POLICY IF EXISTS "Members can leave team" ON public.team_members;
DROP POLICY IF EXISTS "block_direct_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "block_direct_members_update" ON public.team_members;
DROP POLICY IF EXISTS "block_direct_members_delete" ON public.team_members;

-- Block all direct writes
CREATE POLICY "block_direct_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (false);

CREATE POLICY "block_direct_members_update" ON public.team_members
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "block_direct_members_delete" ON public.team_members
  FOR DELETE USING (false);

-- Allow reads for team members
CREATE POLICY "Team members can view members" ON public.team_members
  FOR SELECT USING (public._internal_is_team_member(auth.uid(), team_id));

-- Team invitations policies
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.team_invitations;
DROP POLICY IF EXISTS "Team admin can view invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team admin can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team admin can delete invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Can accept invitation" ON public.team_invitations;
DROP POLICY IF EXISTS "block_direct_invitations_insert" ON public.team_invitations;
DROP POLICY IF EXISTS "block_direct_invitations_update" ON public.team_invitations;
DROP POLICY IF EXISTS "block_direct_invitations_delete" ON public.team_invitations;

-- Block all direct writes
CREATE POLICY "block_direct_invitations_insert" ON public.team_invitations
  FOR INSERT WITH CHECK (false);

CREATE POLICY "block_direct_invitations_update" ON public.team_invitations
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "block_direct_invitations_delete" ON public.team_invitations
  FOR DELETE USING (false);

-- Restricted visibility: admin/owner OR the invited user's email matches
CREATE POLICY "Authorized users can view invitations" ON public.team_invitations
  FOR SELECT USING (
    public._internal_is_team_admin_or_owner(auth.uid(), team_id)
    OR invited_by = auth.uid()
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- PART 10: GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_admin_or_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_seat_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_max_seats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_team_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_can_add_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_invitation(uuid, text, team_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_member_role(uuid, uuid, team_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_team_ownership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_board_to_team(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_teams(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_limits(uuid) TO authenticated;

-- =====================================================
-- FIX 1: Allow team members to see each other's profiles
-- Create a security definer function to check team membership
-- =====================================================

-- Function: Check if current user shares a team with target user
CREATE OR REPLACE FUNCTION public.shares_team_with(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = target_user_id
  )
$$;

-- Update profiles RLS: Allow team members to view each other
CREATE POLICY "Team members can view each other profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id  -- Can always view own profile
  OR shares_team_with(id)  -- Can view teammates
);

-- Drop the old restrictive policy that blocks all reads
DROP POLICY IF EXISTS "Block anonymous access to profiles (select)" ON public.profiles;

-- =====================================================
-- FIX 2: Allow team members to view blocks on team boards
-- =====================================================

-- First, create a helper function to check if a block is on a team board the user can access
CREATE OR REPLACE FUNCTION public.can_access_block(p_block_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = p_block_id
      AND (
        b.user_id = auth.uid()  -- Own block
        OR bo.is_public = true  -- Public board
        OR (bo.team_id IS NOT NULL AND is_team_member(auth.uid(), bo.team_id))  -- Team board
      )
  )
$$;

-- Add policy for team members to view blocks on team boards
CREATE POLICY "Team members can view team board blocks"
ON public.blocks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM boards bo
    WHERE bo.id = board_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- =====================================================
-- FIX 3: Allow team members to view/manage messages on team boards
-- =====================================================

-- Create helper function to check block access for messages
CREATE OR REPLACE FUNCTION public.can_access_block_messages(p_block_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = p_block_id
      AND (
        b.user_id = auth.uid()  -- Own block
        OR (bo.team_id IS NOT NULL AND is_team_member(auth.uid(), bo.team_id))  -- Team board
      )
  )
$$;

-- Allow team members to view messages on team boards
CREATE POLICY "Team members can view team board messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = block_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Allow team members to insert messages on team boards
CREATE POLICY "Team members can insert messages to team boards"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id  -- Message must have correct user_id
  AND EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = block_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Allow team members to update their own messages on team boards
CREATE POLICY "Team members can update own messages on team boards"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = user_id  -- Can only update own messages
  AND EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = block_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Allow team members to delete their own messages on team boards
CREATE POLICY "Team members can delete own messages on team boards"
ON public.messages
FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = block_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- =====================================================
-- FIX 4: Allow team members to manage blocks on team boards
-- =====================================================

-- Team members can insert blocks to team boards
CREATE POLICY "Team members can create blocks on team boards"
ON public.blocks
FOR INSERT
WITH CHECK (
  auth.uid() = user_id  -- Block must have correct user_id
  AND EXISTS (
    SELECT 1
    FROM boards bo
    WHERE bo.id = board_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Team members can update blocks on team boards
CREATE POLICY "Team members can update blocks on team boards"
ON public.blocks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM boards bo
    WHERE bo.id = board_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Team admins/owners can delete blocks on team boards
CREATE POLICY "Team admins can delete blocks on team boards"
ON public.blocks
FOR DELETE
USING (
  user_id = auth.uid()  -- Can delete own blocks
  OR EXISTS (
    SELECT 1
    FROM boards bo
    WHERE bo.id = board_id
      AND bo.team_id IS NOT NULL
      AND is_team_admin_or_owner(auth.uid(), bo.team_id)
  )
);

-- =====================================================
-- FIX 5: Allow team members to manage block_connections on team boards
-- =====================================================

-- View connections on team boards
CREATE POLICY "Team members can view team board connections"
ON public.block_connections
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = source_block_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Insert connections on team boards
CREATE POLICY "Team members can create team board connections"
ON public.block_connections
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = source_block_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Delete connections on team boards
CREATE POLICY "Team members can delete team board connections"
ON public.block_connections
FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM blocks b
    JOIN boards bo ON bo.id = b.board_id
    WHERE b.id = source_block_id
      AND bo.team_id IS NOT NULL
      AND is_team_admin_or_owner(auth.uid(), bo.team_id)
  )
);

-- =====================================================
-- FIX 6: Allow team members to view uploads on team boards
-- =====================================================

CREATE POLICY "Team members can view team board uploads"
ON public.uploads
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM boards bo
    WHERE bo.id = board_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

CREATE POLICY "Team members can upload to team boards"
ON public.uploads
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM boards bo
    WHERE bo.id = board_id
      AND bo.team_id IS NOT NULL
      AND is_team_member(auth.uid(), bo.team_id)
  )
);

CREATE POLICY "Team members can delete uploads on team boards"
ON public.uploads
FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM boards bo
    WHERE bo.id = board_id
      AND bo.team_id IS NOT NULL
      AND is_team_admin_or_owner(auth.uid(), bo.team_id)
  )
);

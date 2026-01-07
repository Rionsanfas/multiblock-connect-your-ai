-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for request status
CREATE TYPE public.api_key_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create api_key_access_requests table
CREATE TABLE public.api_key_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.api_key_request_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(api_key_id, requester_id)
);

-- Enable RLS
ALTER TABLE public.api_key_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own requests"
ON public.api_key_access_requests FOR SELECT
USING (requester_id = auth.uid());

CREATE POLICY "Team admins/owners can view team requests"
ON public.api_key_access_requests FOR SELECT
USING (is_team_admin_or_owner(team_id, auth.uid()));

CREATE POLICY "Users can create requests for teams they belong to"
ON public.api_key_access_requests FOR INSERT
WITH CHECK (
  requester_id = auth.uid() AND
  is_team_member(team_id, auth.uid())
);

CREATE POLICY "Team admins/owners can update requests"
ON public.api_key_access_requests FOR UPDATE
USING (is_team_admin_or_owner(team_id, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_api_key_access_requests_updated_at
BEFORE UPDATE ON public.api_key_access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to request access to an API key
CREATE OR REPLACE FUNCTION public.request_api_key_access(
  p_team_id UUID,
  p_api_key_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Check user is team member
  IF NOT is_team_member(p_team_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a team member';
  END IF;
  
  -- Check API key belongs to team
  IF NOT EXISTS (SELECT 1 FROM api_keys WHERE id = p_api_key_id AND team_id = p_team_id) THEN
    RAISE EXCEPTION 'API key not found in team';
  END IF;
  
  -- Insert or update request
  INSERT INTO api_key_access_requests (team_id, api_key_id, requester_id)
  VALUES (p_team_id, p_api_key_id, auth.uid())
  ON CONFLICT (api_key_id, requester_id) 
  DO UPDATE SET status = 'pending', updated_at = now(), resolved_by = NULL, resolved_at = NULL
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$;

-- Function to resolve (approve/reject) a request
CREATE OR REPLACE FUNCTION public.resolve_api_key_request(
  p_request_id UUID,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Get team_id and check admin/owner
  SELECT team_id INTO v_team_id FROM api_key_access_requests WHERE id = p_request_id;
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  IF NOT is_team_admin_or_owner(v_team_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE api_key_access_requests
  SET 
    status = CASE WHEN p_approved THEN 'approved'::api_key_request_status ELSE 'rejected'::api_key_request_status END,
    resolved_by = auth.uid(),
    resolved_at = now(),
    rejection_reason = CASE WHEN p_approved THEN NULL ELSE p_rejection_reason END,
    updated_at = now()
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$;

-- Function to check if user has access to a team API key
CREATE OR REPLACE FUNCTION public.has_team_api_key_access(p_api_key_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM api_keys ak
    WHERE ak.id = p_api_key_id
    AND ak.team_id IS NOT NULL
    AND (
      -- User is the key owner
      ak.user_id = auth.uid()
      -- Or user is team admin/owner
      OR is_team_admin_or_owner(ak.team_id, auth.uid())
      -- Or user has approved access
      OR EXISTS (
        SELECT 1 FROM api_key_access_requests ar
        WHERE ar.api_key_id = p_api_key_id
        AND ar.requester_id = auth.uid()
        AND ar.status = 'approved'
      )
    )
  );
$$;

-- Function to get pending requests count for team owners/admins
CREATE OR REPLACE FUNCTION public.get_pending_api_key_requests_count(p_team_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM api_key_access_requests
  WHERE team_id = p_team_id
    AND status = 'pending'
    AND is_team_admin_or_owner(p_team_id, auth.uid());
$$;
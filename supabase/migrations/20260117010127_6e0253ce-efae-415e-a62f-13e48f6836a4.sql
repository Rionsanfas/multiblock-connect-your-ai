-- Add api_key_id column to boards table for board-level API key binding
-- This allows each board to be linked to a specific API key

ALTER TABLE public.boards 
ADD COLUMN api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX idx_boards_api_key_id ON public.boards(api_key_id);

-- Add a comment explaining the column
COMMENT ON COLUMN public.boards.api_key_id IS 'The specific API key this board uses for all AI operations. If NULL, the system will use default key resolution.';

-- Create a function to get the board's API key for chat-proxy
CREATE OR REPLACE FUNCTION public.get_board_api_key(p_board_id UUID)
RETURNS TABLE (
  api_key_encrypted TEXT,
  provider public.llm_provider,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.api_key_encrypted,
    ak.provider,
    ak.is_valid
  FROM public.boards b
  JOIN public.api_keys ak ON ak.id = b.api_key_id
  WHERE b.id = p_board_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_board_api_key(UUID) TO authenticated;

-- Create a function to get available API keys for a board based on workspace
-- This returns all keys the user can choose from for a given board
CREATE OR REPLACE FUNCTION public.get_available_keys_for_board(p_board_id UUID)
RETURNS TABLE (
  id UUID,
  provider public.llm_provider,
  key_hint TEXT,
  is_valid BOOLEAN,
  team_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_team_id UUID;
  v_board_user_id UUID;
BEGIN
  -- Get the board's team_id and user_id
  SELECT b.team_id, b.user_id INTO v_board_team_id, v_board_user_id
  FROM public.boards b
  WHERE b.id = p_board_id;
  
  IF v_board_team_id IS NOT NULL THEN
    -- Team board: return all team API keys
    RETURN QUERY
    SELECT 
      ak.id,
      ak.provider,
      ak.key_hint,
      ak.is_valid,
      ak.team_id,
      ak.user_id,
      ak.created_at
    FROM public.api_keys ak
    WHERE ak.team_id = v_board_team_id
      AND (ak.is_valid IS NULL OR ak.is_valid = true)
    ORDER BY ak.provider, ak.created_at;
  ELSE
    -- Personal board: return user's personal API keys
    RETURN QUERY
    SELECT 
      ak.id,
      ak.provider,
      ak.key_hint,
      ak.is_valid,
      ak.team_id,
      ak.user_id,
      ak.created_at
    FROM public.api_keys ak
    WHERE ak.user_id = v_board_user_id
      AND ak.team_id IS NULL
      AND (ak.is_valid IS NULL OR ak.is_valid = true)
    ORDER BY ak.provider, ak.created_at;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_available_keys_for_board(UUID) TO authenticated;
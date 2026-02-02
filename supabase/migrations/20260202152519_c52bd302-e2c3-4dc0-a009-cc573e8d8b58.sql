-- Create enum for memory item types
CREATE TYPE public.memory_item_type AS ENUM ('fact', 'decision', 'constraint', 'note');

-- Create board_memory table
CREATE TABLE public.board_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.memory_item_type NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  source_block_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast board lookups
CREATE INDEX idx_board_memory_board_id ON public.board_memory(board_id);

-- Enable RLS
ALTER TABLE public.board_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can manage memory on their own boards
CREATE POLICY "Users can view memory on their own boards"
ON public.board_memory FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM boards WHERE boards.id = board_memory.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert memory on their own boards"
ON public.board_memory FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM boards WHERE boards.id = board_memory.board_id AND boards.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own memory items"
ON public.board_memory FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory items"
ON public.board_memory FOR DELETE
USING (auth.uid() = user_id);

-- Team board policies
CREATE POLICY "Team members can view team board memory"
ON public.board_memory FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM boards bo
    WHERE bo.id = board_memory.board_id
    AND bo.team_id IS NOT NULL
    AND is_team_member(auth.uid(), bo.team_id)
  )
);

CREATE POLICY "Team members can insert memory on team boards"
ON public.board_memory FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM boards bo
    WHERE bo.id = board_memory.board_id
    AND bo.team_id IS NOT NULL
    AND is_team_member(auth.uid(), bo.team_id)
  )
);

CREATE POLICY "Team members can update own memory on team boards"
ON public.board_memory FOR UPDATE
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM boards bo
    WHERE bo.id = board_memory.board_id
    AND bo.team_id IS NOT NULL
    AND is_team_member(auth.uid(), bo.team_id)
  )
);

CREATE POLICY "Team members can delete own memory on team boards"
ON public.board_memory FOR DELETE
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM boards bo
    WHERE bo.id = board_memory.board_id
    AND bo.team_id IS NOT NULL
    AND is_team_member(auth.uid(), bo.team_id)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_board_memory_updated_at
BEFORE UPDATE ON public.board_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
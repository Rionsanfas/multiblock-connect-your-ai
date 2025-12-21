
-- ============================================
-- MESSAGES TABLE - COMPLETE PRODUCTION SCHEMA
-- Multi-tenant safe with proper ownership enforcement
-- ============================================

-- 1. Create messages table if not exists
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  size_bytes INTEGER GENERATED ALWAYS AS (octet_length(content)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create helper function to verify block ownership
CREATE OR REPLACE FUNCTION public.user_owns_block(p_user_id UUID, p_block_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.blocks 
    WHERE id = p_block_id 
      AND user_id = p_user_id
  )
$$;

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their own blocks" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- 5. Create RLS policies with block ownership enforcement

-- SELECT: Users can only view their own messages
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only insert messages to blocks they own
CREATE POLICY "Users can insert messages to their own blocks"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.user_owns_block(auth.uid(), block_id)
);

-- UPDATE: Users can only update their own messages on their own blocks
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.user_owns_block(auth.uid(), block_id)
)
WITH CHECK (
  auth.uid() = user_id 
  AND public.user_owns_block(auth.uid(), block_id)
);

-- DELETE: Users can only delete their own messages on their own blocks
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.user_owns_block(auth.uid(), block_id)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_block_id_created_at 
ON public.messages(block_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_user_id 
ON public.messages(user_id);

-- 7. Create trigger for updated_at (using existing function)
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 8. Grant permissions
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

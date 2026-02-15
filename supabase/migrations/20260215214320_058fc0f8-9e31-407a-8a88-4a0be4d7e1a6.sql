
-- =============================================
-- RLS POLICIES FOR DOWNGRADE ENFORCEMENT
-- =============================================

-- Policy 1: Prevent messages in locked blocks
DROP POLICY IF EXISTS "prevent_messages_in_locked_blocks" ON messages;
CREATE POLICY "prevent_messages_in_locked_blocks"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  NOT COALESCE((
    SELECT is_block_locked(block_id)
  ), false)
);

-- Policy 2: Prevent creating blocks in locked boards
DROP POLICY IF EXISTS "prevent_blocks_in_locked_boards" ON blocks;
CREATE POLICY "prevent_blocks_in_locked_boards"
ON blocks
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM boards 
    WHERE id = board_id 
    AND is_locked = true
  )
);

-- Policy 3: Enforce board limit on insert
DROP POLICY IF EXISTS "enforce_board_limit_on_insert" ON boards;
CREATE POLICY "enforce_board_limit_on_insert"
ON boards
FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT COUNT(*) 
    FROM boards 
    WHERE user_id = auth.uid() 
    AND team_id IS NULL
  ) < (
    SELECT COALESCE(boards, 1)
    FROM user_billing 
    WHERE user_id = auth.uid()
  )
);

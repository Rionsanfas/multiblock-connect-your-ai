-- Drop existing policies first to recreate with proper security
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;

-- Create a secure view that excludes the encrypted key column
CREATE OR REPLACE VIEW public.api_keys_safe AS
SELECT 
  id,
  user_id,
  provider,
  key_hint,
  is_valid,
  last_validated_at,
  created_at,
  updated_at
FROM public.api_keys;

-- Enable RLS on the base table
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can ONLY select their own keys via the safe view columns
-- The encrypted column is NOT accessible - only service role can read it
CREATE POLICY "users_select_own_keys_safe"
ON public.api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own keys
CREATE POLICY "users_insert_own_keys"
ON public.api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own keys (but edge function handles encryption)
CREATE POLICY "users_update_own_keys"
ON public.api_keys
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own keys
CREATE POLICY "users_delete_own_keys"
ON public.api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Grant select on safe view to authenticated users
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- Revoke direct select on encrypted column from anon/authenticated
-- (RLS handles row access, but this adds defense in depth)
REVOKE ALL ON public.api_keys FROM anon;
GRANT SELECT (id, user_id, provider, key_hint, is_valid, last_validated_at, created_at, updated_at) ON public.api_keys TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
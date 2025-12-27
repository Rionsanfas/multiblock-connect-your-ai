-- 1) Explicitly block anon access to profiles (defense-in-depth)

-- Make sure anonymous users have no table privileges.
REVOKE ALL ON TABLE public.profiles FROM anon;

-- Ensure authenticated users still have the required table privileges.
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- Add explicit deny policies for anon (even if privileges are accidentally re-granted later).
DROP POLICY IF EXISTS "Block anonymous access to profiles (select)" ON public.profiles;
CREATE POLICY "Block anonymous access to profiles (select)"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (false);

DROP POLICY IF EXISTS "Block anonymous access to profiles (write)" ON public.profiles;
CREATE POLICY "Block anonymous access to profiles (write)"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);


-- 2) Remove redundant service_role RLS policies (service_role bypasses RLS by design)

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all addons" ON public.user_addons;
DROP POLICY IF EXISTS "Service role can manage all storage usage" ON public.user_storage_usage;

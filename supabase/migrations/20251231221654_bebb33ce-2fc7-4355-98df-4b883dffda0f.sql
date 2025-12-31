-- Fix the SECURITY DEFINER view warning by setting it to SECURITY INVOKER
-- This ensures the view respects the caller's RLS policies, not the view creator's
ALTER VIEW public.api_keys_safe SET (security_invoker = on);
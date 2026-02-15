-- Fix handle_new_user() to use correct free tier limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Assign free subscription plan
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE tier = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, free_plan_id, 'active');
  END IF;

  -- Initialize user_billing with CORRECT free tier limits
  INSERT INTO public.user_billing (
    user_id,
    active_plan,
    plan_category,
    billing_type,
    subscription_status,
    is_lifetime,
    boards,
    blocks,
    storage_gb,
    seats
  ) VALUES (
    NEW.id,
    'free',
    'individual',
    'annual',
    'active',
    false,
    1,      -- CHANGED from 3 to 1 (free tier: 1 board)
    3,      -- Free tier: 3 blocks per board
    0,      -- CHANGED from 1 to 0 (storage_gb is integer, 100MB < 1GB rounds to 0; effective limit enforced via subscription_plans.storage_mb = 100)
    1       -- Free tier: 1 seat
  );

  RETURN NEW;
END;
$$;
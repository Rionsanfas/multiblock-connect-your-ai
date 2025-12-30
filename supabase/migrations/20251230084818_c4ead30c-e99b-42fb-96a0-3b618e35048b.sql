-- Update handle_new_user to also create user_billing row with free plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
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
  
  -- Initialize user_billing with free plan defaults
  INSERT INTO public.user_billing (
    user_id, 
    active_plan, 
    subscription_status, 
    is_lifetime, 
    boards, 
    blocks, 
    storage_gb, 
    seats
  )
  VALUES (
    NEW.id,
    'free',
    'active',
    false,
    3,      -- Free plan: 3 boards
    10,     -- Free plan: 10 blocks per board
    1,      -- Free plan: 1 GB storage
    1       -- Free plan: 1 seat
  );
  
  RETURN NEW;
END;
$function$;
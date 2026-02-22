
-- Fix search_path on generate_webhook_token
CREATE OR REPLACE FUNCTION public.generate_webhook_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(24), 'hex');
END;
$$;

-- Fix search_path on set_webhook_details
CREATE OR REPLACE FUNCTION public.set_webhook_details()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.webhook_token IS NULL OR NEW.webhook_token = '' THEN
    NEW.webhook_token = public.generate_webhook_token();
  END IF;
  NEW.webhook_url = 'https://dpeljwqtkjjkriobkhtj.supabase.co/functions/v1/openclaw-webhook?token=' || NEW.webhook_token;
  RETURN NEW;
END;
$$;

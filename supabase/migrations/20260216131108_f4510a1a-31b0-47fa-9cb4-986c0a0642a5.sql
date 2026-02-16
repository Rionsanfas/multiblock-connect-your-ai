
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

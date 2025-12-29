-- Create user_billing table for Polar customer portal
CREATE TABLE public.user_billing (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_customer_id TEXT UNIQUE,
  active_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_lifetime BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing info
CREATE POLICY "Users can view their own billing"
ON public.user_billing
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all billing records
CREATE POLICY "Service role can manage all billing"
ON public.user_billing
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_user_billing_updated_at
BEFORE UPDATE ON public.user_billing
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_user_billing_polar_customer_id ON public.user_billing(polar_customer_id);

COMMENT ON TABLE public.user_billing IS 'Stores Polar customer IDs and billing status for customer portal access';
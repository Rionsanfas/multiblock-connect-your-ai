-- Create a table to track LTD seats inventory
CREATE TABLE public.ltd_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_seats INTEGER NOT NULL DEFAULT 250,
  remaining_seats INTEGER NOT NULL DEFAULT 250,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial inventory
INSERT INTO public.ltd_inventory (total_seats, remaining_seats) 
VALUES (250, 250);

-- Enable RLS
ALTER TABLE public.ltd_inventory ENABLE ROW LEVEL SECURITY;

-- Everyone can read the inventory (public info)
CREATE POLICY "Anyone can view LTD inventory" 
ON public.ltd_inventory 
FOR SELECT 
USING (true);

-- Create function to decrement LTD seats (called by webhook)
CREATE OR REPLACE FUNCTION public.decrement_ltd_seats()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE public.ltd_inventory
  SET remaining_seats = remaining_seats - 1,
      updated_at = now()
  WHERE remaining_seats > 0
  RETURNING remaining_seats INTO v_remaining;
  
  RETURN COALESCE(v_remaining, 0);
END;
$$;

-- Create function to get current LTD inventory
CREATE OR REPLACE FUNCTION public.get_ltd_inventory()
RETURNS TABLE(total_seats INTEGER, remaining_seats INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT li.total_seats, li.remaining_seats
  FROM public.ltd_inventory li
  LIMIT 1;
END;
$$;
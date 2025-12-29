import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configuration - maps plan_key to Polar product IDs
const PLAN_CONFIG: Record<string, { 
  productId: string; 
  name: string;
  boards: number;
  storageGb: number;
  seats: number;
  isLifetime: boolean;
}> = {
  // Individual Annual Plans
  'starter-individual-annual': {
    productId: '08f5e07b-9f61-431f-835d-a0864edaa613', // Replace with actual Polar product ID
    name: 'Starter Individual (Annual)',
    boards: 50,
    storageGb: 2,
    seats: 1,
    isLifetime: false,
  },
  'pro-individual-annual': {
    productId: 'pro-individual-annual-product-id',
    name: 'Pro Individual (Annual)',
    boards: 100,
    storageGb: 4,
    seats: 1,
    isLifetime: false,
  },
  // Team Annual Plans
  'starter-team-annual': {
    productId: 'starter-team-annual-product-id',
    name: 'Starter Team (Annual)',
    boards: 50,
    storageGb: 5,
    seats: 10,
    isLifetime: false,
  },
  'pro-team-annual': {
    productId: 'pro-team-annual-product-id',
    name: 'Pro Team (Annual)',
    boards: 100,
    storageGb: 6,
    seats: 20,
    isLifetime: false,
  },
  // Individual Lifetime Deals
  'ltd-starter-individual': {
    productId: 'ltd-starter-individual-product-id',
    name: 'Lifetime Starter Individual',
    boards: 50,
    storageGb: 6,
    seats: 1,
    isLifetime: true,
  },
  'ltd-pro-individual': {
    productId: 'ltd-pro-individual-product-id',
    name: 'Lifetime Pro Individual',
    boards: 150,
    storageGb: 7,
    seats: 1,
    isLifetime: true,
  },
  // Team Lifetime Deals
  'ltd-starter-team': {
    productId: 'ltd-starter-team-product-id',
    name: 'Lifetime Starter Team',
    boards: 150,
    storageGb: 8,
    seats: 10,
    isLifetime: true,
  },
  'ltd-pro-team': {
    productId: 'ltd-pro-team-product-id',
    name: 'Lifetime Pro Team',
    boards: 200,
    storageGb: 9,
    seats: 15,
    isLifetime: true,
  },
};

// Addon configuration
const ADDON_CONFIG: Record<string, {
  productId: string;
  name: string;
  extraBoards: number;
  extraStorageGb: number;
}> = {
  'addon-boards-10': {
    productId: 'addon-boards-10-product-id',
    name: '+10 Boards Pack',
    extraBoards: 10,
    extraStorageGb: 1,
  },
  'addon-boards-20': {
    productId: 'addon-boards-20-product-id',
    name: '+20 Boards Pack',
    extraBoards: 20,
    extraStorageGb: 2,
  },
  'addon-boards-50': {
    productId: 'addon-boards-50-product-id',
    name: '+50 Boards Pack',
    extraBoards: 50,
    extraStorageGb: 4,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const POLAR_ACCESS_TOKEN = Deno.env.get('POLAR_ACCESS_TOKEN');
    if (!POLAR_ACCESS_TOKEN) {
      console.error('POLAR_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Checkout service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { plan_key, is_addon = false } = await req.json();
    if (!plan_key) {
      return new Response(
        JSON.stringify({ error: 'plan_key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get plan/addon configuration
    const config = is_addon ? ADDON_CONFIG[plan_key] : PLAN_CONFIG[plan_key];
    if (!config) {
      console.error('Unknown plan_key:', plan_key);
      return new Response(
        JSON.stringify({ error: 'Invalid plan_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating checkout for user:', user.id, 'plan:', plan_key);

    // Build success URL
    const origin = req.headers.get('origin') || 'https://multiblock.app';
    const successUrl = `${origin}/dashboard?checkout=success`;

    // Create Polar checkout session
    const checkoutResponse = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: config.productId,
        success_url: successUrl,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_key: plan_key,
          is_addon: is_addon.toString(),
        },
      }),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error('Polar API error:', checkoutResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutData = await checkoutResponse.json();
    console.log('Checkout session created:', checkoutData.id);

    return new Response(
      JSON.stringify({ 
        checkout_url: checkoutData.url,
        checkout_id: checkoutData.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Checkout creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

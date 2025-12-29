import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Plan configuration - maps plan_key to entitlements
 * The checkout_link_id is the polar_cl_* ID from your Polar dashboard
 */
const PLAN_CONFIG: Record<string, { 
  checkoutLinkId: string; 
  name: string;
  boards: number;
  storageGb: number;
  seats: number;
  isLifetime: boolean;
}> = {
  // Individual Annual Plans
  'starter-individual-annual': {
    checkoutLinkId: 'polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v',
    name: 'Starter Individual (Annual)',
    boards: 50,
    storageGb: 2,
    seats: 1,
    isLifetime: false,
  },
  'pro-individual-annual': {
    checkoutLinkId: 'polar_cl_0ANxHBAcEKSneKreosoVddmOPsNRvBMDaHKgv1QrrU9',
    name: 'Pro Individual (Annual)',
    boards: 100,
    storageGb: 4,
    seats: 1,
    isLifetime: false,
  },
  // Team Annual Plans
  'starter-team-annual': {
    checkoutLinkId: 'polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy',
    name: 'Starter Team (Annual)',
    boards: 50,
    storageGb: 5,
    seats: 10,
    isLifetime: false,
  },
  'pro-team-annual': {
    checkoutLinkId: 'polar_cl_kEOB6DUJjs7JONbOH91zrlACAQDEub2L9px0f3s4BuS',
    name: 'Pro Team (Annual)',
    boards: 100,
    storageGb: 6,
    seats: 20,
    isLifetime: false,
  },
  // Individual Lifetime Deals
  'ltd-starter-individual': {
    checkoutLinkId: 'polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw',
    name: 'Lifetime Starter Individual',
    boards: 50,
    storageGb: 6,
    seats: 1,
    isLifetime: true,
  },
  'ltd-pro-individual': {
    checkoutLinkId: 'polar_cl_j6g5GaxCZ3MqM7FVpqt6vbsqk8zUUuLyUOIgR03k0oU',
    name: 'Lifetime Pro Individual',
    boards: 150,
    storageGb: 7,
    seats: 1,
    isLifetime: true,
  },
  // Team Lifetime Deals
  'ltd-starter-team': {
    checkoutLinkId: 'polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc',
    name: 'Lifetime Starter Team',
    boards: 150,
    storageGb: 8,
    seats: 10,
    isLifetime: true,
  },
  'ltd-pro-team': {
    checkoutLinkId: 'polar_cl_pQBNRD7r0QBz4pp47hOhg21aTfj5MLn9ffRnL0dxbnR',
    name: 'Lifetime Pro Team',
    boards: 200,
    storageGb: 9,
    seats: 15,
    isLifetime: true,
  },
};

// Addon configuration
const ADDON_CONFIG: Record<string, {
  checkoutLinkId: string;
  name: string;
  extraBoards: number;
  extraStorageGb: number;
}> = {
  'addon-1gb': {
    checkoutLinkId: 'polar_cl_OBo7BCQ6ZYvqCFhc59DMFZJqfSg2ORRsow1RI3e8hEM',
    name: '+1 GB Add-On',
    extraBoards: 10,
    extraStorageGb: 1,
  },
  'addon-2gb': {
    checkoutLinkId: 'polar_cl_3jJPkH6afjDo1zVJUsauoPKlIclTotWyV9ssE006a3k',
    name: '+2 GB Add-On',
    extraBoards: 20,
    extraStorageGb: 2,
  },
  'addon-4gb': {
    checkoutLinkId: 'polar_cl_1Oj5sYbfwJyVjmzPXnnjnlr9YS2TVCQd7OsyG1IzSMj',
    name: '+4 GB Add-On',
    extraBoards: 50,
    extraStorageGb: 4,
  },
  'addon-5gb': {
    checkoutLinkId: 'polar_cl_BL5ku7NkvCcIsfr2pjq1gHnmn5sN87tkja0IP0PaJDT',
    name: '+5 GB Add-On',
    extraBoards: 60,
    extraStorageGb: 5,
  },
  'addon-10gb': {
    checkoutLinkId: 'polar_cl_JCkbiUFVssy28q7auRRSmERW2XUwIhqt2JnrY2yCy9b',
    name: '+10 GB Add-On',
    extraBoards: 120,
    extraStorageGb: 10,
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

    console.log('Creating checkout for user:', user.id, 'plan:', plan_key, 'checkoutLinkId:', config.checkoutLinkId);

    // CRITICAL: Create checkout session from checkout link with metadata
    // This ensures user_id and plan_key are attached server-side
    const checkoutResponse = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_link_id: config.checkoutLinkId,
        customer_email: user.email,
        // CRITICAL: Metadata is attached server-side - this is what webhook receives
        metadata: {
          user_id: user.id,
          user_email: user.email || '',
          plan_key: plan_key,
          is_addon: is_addon ? 'true' : 'false',
        },
        // No success_url - embed handles redirect
      }),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error('Polar API error:', checkoutResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutData = await checkoutResponse.json();
    console.log('Checkout session created:', checkoutData.id, 'url:', checkoutData.url);

    return new Response(
      JSON.stringify({ 
        checkout_url: checkoutData.url,
        checkout_id: checkoutData.id,
        client_secret: checkoutData.client_secret,
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Plan configuration - maps plan_key to Polar checkout URLs
 * Updated for monthly-first pricing (Feb 2026)
 */
const PLAN_CONFIG: Record<string, { 
  checkoutUrl: string; 
  name: string;
  boards: number;
  storageGb: number;
  seats: number;
  isLifetime: boolean;
}> = {
  // New monthly/annual plans
  'pro-monthly': {
    checkoutUrl: 'https://polar.sh/multiblock/checkout?product=8756df4f-5d81-4e88-8f9f-0e8d2dfe03a3',
    name: 'Pro Monthly',
    boards: 50,
    storageGb: 5,
    seats: 1,
    isLifetime: false,
  },
  'pro-annual': {
    checkoutUrl: 'https://polar.sh/multiblock/checkout?product=7ce03e88-d1a3-45f7-a60d-f282aa83e94a',
    name: 'Pro Annual',
    boards: 50,
    storageGb: 5,
    seats: 1,
    isLifetime: false,
  },
  'team-monthly': {
    checkoutUrl: 'https://polar.sh/multiblock/checkout?product=bbace997-28ad-4afe-877e-b932e41e29c6',
    name: 'Pro Team Monthly',
    boards: 50,
    storageGb: 20,
    seats: 10,
    isLifetime: false,
  },
  'team-annual': {
    checkoutUrl: 'https://polar.sh/multiblock/checkout?product=4bf80645-0f04-4cac-b614-35af721dc294',
    name: 'Pro Team Annual',
    boards: 50,
    storageGb: 20,
    seats: 10,
    isLifetime: false,
  },
  // Legacy plans (for existing grandfathered users)
  'starter-individual-annual': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v',
    name: 'Pro (Annual - Legacy)',
    boards: 50,
    storageGb: 2,
    seats: 1,
    isLifetime: false,
  },
  'pro-individual-annual': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v',
    name: 'Pro (Annual - Legacy)',
    boards: 50,
    storageGb: 2,
    seats: 1,
    isLifetime: false,
  },
  'starter-team-annual': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy',
    name: 'Pro Team (Annual - Legacy)',
    boards: 50,
    storageGb: 5,
    seats: 10,
    isLifetime: false,
  },
  'pro-team-annual': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy',
    name: 'Pro Team (Annual - Legacy)',
    boards: 50,
    storageGb: 5,
    seats: 10,
    isLifetime: false,
  },
  'ltd-starter-individual': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw',
    name: 'Pro Lifetime (Legacy)',
    boards: 50,
    storageGb: 6,
    seats: 1,
    isLifetime: true,
  },
  'ltd-pro-individual': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw',
    name: 'Pro Lifetime (Legacy)',
    boards: 50,
    storageGb: 6,
    seats: 1,
    isLifetime: true,
  },
  'ltd-starter-team': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc',
    name: 'Pro Lifetime Team (Legacy)',
    boards: 150,
    storageGb: 8,
    seats: 10,
    isLifetime: true,
  },
  'ltd-pro-team': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc',
    name: 'Pro Lifetime Team (Legacy)',
    boards: 150,
    storageGb: 8,
    seats: 10,
    isLifetime: true,
  },
};

// Addon configuration (kept for existing users)
const ADDON_CONFIG: Record<string, {
  checkoutUrl: string;
  name: string;
  extraBoards: number;
  extraStorageGb: number;
}> = {
  'addon-1gb': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_OBo7BCQ6ZYvqCFhc59DMFZJqfSg2ORRsow1RI3e8hEM',
    name: '+1 GB Add-On',
    extraBoards: 10,
    extraStorageGb: 1,
  },
  'addon-2gb': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_3jJPkH6afjDo1zVJUsauoPKlIclTotWyV9ssE006a3k',
    name: '+2 GB Add-On',
    extraBoards: 20,
    extraStorageGb: 2,
  },
  'addon-4gb': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_1Oj5sYbfwJyVjmzPXnnjnlr9YS2TVCQd7OsyG1IzSMj',
    name: '+4 GB Add-On',
    extraBoards: 50,
    extraStorageGb: 4,
  },
  'addon-5gb': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_BL5ku7NkvCcIsfr2pjq1gHnmn5sN87tkja0IP0PaJDT',
    name: '+5 GB Add-On',
    extraBoards: 60,
    extraStorageGb: 5,
  },
  'addon-10gb': {
    checkoutUrl: 'https://buy.polar.sh/polar_cl_JCkbiUFVssy28q7auRRSmERW2XUwIhqt2JnrY2yCy9b',
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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan_key, is_addon = false } = await req.json();
    if (!plan_key) {
      return new Response(
        JSON.stringify({ error: 'plan_key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = is_addon ? ADDON_CONFIG[plan_key] : PLAN_CONFIG[plan_key];
    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutUrl = new URL(config.checkoutUrl);
    checkoutUrl.searchParams.set('customer_external_id', user.id);
    checkoutUrl.searchParams.set('external_customer_id', user.id);
    checkoutUrl.searchParams.set('external_reference_id', user.id);
    checkoutUrl.searchParams.set('metadata[user_id]', user.id);
    checkoutUrl.searchParams.set('metadata[user_email]', user.email || '');
    checkoutUrl.searchParams.set('metadata[plan_key]', plan_key);
    checkoutUrl.searchParams.set('metadata[is_addon]', is_addon ? 'true' : 'false');
    checkoutUrl.searchParams.set('customer_email', user.email || '');
    checkoutUrl.searchParams.set('embed', 'true');

    return new Response(
      JSON.stringify({ 
        checkout_url: checkoutUrl.toString(),
        plan_key,
        is_addon,
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

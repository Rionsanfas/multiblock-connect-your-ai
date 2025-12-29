import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get secrets
    const POLAR_ACCESS_TOKEN = Deno.env.get('POLAR_ACCESS_TOKEN');
    if (!POLAR_ACCESS_TOKEN) {
      console.error('POLAR_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Polar access token not configured. Please add POLAR_ACCESS_TOKEN to edge function secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting customer portal for user:', user.id);

    // Get polar_customer_id from user_billing table
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: billing, error: billingError } = await serviceClient
      .from('user_billing')
      .select('polar_customer_id, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (billingError && billingError.code !== 'PGRST116') {
      console.error('Billing lookup error:', billingError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch billing info' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!billing?.polar_customer_id) {
      console.log('No polar_customer_id found for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'No active subscription found. Please purchase a plan first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found polar_customer_id:', billing.polar_customer_id);

    // Call Polar API to create customer session
    const polarResponse = await fetch('https://api.polar.sh/v1/customer-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: billing.polar_customer_id,
      }),
    });

    if (!polarResponse.ok) {
      const errorText = await polarResponse.text();
      console.error('Polar API error:', polarResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create customer portal session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionData = await polarResponse.json();
    console.log('Customer session created successfully');

    // Return the customer portal URL
    return new Response(
      JSON.stringify({ 
        customerPortalUrl: sessionData.customer_portal_url,
        success: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Customer portal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

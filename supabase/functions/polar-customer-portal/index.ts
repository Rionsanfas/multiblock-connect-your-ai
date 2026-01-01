import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    // Get polar_customer_id from user_billing using service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: billing, error: billingError } = await serviceClient
      .from("user_billing")
      .select("polar_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (billingError) {
      console.error("Billing lookup error:", billingError);
      return new Response(JSON.stringify({ error: "Failed to fetch billing info" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!billing?.polar_customer_id) {
      console.error("No polar_customer_id found for user:", user.id);
      return new Response(JSON.stringify({ error: "No billing record found. Please purchase a plan first." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Found polar_customer_id:", billing.polar_customer_id);

    // Get Polar API key
    const polarAccessToken = Deno.env.get("POLAR_ACCESS_TOKEN");
    if (!polarAccessToken) {
      console.error("POLAR_ACCESS_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Billing portal not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine Polar API base URL (sandbox vs production)
    const polarServer = Deno.env.get("POLAR_SERVER") || "production";
    const polarApiBase = polarServer === "sandbox" 
      ? "https://sandbox-api.polar.sh" 
      : "https://api.polar.sh";
    
    console.log("Using Polar API:", polarApiBase);

    // Create customer portal session via Polar API
    // Docs: POST /v1/customer-sessions
    const origin = req.headers.get("origin") ?? "";
    const returnUrl = origin ? `${origin}/settings` : undefined;

    const portalResponse = await fetch(`${polarApiBase}/v1/customer-sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${polarAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: billing.polar_customer_id,
        ...(returnUrl ? { return_url: returnUrl } : {}),
      }),
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      console.error("Polar API error:", portalResponse.status, errorText);
      return new Response(JSON.stringify({
        error: "Failed to create portal session",
        status: portalResponse.status,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const portalData = await portalResponse.json();
    const url = portalData?.customer_portal_url;

    if (!url) {
      console.error("Polar response missing customer_portal_url:", portalData);
      return new Response(JSON.stringify({ error: "Billing portal unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Portal session created successfully");

    // Return the portal URL
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

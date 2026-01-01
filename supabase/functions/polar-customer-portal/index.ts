import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CustomerPortal } from "npm:@polar-sh/supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  // Needed so the browser can read the redirect URL when using fetch({ redirect: 'manual' })
  "Access-Control-Expose-Headers": "location",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const POLAR_ACCESS_TOKEN = Deno.env.get("POLAR_ACCESS_TOKEN");
    if (!POLAR_ACCESS_TOKEN) {
      return withCors(
        new Response(
          JSON.stringify({
            error:
              "POLAR_ACCESS_TOKEN is not configured in Supabase Edge Function secrets.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      );
    }

    // Optional but recommended (for clean sandbox vs production support)
    const POLAR_SERVER = (Deno.env.get("POLAR_SERVER") || "production") as
      | "sandbox"
      | "production";

    // Recommended: set APP_URL (e.g. https://yourdomain.com). Fallbacks can be unreliable.
    const APP_URL = Deno.env.get("APP_URL") || "";
    const fallbackOrigin = req.headers.get("origin") || "";
    const baseUrl = (APP_URL || fallbackOrigin).replace(/\/+$/, "");
    const returnUrl = baseUrl ? `${baseUrl}/settings` : undefined;

    // Strict Supabase auth: require Authorization header
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return withCors(
        new Response(JSON.stringify({ error: "Authorization header required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return withCors(
        new Response(JSON.stringify({ error: "User not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    // Look up customer id from existing user_billing table
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: billing, error: billingError } = await serviceClient
      .from("user_billing")
      .select("polar_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (billingError) {
      console.error("[polar-customer-portal] Billing lookup error:", billingError);
      return withCors(
        new Response(JSON.stringify({ error: "Failed to fetch billing info" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    const customerId = billing?.polar_customer_id ?? null;
    if (!customerId) {
      return withCors(
        new Response(
          JSON.stringify({
            error:
              "No polar_customer_id found for this user. Complete purchase first or wait for webhook sync.",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        ),
      );
    }

    // Polar official adapter (Supabase) handles the session creation + redirect
    const portalHandler = CustomerPortal({
      accessToken: POLAR_ACCESS_TOKEN,
      server: POLAR_SERVER,
      returnUrl,
      getCustomerId: async () => customerId,
    });

    const res = await portalHandler(req);
    return withCors(res);
  } catch (error) {
    console.error("[polar-customer-portal] Unhandled error:", error);
    return withCors(
      new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
});


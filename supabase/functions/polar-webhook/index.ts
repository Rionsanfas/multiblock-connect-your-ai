import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
};

/**
 * Plan mapping: Polar product_id -> plan_key + limits
 * You need to update these product_ids from your Polar dashboard!
 */
const PRODUCT_MAP: Record<string, {
  plan_key: string;
  boards: number;
  blocks: number;
  storage_gb: number;
  seats: number;
  is_lifetime: boolean;
}> = {
  // Individual Annual
  '532c322f-5088-4e0a-bd5c-f08824f82a8a': { // Pro Individual (from logs)
    plan_key: 'pro-individual-annual',
    boards: 100,
    blocks: -1,
    storage_gb: 4,
    seats: 1,
    is_lifetime: false,
  },
  // Add more product mappings here as needed
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("========================================");
  console.log("[polar-webhook] INCOMING REQUEST");
  console.log("========================================");

  // Get raw body
  let rawBody = "";
  let body: any = null;
  
  try {
    rawBody = await req.text();
    console.log("[polar-webhook] RAW BODY:", rawBody);
    
    if (rawBody) {
      body = JSON.parse(rawBody);
    }
  } catch (e: unknown) {
    console.log("[polar-webhook] BODY PARSE ERROR:", e instanceof Error ? e.message : String(e));
    // Always return 200 to prevent Polar retries
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (!body) {
    console.log("[polar-webhook] No body, returning 200");
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const eventType = body.type;
  const data = body.data;

  console.log("[polar-webhook] EVENT TYPE:", eventType);
  console.log("[polar-webhook] DATA:", JSON.stringify(data, null, 2));

  // Only process order/subscription events
  const processableEvents = [
    'order.created',
    'order.updated',
    'subscription.created',
    'subscription.updated',
    'subscription.active',
    'subscription.canceled',
    'subscription.revoked',
    'checkout.created',
    'checkout.updated',
  ];

  if (!processableEvents.includes(eventType)) {
    console.log("[polar-webhook] Skipping event type:", eventType);
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Initialize Supabase with service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Extract customer email - try multiple locations
  const customerEmail = 
    data?.customer?.email || 
    data?.email || 
    data?.user?.email ||
    data?.metadata?.user_email ||
    null;

  console.log("[polar-webhook] Customer email:", customerEmail);

  if (!customerEmail) {
    console.log("[polar-webhook] No customer email found, cannot link to user");
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Find user by email in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', customerEmail)
    .single();

  if (profileError || !profile) {
    console.log("[polar-webhook] Could not find profile for email:", customerEmail, profileError);
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const userId = profile.id;
  console.log("[polar-webhook] Found user:", userId);

  // Extract subscription/order data
  const polarCustomerId = data?.customer_id || data?.customer?.id || null;
  const polarSubscriptionId = data?.subscription_id || data?.id || null;
  const productId = data?.product_id || data?.product?.id || null;
  const productPriceId = data?.product_price_id || null;
  const productName = data?.product?.name || 'Unknown';
  const subscriptionStatus = data?.status || 'active';
  const isPaid = data?.paid === true || data?.status === 'paid' || data?.status === 'active';
  
  // Get period end from subscription if available
  let currentPeriodEnd = null;
  if (data?.current_period_end) {
    currentPeriodEnd = data.current_period_end;
  } else if (data?.subscription?.current_period_end) {
    currentPeriodEnd = data.subscription.current_period_end;
  }

  // Determine plan limits from product mapping or defaults
  const productConfig = productId ? PRODUCT_MAP[productId] : null;
  const planKey = productConfig?.plan_key || data?.metadata?.plan_key || productName.toLowerCase().replace(/\s+/g, '-');
  const boards = productConfig?.boards ?? 100;
  const blocks = productConfig?.blocks ?? -1;
  const storageGb = productConfig?.storage_gb ?? 4;
  const seats = productConfig?.seats ?? data?.seats ?? 1;
  const isLifetime = productConfig?.is_lifetime ?? false;

  console.log("[polar-webhook] Plan config:", { planKey, boards, blocks, storageGb, seats, isLifetime });

  // Determine subscription status for our system
  let status = 'active';
  if (eventType.includes('canceled') || eventType.includes('revoked')) {
    status = 'canceled';
  } else if (subscriptionStatus === 'past_due') {
    status = 'past_due';
  } else if (isPaid) {
    status = 'active';
  }

  // Upsert to user_billing
  const billingData = {
    user_id: userId,
    polar_customer_id: polarCustomerId,
    polar_subscription_id: polarSubscriptionId,
    product_id: productId,
    product_price_id: productPriceId,
    active_plan: planKey,
    subscription_status: status,
    is_lifetime: isLifetime,
    boards: boards,
    blocks: blocks,
    storage_gb: storageGb,
    seats: seats,
    current_period_end: currentPeriodEnd,
    last_event_type: eventType,
    last_event_id: data?.id || null,
    updated_at: new Date().toISOString(),
  };

  console.log("[polar-webhook] Upserting billing data:", billingData);

  const { data: upsertResult, error: upsertError } = await supabase
    .from('user_billing')
    .upsert(billingData, { onConflict: 'user_id' })
    .select();

  if (upsertError) {
    console.error("[polar-webhook] Upsert error:", upsertError);
    // Still return 200 to prevent Polar retries
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  console.log("[polar-webhook] Upsert success:", upsertResult);
  console.log("========================================");
  console.log("[polar-webhook] DONE - User billing updated for:", userId);
  console.log("========================================");

  return new Response("ok", { 
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
  });
});

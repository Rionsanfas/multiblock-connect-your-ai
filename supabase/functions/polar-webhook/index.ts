import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
};

// Plan entitlement mappings - defines what each plan provides
const PLAN_ENTITLEMENTS: Record<string, {
  boards: number;
  storage_gb: number;
  seats: number;
  blocks: number; // -1 = unlimited
  is_lifetime: boolean;
}> = {
  'starter-individual-annual': { boards: 50, storage_gb: 2, seats: 1, blocks: -1, is_lifetime: false },
  'pro-individual-annual': { boards: 100, storage_gb: 4, seats: 1, blocks: -1, is_lifetime: false },
  'starter-team-annual': { boards: 50, storage_gb: 5, seats: 10, blocks: -1, is_lifetime: false },
  'pro-team-annual': { boards: 100, storage_gb: 6, seats: 20, blocks: -1, is_lifetime: false },
  'ltd-starter-individual': { boards: 50, storage_gb: 6, seats: 1, blocks: -1, is_lifetime: true },
  'ltd-pro-individual': { boards: 150, storage_gb: 7, seats: 1, blocks: -1, is_lifetime: true },
  'ltd-starter-team': { boards: 150, storage_gb: 8, seats: 10, blocks: -1, is_lifetime: true },
  'ltd-pro-team': { boards: 200, storage_gb: 9, seats: 15, blocks: -1, is_lifetime: true },
  'free': { boards: 3, storage_gb: 1, seats: 1, blocks: 10, is_lifetime: false },
};

/**
 * Extract user_id from Polar webhook payload - searches multiple locations
 */
function extractUserId(data: any): string | null {
  // Try all known locations where Polar might put the user ID
  const candidates = [
    data?.external_reference_id,
    data?.external_customer_id,
    data?.customer_external_id,
    data?.customer?.external_id,
    data?.checkout?.customer?.external_id,
    data?.subscription?.customer?.external_id,
    data?.metadata?.user_id,
    data?.checkout?.metadata?.user_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      console.log("[polar-webhook] Found user_id:", candidate);
      return candidate;
    }
  }

  console.error("[polar-webhook] No user_id found. Checked:", {
    external_reference_id: data?.external_reference_id,
    external_customer_id: data?.external_customer_id,
    customer_external_id: data?.customer_external_id,
    customer_external_id_nested: data?.customer?.external_id,
    metadata_user_id: data?.metadata?.user_id,
    data_keys: Object.keys(data || {}),
  });

  return null;
}

/**
 * Extract plan_key from metadata or product info
 */
function extractPlanKey(data: any): string | null {
  return data?.metadata?.plan_key
    ?? data?.checkout?.metadata?.plan_key
    ?? data?.subscription?.metadata?.plan_key
    ?? null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  // 1) Read raw body for signature verification
  const body = await req.text();

  // 2) Verify webhook signature
  const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET') ?? '';
  if (!webhookSecret) {
    console.error('[polar-webhook] POLAR_WEBHOOK_SECRET missing');
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const wh = new Webhook(btoa(webhookSecret));
    wh.verify(body, {
      'webhook-id': req.headers.get('webhook-id') ?? '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': req.headers.get('webhook-signature') ?? '',
    });
  } catch (err) {
    console.error('[polar-webhook] Signature verification failed:', String(err));
    return new Response(
      JSON.stringify({ error: 'Invalid webhook signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 3) Parse JSON
  let event: any;
  try {
    event = JSON.parse(body);
  } catch (err) {
    console.error('[polar-webhook] Invalid JSON:', String(err));
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const eventType = event?.type;
  const eventData = event?.data;

  console.log('========================================');
  console.log('[polar-webhook] Event received:', eventType);
  console.log('[polar-webhook] Event ID:', eventData?.id);
  console.log('[polar-webhook] Full data keys:', Object.keys(eventData || {}));
  console.log('[polar-webhook] Metadata:', JSON.stringify(eventData?.metadata));
  console.log('[polar-webhook] external_reference_id:', eventData?.external_reference_id);
  console.log('[polar-webhook] external_customer_id:', eventData?.external_customer_id);
  console.log('[polar-webhook] customer_external_id:', eventData?.customer_external_id);
  console.log('========================================');

  // 4) Extract user_id - MANDATORY
  const userId = extractUserId(eventData);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing user_id - cannot map to Supabase user' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 5) Build service-role Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 6) Verify user exists in auth.users
  try {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      console.error('[polar-webhook] User not found in auth.users:', userId);
      return new Response(
        JSON.stringify({ error: 'Unknown user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('[polar-webhook] auth.admin.getUserById failed:', String(err));
    return new Response(
      JSON.stringify({ error: 'User validation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 7) Extract billing data from webhook
  const polarCustomerId = eventData?.customer?.id ?? eventData?.customer_id ?? null;
  const polarSubscriptionId = eventData?.subscription?.id ?? eventData?.subscription_id ?? null;
  const productId = eventData?.product?.id ?? eventData?.product_id ?? null;
  const productPriceId = eventData?.product_price?.id ?? eventData?.product_price_id ?? null;
  const status = eventData?.subscription?.status ?? eventData?.status ?? 'active';
  const currentPeriodEnd = eventData?.subscription?.current_period_end ?? eventData?.current_period_end ?? null;

  // Determine plan_key and entitlements
  const planKey = extractPlanKey(eventData) ?? 'free';
  const entitlements = PLAN_ENTITLEMENTS[planKey] ?? PLAN_ENTITLEMENTS['free'];

  // Determine subscription status for our DB
  let subscriptionStatus = 'active';
  if (eventType === 'subscription.canceled' || eventType === 'subscription.cancelled') {
    subscriptionStatus = 'canceled';
  } else if (status === 'canceled' || status === 'cancelled') {
    subscriptionStatus = 'canceled';
  }

  console.log('[polar-webhook] Extracted values:', {
    user_id: userId,
    polar_customer_id: polarCustomerId,
    plan_key: planKey,
    subscription_status: subscriptionStatus,
    is_lifetime: entitlements.is_lifetime,
    boards: entitlements.boards,
    storage_gb: entitlements.storage_gb,
    seats: entitlements.seats,
    blocks: entitlements.blocks,
  });

  // 8) UPSERT user_billing - THE ONLY TABLE WE UPDATE
  const now = new Date().toISOString();

  const { data: upserted, error: upsertError } = await supabase
    .from('user_billing')
    .upsert({
      user_id: userId,
      polar_customer_id: polarCustomerId,
      polar_subscription_id: polarSubscriptionId,
      product_id: productId,
      product_price_id: productPriceId,
      active_plan: planKey,
      subscription_status: subscriptionStatus,
      current_period_end: currentPeriodEnd,
      is_lifetime: entitlements.is_lifetime,
      boards: entitlements.boards,
      blocks: entitlements.blocks,
      storage_gb: entitlements.storage_gb,
      seats: entitlements.seats,
      last_event_type: eventType,
      last_event_id: eventData?.id ?? null,
      updated_at: now,
    }, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (upsertError) {
    console.error('[polar-webhook] DB WRITE FAILED:', upsertError);
    return new Response(
      JSON.stringify({ error: 'DB write failed', details: upsertError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('[polar-webhook] DB WRITE SUCCESS:', upserted);
  console.log('[polar-webhook] Completed in', Date.now() - startedAt, 'ms');

  return new Response(
    JSON.stringify({ received: true, success: true, user_id: userId, plan: planKey }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

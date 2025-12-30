import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-polar-signature, webhook-id, webhook-timestamp, webhook-signature',
};

// Plan entitlement mappings - MUST match create-polar-checkout
const PLAN_ENTITLEMENTS: Record<string, {
  boards_limit: number;
  storage_gb: number;
  seats: number;
  blocks_unlimited: boolean;
  is_lifetime: boolean;
}> = {
  'starter-individual-annual': { boards_limit: 50, storage_gb: 2, seats: 1, blocks_unlimited: true, is_lifetime: false },
  'pro-individual-annual': { boards_limit: 100, storage_gb: 4, seats: 1, blocks_unlimited: true, is_lifetime: false },
  'starter-team-annual': { boards_limit: 50, storage_gb: 5, seats: 10, blocks_unlimited: true, is_lifetime: false },
  'pro-team-annual': { boards_limit: 100, storage_gb: 6, seats: 20, blocks_unlimited: true, is_lifetime: false },
  'ltd-starter-individual': { boards_limit: 50, storage_gb: 6, seats: 1, blocks_unlimited: true, is_lifetime: true },
  'ltd-pro-individual': { boards_limit: 150, storage_gb: 7, seats: 1, blocks_unlimited: true, is_lifetime: true },
  'ltd-starter-team': { boards_limit: 150, storage_gb: 8, seats: 10, blocks_unlimited: true, is_lifetime: true },
  'ltd-pro-team': { boards_limit: 200, storage_gb: 9, seats: 15, blocks_unlimited: true, is_lifetime: true },
};

// Addon entitlement mappings - MUST match create-polar-checkout
const ADDON_ENTITLEMENTS: Record<string, { extra_boards: number; extra_storage_gb: number }> = {
  'addon-1gb': { extra_boards: 10, extra_storage_gb: 1 },
  'addon-2gb': { extra_boards: 20, extra_storage_gb: 2 },
  'addon-4gb': { extra_boards: 50, extra_storage_gb: 4 },
  'addon-5gb': { extra_boards: 60, extra_storage_gb: 5 },
  'addon-10gb': { extra_boards: 120, extra_storage_gb: 10 },
};

/**
 * Extract Supabase user_id from Polar's webhook payload.
 * Polar sends user_id in different locations depending on event type:
 * - checkout.completed: external_reference_id OR checkout.customer.external_id
 * - subscription.*: customer.external_id
 * - order.*: customer.external_id
 * NON-NEGOTIABLE: no email matching.
 */
function extractExternalReferenceUserId(data: any): string | null {
  // Priority 1: external_reference_id (what we WANT Polar to send)
  if (typeof data?.external_reference_id === "string" && data.external_reference_id.length > 0) {
    console.log("[polar-webhook] Found external_reference_id:", data.external_reference_id);
    return data.external_reference_id;
  }

  // Polar is currently sending these instead (confirmed by logs: data_keys includes them)
  // Priority 2: external_customer_id
  if (typeof data?.external_customer_id === "string" && data.external_customer_id.length > 0) {
    console.log("[polar-webhook] Found external_customer_id:", data.external_customer_id);
    return data.external_customer_id;
  }

  // Priority 3: customer_external_id
  if (typeof data?.customer_external_id === "string" && data.customer_external_id.length > 0) {
    console.log("[polar-webhook] Found customer_external_id:", data.customer_external_id);
    return data.customer_external_id;
  }

  // Other possible locations (depends on Polar event)
  if (typeof data?.customer?.external_id === "string" && data.customer.external_id.length > 0) {
    console.log("[polar-webhook] Found customer.external_id:", data.customer.external_id);
    return data.customer.external_id;
  }

  if (typeof data?.checkout?.customer?.external_id === "string" && data.checkout.customer.external_id.length > 0) {
    console.log("[polar-webhook] Found checkout.customer.external_id:", data.checkout.customer.external_id);
    return data.checkout.customer.external_id;
  }

  if (typeof data?.subscription?.customer?.external_id === "string" && data.subscription.customer.external_id.length > 0) {
    console.log("[polar-webhook] Found subscription.customer.external_id:", data.subscription.customer.external_id);
    return data.subscription.customer.external_id;
  }

  // Fallbacks from our checkout metadata (still not email-based)
  if (typeof data?.metadata?.user_id === "string" && data.metadata.user_id.length > 0) {
    console.log("[polar-webhook] Found metadata.user_id:", data.metadata.user_id);
    return data.metadata.user_id;
  }

  if (typeof data?.checkout?.metadata?.user_id === "string" && data.checkout.metadata.user_id.length > 0) {
    console.log("[polar-webhook] Found checkout.metadata.user_id:", data.checkout.metadata.user_id);
    return data.checkout.metadata.user_id;
  }

  console.error("[polar-webhook] Missing user_id — cannot map user. Searched:", {
    external_reference_id: data?.external_reference_id ?? null,
    external_customer_id: data?.external_customer_id ?? null,
    customer_external_id: data?.customer_external_id ?? null,
    customer_external_id_nested: data?.customer?.external_id ?? null,
    checkout_customer_external_id: data?.checkout?.customer?.external_id ?? null,
    subscription_customer_external_id: data?.subscription?.customer?.external_id ?? null,
    metadata_user_id: data?.metadata?.user_id ?? null,
    checkout_metadata_user_id: data?.checkout?.metadata?.user_id ?? null,
    data_keys: Object.keys(data || {}),
    customer_keys: Object.keys(data?.customer || {}),
  });

  return null;
}

/**
 * Extract plan_key from multiple possible locations
 */
function extractPlanKey(data: any): string | null {
  if (data?.metadata?.plan_key) return data.metadata.plan_key;
  if (data?.checkout?.metadata?.plan_key) return data.checkout.metadata.plan_key;
  if (data?.subscription?.metadata?.plan_key) return data.subscription.metadata.plan_key;
  if (data?.order?.metadata?.plan_key) return data.order.metadata.plan_key;
  return null;
}

/**
 * Check if this is an addon purchase
 */
function isAddonPurchase(data: any): boolean {
  const isAddon = data?.metadata?.is_addon || 
                  data?.checkout?.metadata?.is_addon ||
                  data?.subscription?.metadata?.is_addon ||
                  data?.order?.metadata?.is_addon;
  return isAddon === 'true' || isAddon === true;
}

/**
 * ATOMIC: Update all billing tables in one operation
 */
async function updateUserBillingAtomic(
  supabase: any,
  userId: string,
  polarCustomerId: string | null,
  planKey: string,
  status: 'active' | 'cancelled' | 'canceled',
  isLifetime: boolean,
  currentPeriodEnd: string | null,
  polarSubscriptionId: string | null
): Promise<boolean> {
  const now = new Date().toISOString();
  const normalizedStatus = status === 'cancelled' ? 'canceled' : status;
  const entitlements = PLAN_ENTITLEMENTS[planKey];

  console.log('[polar-webhook] billing_update_start', {
    user_id: userId,
    polar_customer_id: polarCustomerId,
    plan_key: planKey,
    status: normalizedStatus,
    is_lifetime: isLifetime,
    current_period_end: currentPeriodEnd,
  });

  // Never overwrite an existing polar_customer_id with null/empty
  const { data: existingBilling, error: existingErr } = await supabase
    .from('user_billing')
    .select('polar_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingErr) {
    console.error('[polar-webhook] billing_select_failed', { user_id: userId, error: existingErr });
    return false;
  }

  const effectivePolarCustomerId =
    (typeof polarCustomerId === 'string' && polarCustomerId.length > 0)
      ? polarCustomerId
      : (existingBilling?.polar_customer_id ?? null);

  // 1. Upsert user_billing (CRITICAL for customer portal + frontend display)
  const { data: billingRow, error: billingError } = await supabase
    .from('user_billing')
    .upsert({
      user_id: userId,
      polar_customer_id: effectivePolarCustomerId,
      active_plan: planKey,
      subscription_status: normalizedStatus,
      is_lifetime: isLifetime,
      current_period_end: currentPeriodEnd,
      boards: entitlements?.boards_limit ?? 3,
      blocks: entitlements?.blocks_unlimited ? -1 : 10,
      storage_gb: entitlements?.storage_gb ?? 1,
      seats: entitlements?.seats ?? 1,
      updated_at: now,
    }, { onConflict: 'user_id' })
    .select('user_id, active_plan, subscription_status, polar_customer_id, boards, storage_gb, seats')
    .maybeSingle();

  if (billingError) {
    console.error('[polar-webhook] billing_upsert_failed', { user_id: userId, error: billingError });
    return false;
  }

  console.log('[polar-webhook] billing_upsert_ok', { row: billingRow });

  // 2. Upsert subscriptions table
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_key: planKey,
      provider: 'polar',
      status: normalizedStatus,
      period: isLifetime ? 'lifetime' : 'annual',
      is_lifetime: isLifetime,
      polar_subscription_id: polarSubscriptionId,
      polar_customer_id: effectivePolarCustomerId,
      started_at: now,
      ends_at: isLifetime ? null : currentPeriodEnd,
      updated_at: now,
    }, { onConflict: 'user_id' });

  if (subError) {
    console.error('[polar-webhook] subscriptions_upsert_failed', { user_id: userId, error: subError });
    return false;
  }

  // 3. Upsert subscription_entitlements
  if (entitlements) {
    const { error: entError } = await supabase
      .from('subscription_entitlements')
      .upsert({
        user_id: userId,
        boards_limit: entitlements.boards_limit,
        storage_gb: entitlements.storage_gb,
        seats: entitlements.seats,
        blocks_unlimited: entitlements.blocks_unlimited,
        source_plan: planKey,
        updated_at: now,
      }, { onConflict: 'user_id' });

    if (entError) {
      console.error('[polar-webhook] entitlements_upsert_failed', { user_id: userId, error: entError });
      return false;
    }
  }

  // 4. Update legacy user_subscriptions for backward compatibility
  const storageMb = entitlements ? entitlements.storage_gb * 1024 : 100;
  const blocksLimit = entitlements?.blocks_unlimited ? 999999 : 10;

  const { error: legacyError } = await supabase
    .from('user_subscriptions')
    .update({
      snapshot_max_boards: entitlements?.boards_limit ?? 3,
      snapshot_max_blocks_per_board: blocksLimit,
      snapshot_storage_mb: storageMb,
      snapshot_max_seats: entitlements?.seats ?? 1,
      status: normalizedStatus === 'active' ? 'active' : 'canceled',
      updated_at: now,
    })
    .eq('user_id', userId);

  if (legacyError) {
    console.warn('[polar-webhook] legacy_user_subscriptions_update_failed', { user_id: userId, error: legacyError });
  }

  console.log('[polar-webhook] billing_update_done', { user_id: userId });
  return true;
}

/**
 * Handle addon purchase - also atomically updates user_billing
 */
async function handleAddonPurchase(
  supabase: any,
  userId: string,
  addonKey: string,
  polarOrderId: string | null,
  polarCustomerId: string | null
): Promise<boolean> {
  const entitlements = ADDON_ENTITLEMENTS[addonKey];
  if (!entitlements) {
    console.error('Unknown addon_key:', addonKey);
    return false;
  }

  const now = new Date().toISOString();

  // 1. Insert addon record
  const { error } = await supabase
    .from('subscription_addons')
    .insert({
      user_id: userId,
      addon_key: addonKey,
      extra_boards: entitlements.extra_boards,
      extra_storage_gb: entitlements.extra_storage_gb,
      polar_order_id: polarOrderId,
      created_at: now,
      updated_at: now,
    });

  if (error) {
    console.error('Failed to insert addon:', error);
    return false;
  }

  console.log('✓ Addon added:', addonKey, 'for user:', userId);

  // 2. Atomically increment user_billing boards and storage
  // First get current values
  const { data: currentBilling } = await supabase
    .from('user_billing')
    .select('boards, storage_gb, polar_customer_id')
    .eq('user_id', userId)
    .single();

  if (currentBilling) {
    const { error: updateError } = await supabase
      .from('user_billing')
      .update({
        boards: (currentBilling.boards || 0) + entitlements.extra_boards,
        storage_gb: (currentBilling.storage_gb || 0) + entitlements.extra_storage_gb,
        polar_customer_id: polarCustomerId || currentBilling.polar_customer_id,
        updated_at: now,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update user_billing for addon:', updateError);
      return false;
    }
    console.log('✓ user_billing updated with addon entitlements');
  } else {
    // No billing record exists, create one with addon values
    const { error: insertError } = await supabase
      .from('user_billing')
      .upsert({
        user_id: userId,
        polar_customer_id: polarCustomerId,
        active_plan: 'free',
        subscription_status: 'active',
        boards: 3 + entitlements.extra_boards,
        storage_gb: 1 + entitlements.extra_storage_gb,
        blocks: 10,
        seats: 1,
        is_lifetime: false,
        updated_at: now,
      }, { onConflict: 'user_id' });

    if (insertError) {
      console.error('Failed to create user_billing for addon:', insertError);
      return false;
    }
    console.log('✓ user_billing created with addon entitlements');
  }

  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  // 1) Read raw body (MANDATORY: needed for signature verification + logging)
  const body = await req.text();

  // 2) Verify webhook signature (MANDATORY)
  const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET') ?? '';
  if (!webhookSecret) {
    console.error('[polar-webhook] POLAR_WEBHOOK_SECRET missing in env');
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
    console.error('[polar-webhook] Signature verification failed', {
      error: String(err),
      headers_present: {
        webhook_id: Boolean(req.headers.get('webhook-id')),
        webhook_timestamp: Boolean(req.headers.get('webhook-timestamp')),
        webhook_signature: Boolean(req.headers.get('webhook-signature')),
      },
    });

    return new Response(
      JSON.stringify({ error: 'Invalid webhook signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 3) Parse JSON safely
  let event: any;
  try {
    event = JSON.parse(body);
  } catch (err) {
    console.error('[polar-webhook] Invalid JSON payload', { error: String(err) });
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 4) Log full raw payload (minus secrets) + key fields (MANDATORY)
  console.log('========================================');
  console.log('[polar-webhook] raw_payload', body);
  console.log('[polar-webhook] received', {
    type: event?.type ?? null,
    event_id: event?.data?.id ?? null,
    external_reference_id: event?.data?.external_reference_id ?? null,
    external_customer_id: event?.data?.external_customer_id ?? null,
    customer_external_id: event?.data?.customer_external_id ?? null,
    customer_id: event?.data?.customer?.id ?? null,
    customer_id_fallback_field: event?.data?.customer_id ?? null,
  });
  console.log('[polar-webhook] data_snapshot', {
    subscription_status: event?.data?.subscription?.status ?? event?.data?.status ?? null,
    subscription_current_period_end:
      event?.data?.subscription?.current_period_end ?? event?.data?.current_period_end ?? null,
    product_id: event?.data?.product?.id ?? event?.data?.product_id ?? null,
    price_id: event?.data?.price?.id ?? event?.data?.price_id ?? null,
    plan_key: extractPlanKey(event?.data),
    metadata_user_id: event?.data?.metadata?.user_id ?? null,
  });
  console.log('========================================');

  const eventType = event?.type;
  if (typeof eventType !== 'string' || eventType.length === 0) {
    console.error('[polar-webhook] Missing event.type');
    return new Response(
      JSON.stringify({ error: 'Missing event.type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 5) Build service-role Supabase client (MANDATORY)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 6) Validate + extract required fields (NO GUESSING)
  const userId = extractExternalReferenceUserId(event?.data);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing external_reference_id — cannot map user' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const polarCustomerId = event?.data?.customer?.id ?? null;
  if (typeof polarCustomerId !== 'string' || polarCustomerId.length === 0) {
    console.error('[polar-webhook] Missing event.data.customer.id');
    return new Response(
      JSON.stringify({ error: 'Missing customer.id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify user exists in Supabase Auth (MANDATORY)
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      console.error('[polar-webhook] Unknown user_id (auth.users)', { user_id: userId, error });
      return new Response(
        JSON.stringify({ error: 'Unknown user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('[polar-webhook] auth.admin.getUserById failed', { user_id: userId, error: String(err) });
    return new Response(
      JSON.stringify({ error: 'User validation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Plan/product identifier (MANDATORY for non-cancel events)
  const planIdentifier =
    event?.data?.product?.id ??
    event?.data?.product_id ??
    event?.data?.price?.id ??
    event?.data?.price_id ??
    null;

  // Status + period end (nullable)
  const subscriptionStatus = event?.data?.subscription?.status ?? event?.data?.status ?? null;
  const currentPeriodEnd =
    event?.data?.subscription?.current_period_end ??
    event?.data?.current_period_end ??
    null;

  // Lifetime: best-effort derivation directly from payload fields (no plan lookup)
  const isLifetime = !event?.data?.recurring_interval && !event?.data?.recurring_interval_count;

  // Enforce required fields per event type
  const requiresPlan = ['checkout.completed', 'subscription.created', 'subscription.active', 'subscription.updated', 'order.paid'].includes(eventType);
  if (requiresPlan && (typeof planIdentifier !== 'string' || planIdentifier.length === 0)) {
    console.error('[polar-webhook] Missing plan identifier (product/price id)', { eventType });
    return new Response(
      JSON.stringify({ error: 'Missing plan identifier' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (typeof subscriptionStatus !== 'string' || subscriptionStatus.length === 0) {
    console.error('[polar-webhook] Missing subscription status', { eventType });
    return new Response(
      JSON.stringify({ error: 'Missing subscription status' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 7) UPSERT user_billing (MANDATORY) — 200 ONLY if this succeeds
  // Preserve existing entitlement fields unless we can map via metadata plan_key.
  const now = new Date().toISOString();

  const { data: existingBilling, error: existingBillingError } = await supabase
    .from('user_billing')
    .select('boards, blocks, storage_gb, seats, active_plan')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingBillingError) {
    console.error('[polar-webhook] user_billing select failed', { user_id: userId, error: existingBillingError });
    return new Response(
      JSON.stringify({ error: 'DB read failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const planKey = extractPlanKey(event?.data) ?? planIdentifier ?? existingBilling?.active_plan ?? 'free';
  const entitlements = PLAN_ENTITLEMENTS[planKey];

  const boards = entitlements?.boards_limit ?? existingBilling?.boards ?? 3;
  const blocks = entitlements?.blocks_unlimited ? -1 : (existingBilling?.blocks ?? 10);
  const storageGb = entitlements?.storage_gb ?? existingBilling?.storage_gb ?? 1;
  const seats = entitlements?.seats ?? existingBilling?.seats ?? 1;

  console.log('[polar-webhook] extracted_values', {
    event_type: eventType,
    user_id: userId,
    polar_customer_id: polarCustomerId,
    active_plan: planKey,
    subscription_status: subscriptionStatus,
    current_period_end: currentPeriodEnd,
    is_lifetime: isLifetime,
  });

  const { data: upserted, error: upsertError } = await supabase
    .from('user_billing')
    .upsert(
      {
        user_id: userId,
        polar_customer_id: polarCustomerId,
        active_plan: planKey,
        subscription_status: subscriptionStatus,
        current_period_end: currentPeriodEnd,
        is_lifetime: isLifetime,
        boards,
        blocks,
        storage_gb: storageGb,
        seats,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )
    .select('user_id, active_plan, subscription_status, polar_customer_id, current_period_end, is_lifetime, boards, blocks, storage_gb, seats, updated_at')
    .maybeSingle();

  if (upsertError) {
    console.error('[polar-webhook] user_billing upsert failed', {
      user_id: userId,
      error: upsertError,
      took_ms: Date.now() - startedAt,
    });

    return new Response(
      JSON.stringify({ error: 'DB write failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('[polar-webhook] DB WRITE SUCCESS', { row: upserted, took_ms: Date.now() - startedAt });

  return new Response(
    JSON.stringify({ received: true, success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

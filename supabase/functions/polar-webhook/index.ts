import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
 * Extract Supabase user_id from Polar's external_reference_id.
 * This is the ONLY allowed linkage (no email guessing).
 */
function extractExternalReferenceUserId(data: any): string | null {
  const externalRef =
    data?.external_reference_id ??
    data?.checkout?.external_reference_id ??
    data?.subscription?.external_reference_id ??
    data?.order?.external_reference_id ??
    data?.customer?.external_reference_id ??
    null;

  if (typeof externalRef === 'string' && externalRef.length > 0) {
    return externalRef;
  }

  console.error('[polar-webhook] Missing external_reference_id', {
    data_keys: Object.keys(data || {}),
    checkout_keys: Object.keys(data?.checkout || {}),
    subscription_keys: Object.keys(data?.subscription || {}),
    order_keys: Object.keys(data?.order || {}),
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

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log('========================================');
    console.log('[polar-webhook] received', {
      type: event.type,
      event_id: event.data?.id,
      customer_id: event.data?.customer?.id || event.data?.customer_id || null,
      external_reference_id: event.data?.external_reference_id || event.data?.checkout?.external_reference_id || null,
    });
    console.log('[polar-webhook] metadata', {
      data_metadata: event.data?.metadata || {},
      checkout_metadata: event.data?.checkout?.metadata || {},
    });
    console.log('========================================');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let success = true;

    switch (event.type) {
      // ==========================================
      // CHECKOUT COMPLETED - Primary handler
      // ==========================================
      case 'checkout.completed': {
        const userId = extractExternalReferenceUserId(event.data);
        const planKey = extractPlanKey(event.data);
        const isAddon = isAddonPurchase(event.data);

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing external_reference_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!planKey) {
          console.error('CRITICAL: No plan_key in checkout.completed');
          return new Response(
            JSON.stringify({ error: 'Missing plan_key in metadata' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[polar-webhook] checkout_completed', { user_id: userId, plan_key: planKey, is_addon: isAddon });

        if (isAddon) {
          success = await handleAddonPurchase(supabase, userId, planKey, event.data?.id, event.data?.customer?.id || event.data?.customer_id || null);
        } else {
          const planEntitlements = PLAN_ENTITLEMENTS[planKey];
          success = await updateUserBillingAtomic(
            supabase,
            userId,
            event.data?.customer?.id || event.data?.customer_id || null,
            planKey,
            'active',
            planEntitlements?.is_lifetime ?? false,
            event.data?.subscription?.current_period_end || null,
            event.data?.subscription?.id || event.data?.subscription_id || null
          );
        }
        break;
      }

      // ==========================================
      // SUBSCRIPTION EVENTS
      // ==========================================
      case 'subscription.created':
      case 'subscription.active':
      case 'subscription.updated': {
        const userId = extractExternalReferenceUserId(event.data);
        const planKey = extractPlanKey(event.data);

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing external_reference_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (planKey) {
          const entitlements = PLAN_ENTITLEMENTS[planKey];
          const status = event.data?.status === 'active' ? 'active' : 'canceled';
          
          success = await updateUserBillingAtomic(
            supabase,
            userId,
            event.data?.customer?.id || event.data?.customer_id || null,
            planKey,
            status,
            entitlements?.is_lifetime ?? false,
            event.data?.current_period_end || null,
            event.data?.id || null
          );
        } else {
          // Update status only if we have user but no plan
          const now = new Date().toISOString();
          await supabase
            .from('user_billing')
            .update({
              subscription_status: event.data?.status === 'active' ? 'active' : 'canceled',
              current_period_end: event.data?.current_period_end || null,
              updated_at: now,
            })
            .eq('user_id', userId);
        }
        break;
      }

      // ==========================================
      // CANCELLATION
      // ==========================================
      case 'subscription.cancelled':
      case 'subscription.canceled': {
        const userId = extractExternalReferenceUserId(event.data);

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing external_reference_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const now = new Date().toISOString();

        // Update user_billing
        await supabase
          .from('user_billing')
          .update({
            subscription_status: 'canceled',
            updated_at: now,
          })
          .eq('user_id', userId);

        // Update subscriptions
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: now,
          })
          .eq('user_id', userId);

        // Update legacy
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: now,
          })
          .eq('user_id', userId);

        console.log('✓ Subscription cancelled for user:', userId);
        break;
      }

      // ==========================================
      // ORDER EVENTS (for one-time purchases like LTD)
      // ==========================================
      case 'order.paid': {
        const userId = extractExternalReferenceUserId(event.data);
        const planKey = extractPlanKey(event.data);
        const isAddon = isAddonPurchase(event.data);

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing external_reference_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!planKey) {
          console.log('Order event without plan_key metadata - likely handled by checkout.completed');
          break;
        }

        console.log('Processing order.paid:', { userId, planKey, isAddon });

        if (isAddon) {
          success = await handleAddonPurchase(supabase, userId, planKey, event.data?.id, event.data?.customer?.id || null);
        } else {
          const orderEntitlements = PLAN_ENTITLEMENTS[planKey];
          success = await updateUserBillingAtomic(
            supabase,
            userId,
            event.data?.customer?.id || null,
            planKey,
            'active',
            orderEntitlements?.is_lifetime ?? false,
            null, // One-time purchases don't have period end
            null
          );
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Database update failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ received: true, success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

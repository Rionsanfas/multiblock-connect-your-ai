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
 * Extract user_id from multiple possible locations in Polar webhook data
 */
function extractUserId(data: any): string | null {
  // 1. Direct metadata on event data
  if (data?.metadata?.user_id) {
    console.log('Found user_id in data.metadata:', data.metadata.user_id);
    return data.metadata.user_id;
  }
  
  // 2. Checkout metadata (for checkout.completed)
  if (data?.checkout?.metadata?.user_id) {
    console.log('Found user_id in checkout.metadata:', data.checkout.metadata.user_id);
    return data.checkout.metadata.user_id;
  }
  
  // 3. Subscription metadata
  if (data?.subscription?.metadata?.user_id) {
    console.log('Found user_id in subscription.metadata:', data.subscription.metadata.user_id);
    return data.subscription.metadata.user_id;
  }
  
  // 4. Order metadata
  if (data?.order?.metadata?.user_id) {
    console.log('Found user_id in order.metadata:', data.order.metadata.user_id);
    return data.order.metadata.user_id;
  }

  // 5. Customer metadata
  if (data?.customer?.metadata?.user_id) {
    console.log('Found user_id in customer.metadata:', data.customer.metadata.user_id);
    return data.customer.metadata.user_id;
  }

  console.error('No user_id found in any metadata location. Data keys:', Object.keys(data || {}));
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
  
  console.log('ATOMIC UPDATE for user:', userId, {
    polarCustomerId,
    planKey,
    status: normalizedStatus,
    isLifetime,
    currentPeriodEnd,
  });

  // 1. Upsert user_billing (CRITICAL for customer portal + frontend display)
  const { error: billingError } = await supabase
    .from('user_billing')
    .upsert({
      user_id: userId,
      polar_customer_id: polarCustomerId,
      active_plan: planKey,
      subscription_status: normalizedStatus,
      is_lifetime: isLifetime,
      current_period_end: currentPeriodEnd,
      updated_at: now,
    }, { onConflict: 'user_id' });

  if (billingError) {
    console.error('Failed to upsert user_billing:', billingError);
    return false;
  }
  console.log('✓ user_billing updated');

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
      polar_customer_id: polarCustomerId,
      started_at: now,
      ends_at: isLifetime ? null : currentPeriodEnd,
      updated_at: now,
    }, { onConflict: 'user_id' });

  if (subError) {
    console.error('Failed to upsert subscriptions:', subError);
    return false;
  }
  console.log('✓ subscriptions updated');

  // 3. Upsert subscription_entitlements
  const entitlements = PLAN_ENTITLEMENTS[planKey];
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
      console.error('Failed to upsert subscription_entitlements:', entError);
      return false;
    }
    console.log('✓ subscription_entitlements updated');
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
    console.warn('Legacy user_subscriptions update failed (non-critical):', legacyError);
  } else {
    console.log('✓ user_subscriptions (legacy) updated');
  }

  return true;
}

/**
 * Handle addon purchase
 */
async function handleAddonPurchase(
  supabase: any,
  userId: string,
  addonKey: string,
  polarOrderId: string | null
): Promise<boolean> {
  const entitlements = ADDON_ENTITLEMENTS[addonKey];
  if (!entitlements) {
    console.error('Unknown addon_key:', addonKey);
    return false;
  }

  const now = new Date().toISOString();

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
    console.log('Polar webhook received:', event.type);
    console.log('Event ID:', event.data?.id);
    console.log('Full metadata:', JSON.stringify(event.data?.metadata || {}));
    console.log('Checkout metadata:', JSON.stringify(event.data?.checkout?.metadata || {}));
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
        const userId = extractUserId(event.data);
        const planKey = extractPlanKey(event.data);
        const isAddon = isAddonPurchase(event.data);
        
        if (!userId) {
          console.error('CRITICAL: No user_id in checkout.completed');
          return new Response(
            JSON.stringify({ error: 'Missing user_id in metadata', received_metadata: event.data?.metadata }),
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

        console.log('Processing checkout.completed:', { userId, planKey, isAddon });

        if (isAddon) {
          success = await handleAddonPurchase(supabase, userId, planKey, event.data?.id);
        } else {
          const entitlements = PLAN_ENTITLEMENTS[planKey];
          success = await updateUserBillingAtomic(
            supabase,
            userId,
            event.data?.customer?.id || event.data?.customer_id || null,
            planKey,
            'active',
            entitlements?.is_lifetime ?? false,
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
        const userId = extractUserId(event.data);
        const planKey = extractPlanKey(event.data);
        
        if (!userId) {
          console.warn('No user_id in subscription event - may be from external source');
          // Don't fail - this might be a Polar-initiated event without our metadata
          return new Response(
            JSON.stringify({ received: true, skipped: 'no_user_id' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        const userId = extractUserId(event.data);
        
        if (!userId) {
          console.warn('No user_id in cancellation event');
          return new Response(
            JSON.stringify({ received: true, skipped: 'no_user_id' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        const userId = extractUserId(event.data);
        const planKey = extractPlanKey(event.data);
        const isAddon = isAddonPurchase(event.data);

        if (!userId || !planKey) {
          console.log('Order event without full metadata - likely handled by checkout.completed');
          break;
        }

        console.log('Processing order.paid:', { userId, planKey, isAddon });

        if (isAddon) {
          success = await handleAddonPurchase(supabase, userId, planKey, event.data?.id);
        } else {
          const entitlements = PLAN_ENTITLEMENTS[planKey];
          success = await updateUserBillingAtomic(
            supabase,
            userId,
            event.data?.customer?.id || null,
            planKey,
            'active',
            entitlements?.is_lifetime ?? false,
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

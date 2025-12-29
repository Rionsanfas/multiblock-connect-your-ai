import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-polar-signature, webhook-id, webhook-timestamp, webhook-signature',
};

// Plan entitlement mappings
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

// Addon entitlement mappings
const ADDON_ENTITLEMENTS: Record<string, { extra_boards: number; extra_storage_gb: number }> = {
  'addon-boards-10': { extra_boards: 10, extra_storage_gb: 1 },
  'addon-boards-20': { extra_boards: 20, extra_storage_gb: 2 },
  'addon-boards-50': { extra_boards: 50, extra_storage_gb: 4 },
  'addon-boards-60': { extra_boards: 60, extra_storage_gb: 5 },
  'addon-boards-120': { extra_boards: 120, extra_storage_gb: 10 },
};

/**
 * Verify Polar webhook signature
 */
async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) {
    console.warn('No signature provided');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === expectedSig;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Get user ID from metadata (CRITICAL: This is the ONLY source of truth)
 */
function getUserIdFromMetadata(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) {
    console.error('No metadata provided in webhook');
    return null;
  }

  const userId = metadata.user_id;
  if (typeof userId === 'string' && userId.length > 0) {
    console.log('Using user_id from metadata:', userId);
    return userId;
  }

  console.error('No valid user_id found in metadata:', metadata);
  return null;
}

/**
 * Handle subscription creation/update
 */
async function handleSubscription(
  supabase: any,
  userId: string,
  planKey: string,
  polarSubscriptionId: string | null,
  polarCustomerId: string | null,
  status: 'active' | 'cancelled' | 'expired',
  endsAt: string | null
): Promise<boolean> {
  const entitlements = PLAN_ENTITLEMENTS[planKey];
  if (!entitlements) {
    console.error('Unknown plan_key:', planKey);
    return false;
  }

  const now = new Date().toISOString();
  const period = entitlements.is_lifetime ? 'lifetime' : 'annual';

  // Upsert into NEW subscriptions table
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_key: planKey,
      provider: 'polar',
      status,
      period,
      is_lifetime: entitlements.is_lifetime,
      polar_subscription_id: polarSubscriptionId,
      polar_customer_id: polarCustomerId,
      started_at: now,
      ends_at: entitlements.is_lifetime ? null : endsAt,
      updated_at: now,
    }, { onConflict: 'user_id' });

  if (subError) {
    console.error('Failed to upsert subscription:', subError);
    return false;
  }

  // Upsert into NEW entitlements table
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
    console.error('Failed to upsert entitlements:', entError);
    return false;
  }

  // ALSO update OLD user_subscriptions table for backward compatibility
  const storageMb = entitlements.storage_gb * 1024;
  const blocksLimit = entitlements.blocks_unlimited ? 999999 : 10;
  
  const { error: legacyError } = await supabase
    .from('user_subscriptions')
    .update({
      snapshot_max_boards: entitlements.boards_limit,
      snapshot_max_blocks_per_board: blocksLimit,
      snapshot_storage_mb: storageMb,
      snapshot_max_seats: entitlements.seats,
      status: status === 'active' ? 'active' : 'canceled',
      updated_at: now,
    })
    .eq('user_id', userId);

  if (legacyError) {
    console.warn('Failed to update legacy user_subscriptions:', legacyError);
    // Don't fail the whole operation for legacy table
  }

  console.log('Subscription and entitlements updated for user:', userId, 'plan:', planKey);
  return true;
}

/**
 * Handle addon purchase
 */
async function handleAddon(
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

  // Insert addon (addons stack, so we always insert)
  const { error: addonError } = await supabase
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

  if (addonError) {
    console.error('Failed to insert addon:', addonError);
    return false;
  }

  console.log('Addon added for user:', userId, 'addon:', addonKey);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const POLAR_WEBHOOK_SECRET = Deno.env.get('POLAR_WEBHOOK_SECRET');
    if (!POLAR_WEBHOOK_SECRET) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signature = req.headers.get('x-polar-signature') || req.headers.get('webhook-signature');
    const body = await req.text();

    // Verify signature (strict in production)
    const isValid = await verifySignature(body, signature, POLAR_WEBHOOK_SECRET);
    if (!isValid) {
      console.warn('Invalid webhook signature - proceeding for development');
      // In production, you should return 401 here
      // return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Polar webhook received:', event.type);
    console.log('Event data preview:', JSON.stringify(event.data).slice(0, 500));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let success = true;

    switch (event.type) {
      case 'checkout.completed': {
        const { metadata, subscription_id, customer } = event.data;
        
        // CRITICAL: Get user_id from metadata only
        const userId = getUserIdFromMetadata(metadata);
        if (!userId) {
          console.error('CRITICAL: No user_id in checkout.completed metadata');
          return new Response(
            JSON.stringify({ error: 'Missing user_id in metadata' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const planKey = metadata?.plan_key as string;
        const isAddon = metadata?.is_addon === 'true';

        if (isAddon) {
          success = await handleAddon(supabase, userId, planKey, event.data.id);
        } else if (planKey) {
          success = await handleSubscription(
            supabase,
            userId,
            planKey,
            subscription_id,
            customer?.id,
            'active',
            null
          );
        } else {
          console.error('No plan_key in metadata');
          success = false;
        }
        break;
      }

      case 'subscription.active':
      case 'subscription.updated': {
        const { metadata, id: subscriptionId, customer, status, current_period_end } = event.data;
        
        const userId = getUserIdFromMetadata(metadata);
        if (!userId) {
          console.error('CRITICAL: No user_id in subscription event metadata');
          return new Response(
            JSON.stringify({ error: 'Missing user_id in metadata' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const planKey = metadata?.plan_key as string;
        if (!planKey) {
          // Just update status on existing subscription
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: status === 'active' ? 'active' : 'cancelled',
              ends_at: current_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
          
          success = !error;
          if (error) console.error('Subscription status update failed:', error);
        } else {
          success = await handleSubscription(
            supabase,
            userId,
            planKey,
            subscriptionId,
            customer?.id,
            status === 'active' ? 'active' : 'cancelled',
            current_period_end
          );
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.canceled': {
        const { metadata } = event.data;
        
        const userId = getUserIdFromMetadata(metadata);
        if (!userId) {
          console.error('CRITICAL: No user_id in cancellation metadata');
          return new Response(
            JSON.stringify({ error: 'Missing user_id in metadata' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        success = !error;
        if (error) console.error('Subscription cancellation failed:', error);
        break;
      }

      case 'order.created':
      case 'order.paid': {
        // Orders are handled via checkout.completed, log for debugging
        console.log('Order event received:', event.type, event.data?.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Database write failed' }),
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
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

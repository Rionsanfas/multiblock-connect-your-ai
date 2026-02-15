import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Webhook endpoints are server-to-server - no CORS needed
// Return minimal headers to prevent information leakage
const responseHeaders = {
  'Content-Type': 'text/plain',
};

/**
 * CANONICAL PLAN MAPPING
 * Maps Polar checkout URLs/product names to our internal plan IDs
 * 
 * PRICING (Single source of truth):
 * 
 * Individual Yearly:
 * - Starter: $99.99/year - 50 boards, unlimited blocks, 2 GB, 1 seat
 * - Pro: $149.99/year - 100 boards, unlimited blocks, 4 GB, 1 seat
 * 
 * Team Yearly:
 * - Starter: $199.99/year - 50 boards, unlimited blocks, 5 GB, 10 seats
 * - Pro: $299.99/year - 100 boards, unlimited blocks, 6 GB, 20 seats
 * 
 * Individual Lifetime:
 * - LTD Starter: $499.99 - 50 boards, unlimited blocks, 6 GB, 1 seat
 * - LTD Pro: $699.99 - 150 boards, unlimited blocks, 7 GB, 1 seat
 * 
 * Team Lifetime:
 * - LTD Starter Team: $799.99 - 150 boards, unlimited blocks, 8 GB, 10 seats
 * - LTD Pro Team: $999.99 - 200 boards, unlimited blocks, 9 GB, 15 seats
 * 
 * Add-ons (stackable):
 * - +1 GB: $14.99 (+1 GB, +10 boards)
 * - +2 GB: $19.99 (+2 GB, +20 boards)
 * - +4 GB: $24.99 (+4 GB, +50 boards)
 * - +5 GB: $29.99 (+5 GB, +60 boards)
 * - +10 GB: $49.99 (+10 GB, +120 boards)
 */

interface PlanConfig {
  plan_id: string;
  plan_key: string;
  plan_category: 'individual' | 'team';
  billing_type: 'monthly' | 'annual' | 'lifetime';
  boards: number;
  blocks: number;
  storage_gb: number;
  seats: number;
  is_lifetime: boolean;
  is_addon: boolean;
  trial_days?: number;
}

// Map by checkout URL path (the unique identifier in Polar checkout links)
const CHECKOUT_TO_PLAN: Record<string, PlanConfig> = {
  // Individual Monthly (with 3-day trial)
  'polar_cl_IH82mfObkRtRmHKdbp2OSDLXQN0QC4CBVnKMo3gLSIL': {
    plan_id: '00000000-0000-0000-0000-000000000050',
    plan_key: 'pro-monthly',
    plan_category: 'individual',
    billing_type: 'monthly',
    boards: 100,
    blocks: -1,
    storage_gb: 4,
    seats: 1,
    is_lifetime: false,
    is_addon: false,
    trial_days: 3,
  },
  // Individual Annual
  'polar_cl_DwPQiQgpjYb3xgk4cMtPDK3oapSGLSs2iU8qt2w8Mif': {
    plan_id: '00000000-0000-0000-0000-000000000051',
    plan_key: 'pro-annual',
    plan_category: 'individual',
    billing_type: 'annual',
    boards: 100,
    blocks: -1,
    storage_gb: 4,
    seats: 1,
    is_lifetime: false,
    is_addon: false,
  },
  // Team Monthly (with 3-day trial)
  'polar_cl_VRn60gsBMzVPECfYeC2ga1BsCq20rcv7Fw02Y2bm3wa': {
    plan_id: '00000000-0000-0000-0000-000000000052',
    plan_key: 'team-monthly',
    plan_category: 'team',
    billing_type: 'monthly',
    boards: 200,
    blocks: -1,
    storage_gb: 6,
    seats: 20,
    is_lifetime: false,
    is_addon: false,
    trial_days: 3,
  },
  // Team Annual
  'polar_cl_O0KhX8QrZVtK95iQrHceWabozRA8jfZzTwOvB0UaTft': {
    plan_id: '00000000-0000-0000-0000-000000000053',
    plan_key: 'team-annual',
    plan_category: 'team',
    billing_type: 'annual',
    boards: 200,
    blocks: -1,
    storage_gb: 6,
    seats: 20,
    is_lifetime: false,
    is_addon: false,
  },
  // Legacy Individual Annual
  'polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v': {
    plan_id: '00000000-0000-0000-0000-000000000010',
    plan_key: 'starter-individual-annual',
    plan_category: 'individual',
    billing_type: 'annual',
    boards: 50,
    blocks: -1,
    storage_gb: 2,
    seats: 1,
    is_lifetime: false,
    is_addon: false,
  },
  'polar_cl_0ANxHBAcEKSneKreosoVddmOPsNRvBMDaHKgv1QrrU9': {
    plan_id: '00000000-0000-0000-0000-000000000011',
    plan_key: 'pro-individual-annual',
    plan_category: 'individual',
    billing_type: 'annual',
    boards: 100,
    blocks: -1,
    storage_gb: 4,
    seats: 1,
    is_lifetime: false,
    is_addon: false,
  },
  // Team Annual
  'polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy': {
    plan_id: '00000000-0000-0000-0000-000000000020',
    plan_key: 'starter-team-annual',
    plan_category: 'team',
    billing_type: 'annual',
    boards: 50,
    blocks: -1,
    storage_gb: 5,
    seats: 10,
    is_lifetime: false,
    is_addon: false,
  },
  'polar_cl_kEOB6DUJjs7JONbOH91zrlACAQDEub2L9px0f3s4BuS': {
    plan_id: '00000000-0000-0000-0000-000000000021',
    plan_key: 'pro-team-annual',
    plan_category: 'team',
    billing_type: 'annual',
    boards: 100,
    blocks: -1,
    storage_gb: 6,
    seats: 20,
    is_lifetime: false,
    is_addon: false,
  },
  // Lifetime Individual
  'polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw': {
    plan_id: '00000000-0000-0000-0000-000000000030',
    plan_key: 'ltd-starter-individual',
    plan_category: 'individual',
    billing_type: 'lifetime',
    boards: 50,
    blocks: -1,
    storage_gb: 6,
    seats: 1,
    is_lifetime: true,
    is_addon: false,
  },
  'polar_cl_j6g5GaxCZ3MqM7FVpqt6vbsqk8zUUuLyUOIgR03k0oU': {
    plan_id: '00000000-0000-0000-0000-000000000031',
    plan_key: 'ltd-pro-individual',
    plan_category: 'individual',
    billing_type: 'lifetime',
    boards: 150,
    blocks: -1,
    storage_gb: 7,
    seats: 1,
    is_lifetime: true,
    is_addon: false,
  },
  // Lifetime Team
  'polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc': {
    plan_id: '00000000-0000-0000-0000-000000000040',
    plan_key: 'ltd-starter-team',
    plan_category: 'team',
    billing_type: 'lifetime',
    boards: 150,
    blocks: -1,
    storage_gb: 8,
    seats: 10,
    is_lifetime: true,
    is_addon: false,
  },
  'polar_cl_pQBNRD7r0QBz4pp47hOhg21aTfj5MLn9ffRnL0dxbnR': {
    plan_id: '00000000-0000-0000-0000-000000000041',
    plan_key: 'ltd-pro-team',
    plan_category: 'team',
    billing_type: 'lifetime',
    boards: 200,
    blocks: -1,
    storage_gb: 9,
    seats: 15,
    is_lifetime: true,
    is_addon: false,
  },
};

// Add-on mapping (stackable)
interface AddonConfig {
  addon_id: string;
  extra_boards: number;
  extra_storage_gb: number;
}

const CHECKOUT_TO_ADDON: Record<string, AddonConfig> = {
  'polar_cl_OBo7BCQ6ZYvqCFhc59DMFZJqfSg2ORRsow1RI3e8hEM': { addon_id: '00000000-0000-0000-0000-000000000100', extra_boards: 10, extra_storage_gb: 1 },
  'polar_cl_3jJPkH6afjDo1zVJUsauoPKlIclTotWyV9ssE006a3k': { addon_id: '00000000-0000-0000-0000-000000000101', extra_boards: 20, extra_storage_gb: 2 },
  'polar_cl_1Oj5sYbfwJyVjmzPXnnjnlr9YS2TVCQd7OsyG1IzSMj': { addon_id: '00000000-0000-0000-0000-000000000102', extra_boards: 50, extra_storage_gb: 4 },
  'polar_cl_BL5ku7NkvCcIsfr2pjq1gHnmn5sN87tkja0IP0PaJDT': { addon_id: '00000000-0000-0000-0000-000000000103', extra_boards: 60, extra_storage_gb: 5 },
  'polar_cl_JCkbiUFVssy28q7auRRSmERW2XUwIhqt2JnrY2yCy9b': { addon_id: '00000000-0000-0000-0000-000000000104', extra_boards: 120, extra_storage_gb: 10 },
};

/**
 * Extract checkout key from various Polar data structures
 */
function extractCheckoutKey(data: any): string | null {
  console.log('[polar-webhook] extractCheckoutKey - Full data:', JSON.stringify(data, null, 2).substring(0, 2000));
  
  // Try checkout URL from various locations
  const checkoutUrl = data?.checkout_url || data?.metadata?.checkout_url || data?.product?.checkout_url;
  if (checkoutUrl) {
    const match = checkoutUrl.match(/polar_cl_[A-Za-z0-9]+/);
    if (match) {
      console.log('[polar-webhook] Found checkout key from URL:', match[0]);
      return match[0];
    }
  }
  
  // Try product ID matching (Polar product IDs)
  const productId = data?.product_id || data?.product?.id;
  console.log('[polar-webhook] Product ID:', productId);
  
  // Try product name matching - comprehensive matching
  const productName = (data?.product?.name || data?.product_name || '').toLowerCase();
  console.log('[polar-webhook] Product name:', productName);
  
  // Individual Annual plans
  if ((productName.includes('starter') || productName.includes('individual')) && 
      !productName.includes('team') && 
      !productName.includes('ltd') && 
      !productName.includes('lifetime') &&
      !productName.includes('pro')) {
    console.log('[polar-webhook] Matched: Starter Individual Annual');
    return 'polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v';
  }
  
  if (productName.includes('pro') && 
      !productName.includes('team') && 
      !productName.includes('ltd') && 
      !productName.includes('lifetime')) {
    console.log('[polar-webhook] Matched: Pro Individual Annual');
    return 'polar_cl_0ANxHBAcEKSneKreosoVddmOPsNRvBMDaHKgv1QrrU9';
  }
  
  // Team Annual plans
  if (productName.includes('starter') && productName.includes('team') && 
      !productName.includes('ltd') && !productName.includes('lifetime')) {
    console.log('[polar-webhook] Matched: Starter Team Annual');
    return 'polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy';
  }
  
  if (productName.includes('pro') && productName.includes('team') && 
      !productName.includes('ltd') && !productName.includes('lifetime')) {
    console.log('[polar-webhook] Matched: Pro Team Annual');
    return 'polar_cl_kEOB6DUJjs7JONbOH91zrlACAQDEub2L9px0f3s4BuS';
  }
  
  // Lifetime Individual plans
  if ((productName.includes('ltd') || productName.includes('lifetime')) && 
      productName.includes('starter') && !productName.includes('team')) {
    console.log('[polar-webhook] Matched: LTD Starter Individual');
    return 'polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw';
  }
  
  if ((productName.includes('ltd') || productName.includes('lifetime')) && 
      productName.includes('pro') && !productName.includes('team')) {
    console.log('[polar-webhook] Matched: LTD Pro Individual');
    return 'polar_cl_j6g5GaxCZ3MqM7FVpqt6vbsqk8zUUuLyUOIgR03k0oU';
  }
  
  // Lifetime Team plans
  if ((productName.includes('ltd') || productName.includes('lifetime')) && 
      productName.includes('starter') && productName.includes('team')) {
    console.log('[polar-webhook] Matched: LTD Starter Team');
    return 'polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc';
  }
  
  if ((productName.includes('ltd') || productName.includes('lifetime')) && 
      productName.includes('pro') && productName.includes('team')) {
    console.log('[polar-webhook] Matched: LTD Pro Team');
    return 'polar_cl_pQBNRD7r0QBz4pp47hOhg21aTfj5MLn9ffRnL0dxbnR';
  }
  
  console.warn('[polar-webhook] Could not match product to any plan');
  return null;
}

/**
 * Verify Polar webhook signature using Web Crypto API
 * Polar uses Standard Webhooks format: https://www.standardwebhooks.com/
 * 
 * SECURITY: This function implements fail-closed behavior:
 * - Missing secret → reject (forces configuration)
 * - Missing headers → reject (prevents unsigned requests)
 * - Invalid signature → reject (prevents forgery)
 * - Verification error → reject (prevents bypasses)
 */
async function verifySignature(payload: string, signature: string | null, webhookId: string | null, timestamp: string | null): Promise<boolean> {
  const secret = Deno.env.get('POLAR_WEBHOOK_SECRET');
  
  // SECURITY FIX #1: Fail-closed when secret is not configured
  if (!secret) {
    console.error('[polar-webhook] SECURITY: POLAR_WEBHOOK_SECRET not configured - rejecting request');
    return false;
  }
  
  // SECURITY FIX #2: Require all signature headers
  if (!signature || !webhookId || !timestamp) {
    console.error('[polar-webhook] SECURITY: Missing required signature headers - rejecting request', {
      hasSignature: !!signature,
      hasWebhookId: !!webhookId,
      hasTimestamp: !!timestamp
    });
    return false;
  }
  
  // Check timestamp freshness (reject webhooks older than 5 minutes)
  const webhookTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const tolerance = 300; // 5 minutes
  if (isNaN(webhookTime) || Math.abs(now - webhookTime) > tolerance) {
    console.error('[polar-webhook] SECURITY: Webhook timestamp too old or invalid - rejecting request', {
      webhookTime,
      now,
      difference: now - webhookTime
    });
    return false;
  }
  
  try {
    const signedContent = `${webhookId}.${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    
    // The secret may or may not have 'whsec_' prefix and may or may not be base64 encoded
    let secretKey = secret.replace('whsec_', '');
    let secretBytes: ArrayBuffer;
    
    // Try to decode as base64 first, if it fails use as raw string
    try {
      const decoded = atob(secretKey);
      const arr = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        arr[i] = decoded.charCodeAt(i);
      }
      secretBytes = arr.buffer;
    } catch {
      // Not base64, use raw secret as UTF-8 bytes
      secretBytes = encoder.encode(secretKey).buffer;
    }
    
    // Import key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the content
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const sigArray = new Uint8Array(signatureBuffer);
    let expectedSig = '';
    for (let i = 0; i < sigArray.length; i++) {
      expectedSig += String.fromCharCode(sigArray[i]);
    }
    expectedSig = btoa(expectedSig);
    
    // Signature format: v1,<signature> v1,<signature2> (space separated)
    const signatures = signature.split(' ').map(s => {
      const parts = s.split(',');
      return parts.length > 1 ? parts[1] : parts[0];
    }).filter(Boolean);
    
    const isValid = signatures.some(s => s === expectedSig);
    
    // SECURITY FIX #3: Reject invalid signatures
    if (!isValid) {
      console.error('[polar-webhook] SECURITY: Signature verification failed - rejecting request');
      return false;
    }
    
    console.log('[polar-webhook] Signature verified successfully');
    return true;
  } catch (e) {
    // SECURITY FIX #4: Fail-closed on verification errors
    console.error('[polar-webhook] SECURITY: Signature verification error - rejecting request:', e);
    return false;
  }
}

serve(async (req) => {
  // Webhook endpoints don't need CORS - reject preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 405 });
  }

  console.log("========================================");
  console.log("[polar-webhook] INCOMING REQUEST");
  console.log("========================================");

  let rawBody = "";
  let body: any = null;
  
  try {
    rawBody = await req.text();
    console.log("[polar-webhook] RAW BODY:", rawBody.substring(0, 500));
    
    if (rawBody) {
      body = JSON.parse(rawBody);
    }
  } catch (e: unknown) {
    console.error("[polar-webhook] BODY PARSE ERROR:", e instanceof Error ? e.message : String(e));
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  if (!body) {
    console.log("[polar-webhook] No body");
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  // Verify signature - REQUIRED for security
  const webhookId = req.headers.get('webhook-id');
  const webhookTimestamp = req.headers.get('webhook-timestamp');
  const webhookSignature = req.headers.get('webhook-signature');
  
  if (!await verifySignature(rawBody, webhookSignature, webhookId, webhookTimestamp)) {
    console.error("[polar-webhook] SECURITY: Signature verification failed - not processing");
    // Return 200 to prevent retries, but don't process the request
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  const eventType = body.type;
  const data = body.data;

  console.log("[polar-webhook] EVENT TYPE:", eventType);
  console.log("[polar-webhook] DATA KEYS:", Object.keys(data || {}));

  // Supported events per spec
  const supportedEvents = [
    'checkout.completed',
    'subscription.created',
    'subscription.updated', 
    'subscription.active',
    'subscription.canceled',
    'subscription.cancelled', // Handle both spellings
    'order.created',
    'order.paid',
  ];

  if (!supportedEvents.some(e => eventType?.includes(e.split('.')[0]))) {
    console.log("[polar-webhook] Skipping unsupported event:", eventType);
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  // Initialize Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Extract customer email
  const customerEmail = 
    data?.customer?.email || 
    data?.email || 
    data?.user?.email ||
    data?.metadata?.user_email ||
    data?.checkout?.customer?.email ||
    null;

  console.log("[polar-webhook] Customer email:", customerEmail);

  if (!customerEmail) {
    console.error("[polar-webhook] No customer email found");
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', customerEmail)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[polar-webhook] Could not find profile for:", customerEmail, profileError);
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  const userId = profile.id;
  console.log("[polar-webhook] Found user:", userId);

  // Extract checkout key
  const checkoutKey = extractCheckoutKey(data);
  console.log("[polar-webhook] Checkout key:", checkoutKey);

  // Check if this is an add-on purchase
  const addonConfig = checkoutKey ? CHECKOUT_TO_ADDON[checkoutKey] : null;
  if (addonConfig) {
    console.log("[polar-webhook] Processing ADD-ON:", addonConfig);
    
    // Get current billing
    const { data: currentBilling } = await supabase
      .from('user_billing')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Stack the add-on on top of existing entitlements
    const currentAddons = (currentBilling?.applied_addons || []) as any[];
    const newAddon = {
      addon_id: addonConfig.addon_id,
      extra_boards: addonConfig.extra_boards,
      extra_storage_gb: addonConfig.extra_storage_gb,
      purchased_at: new Date().toISOString(),
    };
    currentAddons.push(newAddon);

    // Calculate total addon bonuses
    const totalExtraBoards = currentAddons.reduce((sum, a) => sum + (a.extra_boards || 0), 0);
    const totalExtraStorage = currentAddons.reduce((sum, a) => sum + (a.extra_storage_gb || 0), 0);

    // Extract customer ID for add-on purchases too
    const addonCustomerId = 
      data?.customer_id || 
      data?.customer?.id || 
      data?.subscription?.customer_id ||
      currentBilling?.polar_customer_id ||
      null;

    const { error: addonError } = await supabase
      .from('user_billing')
      .upsert({
        user_id: userId,
        polar_customer_id: addonCustomerId || currentBilling?.polar_customer_id,
        boards: (currentBilling?.boards || 1) + addonConfig.extra_boards,
        storage_gb: (currentBilling?.storage_gb || 1) + addonConfig.extra_storage_gb,
        applied_addons: currentAddons,
        last_event_type: eventType,
        last_event_id: data?.id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (addonError) {
      console.error("[polar-webhook] Add-on upsert error:", addonError);
    } else {
      console.log("[polar-webhook] Add-on applied successfully");
    }

    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  // Get plan config
  const planConfig = checkoutKey ? CHECKOUT_TO_PLAN[checkoutKey] : null;
  
  if (!planConfig) {
    console.warn("[polar-webhook] Unknown checkout key:", checkoutKey);
    // Try to extract from product name as fallback
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  console.log("[polar-webhook] Plan config:", planConfig);

  // Handle cancellation events
  if (eventType?.includes('cancel') || eventType?.includes('revok')) {
    console.log("[polar-webhook] Processing cancellation/revocation");
    
    const { error: cancelError } = await supabase
      .from('user_billing')
      .update({
        subscription_status: 'canceled',
        last_event_type: eventType,
        last_event_id: data?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (cancelError) {
      console.error("[polar-webhook] Cancel update error:", cancelError);
    } else {
      console.log("[polar-webhook] Subscription cancelled for user:", userId);
    }

    // Check if current_period_end has passed - if so, downgrade immediately
    const { data: billingData } = await supabase
      .from('user_billing')
      .select('current_period_end, is_lifetime')
      .eq('user_id', userId)
      .maybeSingle();

    const shouldDowngradeNow = !billingData?.is_lifetime && (
      !billingData?.current_period_end || 
      new Date(billingData.current_period_end) <= new Date()
    );

    if (shouldDowngradeNow) {
      console.log("[polar-webhook] Period ended - running immediate downgrade");
      const { error: downgradeError } = await supabase.rpc('handle_subscription_downgrade', {
        p_user_id: userId,
      });
      if (downgradeError) {
        console.error("[polar-webhook] Downgrade error:", downgradeError);
      } else {
        console.log("[polar-webhook] User downgraded to free tier");
      }
    } else {
      console.log("[polar-webhook] User retains access until period end:", billingData?.current_period_end);
    }

    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  // Calculate access_expires_at
  let accessExpiresAt: string | null = null;
  if (!planConfig.is_lifetime) {
    // Annual plans expire in 1 year
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    accessExpiresAt = expiresAt.toISOString();
    
    // Or use Polar's period end if available
    if (data?.current_period_end) {
      accessExpiresAt = data.current_period_end;
    } else if (data?.subscription?.current_period_end) {
      accessExpiresAt = data.subscription.current_period_end;
    }
  }

  // Extract customer ID from various locations in Polar webhook payloads
  const extractedCustomerId = 
    data?.customer_id || 
    data?.customer?.id || 
    data?.subscription?.customer_id ||
    data?.subscription?.customer?.id ||
    data?.checkout?.customer_id ||
    data?.checkout?.customer?.id ||
    data?.order?.customer_id ||
    data?.order?.customer?.id ||
    null;
  
  // Extract subscription ID from various locations
  const extractedSubscriptionId = 
    data?.subscription_id || 
    data?.subscription?.id ||
    data?.id ||
    null;

  console.log("[polar-webhook] Extracted customer_id:", extractedCustomerId);
  console.log("[polar-webhook] Extracted subscription_id:", extractedSubscriptionId);

  // Upsert billing data
  const billingData = {
    user_id: userId,
    polar_customer_id: extractedCustomerId,
    polar_subscription_id: extractedSubscriptionId,
    product_id: data?.product_id || data?.product?.id || null,
    product_price_id: data?.product_price_id || null,
    active_plan: planConfig.plan_key,
    plan_category: planConfig.plan_category,
    billing_type: planConfig.billing_type,
    subscription_status: 'active',
    is_lifetime: planConfig.is_lifetime,
    boards: planConfig.boards,
    blocks: planConfig.blocks,
    storage_gb: planConfig.storage_gb,
    seats: planConfig.seats,
    access_expires_at: accessExpiresAt,
    current_period_end: accessExpiresAt,
    last_event_type: eventType,
    last_event_id: data?.id || null,
    updated_at: new Date().toISOString(),
  };

  console.log("[polar-webhook] Upserting billing:", JSON.stringify(billingData, null, 2));

  const { data: upsertResult, error: upsertError } = await supabase
    .from('user_billing')
    .upsert(billingData, { onConflict: 'user_id' })
    .select();

  if (upsertError) {
    console.error("[polar-webhook] Upsert error:", upsertError);
    return new Response("ok", { status: 200, headers: responseHeaders });
  }

  console.log("[polar-webhook] SUCCESS - Billing updated:", upsertResult);

  // Remove any locks from previous downgrades
  const { error: upgradeError } = await supabase.rpc('handle_subscription_upgrade', {
    p_user_id: userId,
  });
  if (upgradeError) {
    console.error("[polar-webhook] Upgrade unlock error:", upgradeError);
  } else {
    console.log("[polar-webhook] All locks removed for user:", userId);
  }

  console.log("========================================");

  return new Response("ok", { status: 200, headers: responseHeaders });
});

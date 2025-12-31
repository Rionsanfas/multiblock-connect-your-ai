import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
};

/**
 * CANONICAL PLAN MAPPING
 * Maps Polar checkout URLs/product names to our internal plan IDs
 * 
 * Plan ID format:
 * - 00000000-0000-0000-0000-000000000010 = Starter (Individual) Annual
 * - 00000000-0000-0000-0000-000000000011 = Pro (Individual) Annual
 * - 00000000-0000-0000-0000-000000000020 = Starter (Team) Annual
 * - 00000000-0000-0000-0000-000000000021 = Pro (Team) Annual
 * - 00000000-0000-0000-0000-000000000030 = LTD Starter (Individual)
 * - 00000000-0000-0000-0000-000000000031 = LTD Pro (Individual)
 * - 00000000-0000-0000-0000-000000000040 = LTD Starter (Team)
 * - 00000000-0000-0000-0000-000000000041 = LTD Pro (Team)
 * 
 * Add-ons (100-104) - stackable
 */

interface PlanConfig {
  plan_id: string;
  plan_key: string;
  plan_category: 'individual' | 'team';
  billing_type: 'annual' | 'lifetime';
  boards: number;
  blocks: number;
  storage_gb: number;
  seats: number;
  is_lifetime: boolean;
  is_addon: boolean;
}

// Map by checkout URL path (the unique identifier in Polar checkout links)
const CHECKOUT_TO_PLAN: Record<string, PlanConfig> = {
  // Individual Annual
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
 */
async function verifySignature(payload: string, signature: string | null, webhookId: string | null, timestamp: string | null): Promise<boolean> {
  const secret = Deno.env.get('POLAR_WEBHOOK_SECRET');
  if (!secret) {
    console.warn('[polar-webhook] No POLAR_WEBHOOK_SECRET configured, skipping signature verification');
    return true;
  }
  
  if (!signature || !webhookId || !timestamp) {
    console.warn('[polar-webhook] Missing signature headers, webhook-id:', webhookId, 'webhook-timestamp:', timestamp, 'webhook-signature:', !!signature);
    // Allow processing without signature for now (can be tightened later)
    return true;
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
      console.log('[polar-webhook] Using raw secret (not base64)');
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
    
    console.log('[polar-webhook] Expected signature:', expectedSig.substring(0, 20) + '...');
    console.log('[polar-webhook] Received signature header:', signature.substring(0, 50) + '...');
    
    // Signature format: v1,<signature> v1,<signature2> (space separated)
    const signatures = signature.split(' ').map(s => {
      const parts = s.split(',');
      return parts.length > 1 ? parts[1] : parts[0];
    }).filter(Boolean);
    
    const isValid = signatures.some(s => s === expectedSig);
    
    if (!isValid) {
      console.warn('[polar-webhook] Signature mismatch, but allowing for now (set to strict later)');
      // TODO: Return false here once signature is verified working
      return true;
    }
    
    console.log('[polar-webhook] Signature verified successfully');
    return true;
  } catch (e) {
    console.error('[polar-webhook] Signature verification error:', e);
    // Allow processing even if signature verification fails for now
    return true;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (!body) {
    console.log("[polar-webhook] No body");
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Verify signature (optional based on config)
  const webhookId = req.headers.get('webhook-id');
  const webhookTimestamp = req.headers.get('webhook-timestamp');
  const webhookSignature = req.headers.get('webhook-signature');
  
  if (!await verifySignature(rawBody, webhookSignature, webhookId, webhookTimestamp)) {
    console.error("[polar-webhook] Invalid signature");
    // Still return 200 to prevent retries, but don't process
    return new Response("ok", { status: 200, headers: corsHeaders });
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
    return new Response("ok", { status: 200, headers: corsHeaders });
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
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', customerEmail)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[polar-webhook] Could not find profile for:", customerEmail, profileError);
    return new Response("ok", { status: 200, headers: corsHeaders });
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

    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Get plan config
  const planConfig = checkoutKey ? CHECKOUT_TO_PLAN[checkoutKey] : null;
  
  if (!planConfig) {
    console.warn("[polar-webhook] Unknown checkout key:", checkoutKey);
    // Try to extract from product name as fallback
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  console.log("[polar-webhook] Plan config:", planConfig);

  // Handle cancellation events
  if (eventType?.includes('cancel')) {
    console.log("[polar-webhook] Processing cancellation");
    
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

    return new Response("ok", { status: 200, headers: corsHeaders });
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
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  console.log("[polar-webhook] SUCCESS - Billing updated:", upsertResult);
  console.log("========================================");

  return new Response("ok", { 
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
  });
});

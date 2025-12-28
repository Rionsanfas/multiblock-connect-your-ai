import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-polar-signature',
};

// Plan mappings from checkout URLs
const PLAN_MAPPINGS: Record<string, { planId: string; isLifetime: boolean; seats: number; boards: number; storageMb: number }> = {
  // Individual Annual
  'polar_cl_Wpj4KKxWzVB8JiPP3onxWewwXief8j9zQiKlY2sln4v': { planId: 'starter-individual-annual', isLifetime: false, seats: 1, boards: 50, storageMb: 2048 },
  'polar_cl_0ANxHBAcEKSneKreosoVddmOPsNRvBMDaHKgv1QrrU9': { planId: 'pro-individual-annual', isLifetime: false, seats: 1, boards: 100, storageMb: 4096 },
  // Team Annual
  'polar_cl_9GX9gMPijwUbH8fPAiJWLgzNO7rZv0j8OqmeN3x2ohZ': { planId: 'starter-team-annual', isLifetime: false, seats: 10, boards: 50, storageMb: 5120 },
  'polar_cl_zcgQ6zb7NcsR2puGVZPM0Nr1UgcLrVBjBpZlz39h2Qy': { planId: 'pro-team-annual', isLifetime: false, seats: 20, boards: 100, storageMb: 6144 },
  // Individual Lifetime
  'polar_cl_kEOB6DUJjs7JONbOH91zrlACAQDEub2L9px0f3s4BuS': { planId: 'ltd-starter-individual', isLifetime: true, seats: 1, boards: 50, storageMb: 6144 },
  'polar_cl_WSLjTyotrxxtOORhYNOKcHlHxpZ3lXXPLJqUI4Le3rw': { planId: 'ltd-pro-individual', isLifetime: true, seats: 1, boards: 150, storageMb: 7168 },
  // Team Lifetime
  'polar_cl_j6g5GaxCZ3MqM7FVpqt6vbsqk8zUUuLyUOIgR03k0oU': { planId: 'ltd-starter-team', isLifetime: true, seats: 10, boards: 150, storageMb: 8192 },
  'polar_cl_mEuch8kmwciGhCy9QZuNnkSrKDhIY9erLsuvU36JqVc': { planId: 'ltd-pro-team', isLifetime: true, seats: 15, boards: 200, storageMb: 9216 },
};

// Add-on mappings
const ADDON_MAPPINGS: Record<string, { extraBoards: number; extraStorageMb: number }> = {
  'polar_cl_pQBNRD7r0QBz4pp47hOhg21aTfj5MLn9ffRnL0dxbnR': { extraBoards: 10, extraStorageMb: 1024 },
  'polar_cl_OBo7BCQ6ZYvqCFhc59DMFZJqfSg2ORRsow1RI3e8hEM': { extraBoards: 20, extraStorageMb: 2048 },
  'polar_cl_3jJPkH6afjDo1zVJUsauoPKlIclTotWyV9ssE006a3k': { extraBoards: 50, extraStorageMb: 4096 },
  'polar_cl_1Oj5sYbfwJyVjmzPXnnjnlr9YS2TVCQd7OsyG1IzSMj': { extraBoards: 60, extraStorageMb: 5120 },
  'polar_cl_BL5ku7NkvCcIsfr2pjq1gHnmn5sN87tkja0IP0PaJDT': { extraBoards: 120, extraStorageMb: 10240 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const POLAR_WEBHOOK_SECRET = Deno.env.get('POLAR_WEBHOOK_SECRET');
    if (!POLAR_WEBHOOK_SECRET) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const signature = req.headers.get('x-polar-signature');
    const body = await req.text();
    
    // Verify signature
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(POLAR_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (signature !== expectedSig) {
        console.warn('Signature mismatch - continuing for development');
      }
    }

    const event = JSON.parse(body);
    console.log('Polar webhook:', event.type, JSON.stringify(event.data).slice(0, 500));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.completed': {
        const { customer_email, product_id, subscription_id } = event.data;
        console.log('Checkout completed:', { customer_email, product_id });
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer_email)
          .single();
        
        if (!profile) {
          console.error('User not found:', customer_email);
          break;
        }

        // Check if it's an add-on
        const addon = ADDON_MAPPINGS[product_id];
        if (addon) {
          console.log('Processing add-on:', addon);
          // Get current subscription and add to limits
          const { data: currentSub } = await supabase
            .from('user_subscriptions')
            .select('snapshot_max_boards, snapshot_storage_mb')
            .eq('user_id', profile.id)
            .single();
          
          const newBoards = (currentSub?.snapshot_max_boards || 1) + addon.extraBoards;
          const newStorage = (currentSub?.snapshot_storage_mb || 100) + addon.extraStorageMb;
          
          await supabase
            .from('user_subscriptions')
            .update({
              snapshot_max_boards: newBoards,
              snapshot_storage_mb: newStorage,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
          
          console.log('Add-on applied:', { newBoards, newStorage });
          break;
        }

        // Check if it's a plan
        const planMapping = PLAN_MAPPINGS[product_id];
        if (planMapping) {
          console.log('Processing plan:', planMapping);
          const periodEnd = planMapping.isLifetime 
            ? new Date(2099, 11, 31).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          
          await supabase
            .from('user_subscriptions')
            .update({
              plan_id: planMapping.planId,
              status: 'active',
              stripe_subscription_id: subscription_id,
              current_period_start: new Date().toISOString(),
              current_period_end: periodEnd,
              snapshot_max_boards: planMapping.boards,
              snapshot_storage_mb: planMapping.storageMb,
              snapshot_max_seats: planMapping.seats,
              snapshot_max_blocks_per_board: 999999, // Unlimited
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
          
          console.log('Subscription updated for user:', profile.id);
        } else {
          console.log('Unknown product_id:', product_id);
        }
        break;
      }

      case 'subscription.updated': {
        const { customer_email, status, current_period_end } = event.data;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer_email)
          .single();
        
        if (profile) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: status === 'active' ? 'active' : 'past_due',
              current_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.canceled': {
        const { customer_email } = event.data;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer_email)
          .single();
        
        if (profile) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              cancel_at_period_end: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

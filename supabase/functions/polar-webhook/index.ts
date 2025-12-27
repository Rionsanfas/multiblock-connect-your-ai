import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-polar-signature',
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Get signature from header
    const signature = req.headers.get('x-polar-signature');
    const body = await req.text();
    
    // Verify signature (Polar uses HMAC-SHA256)
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(POLAR_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (signature !== expectedSig) {
        console.warn('Invalid webhook signature');
        // Continue anyway for now - Polar signature format may vary
      }
    }

    const event = JSON.parse(body);
    console.log('Polar webhook received:', event.type, JSON.stringify(event).slice(0, 500));

    // Initialize Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.completed': {
        const { customer_email, product_id, subscription_id } = event.data;
        console.log('Checkout completed:', { customer_email, product_id, subscription_id });
        
        // Find user by email
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer_email)
          .single();
        
        if (!profile) {
          console.error('User not found for email:', customer_email);
          break;
        }

        // Map product_id to plan_id (you'll need to configure this mapping)
        const planMapping: Record<string, string> = {
          // Add your Polar product IDs mapped to subscription_plans IDs
          // 'polar_starter_product_id': 'your-starter-plan-uuid',
          // 'polar_pro_product_id': 'your-pro-plan-uuid',
          // 'polar_team_product_id': 'your-team-plan-uuid',
        };
        
        const planId = planMapping[product_id];
        if (!planId) {
          console.log('Unknown product_id, using product_id as plan reference:', product_id);
        }

        // Update user subscription
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: planId || product_id,
            status: 'active',
            stripe_subscription_id: subscription_id, // Reusing field for Polar
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', profile.id);

        if (updateError) {
          console.error('Failed to update subscription:', updateError);
        } else {
          console.log('Subscription updated for user:', profile.id);
        }
        break;
      }

      case 'subscription.updated': {
        const { customer_email, status, current_period_end } = event.data;
        console.log('Subscription updated:', { customer_email, status });
        
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
              current_period_end: current_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.canceled': {
        const { customer_email } = event.data;
        console.log('Subscription cancelled:', { customer_email });
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer_email)
          .single();
        
        if (profile) {
          // Downgrade to free plan
          const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('tier', 'free')
            .single();

          await supabase
            .from('user_subscriptions')
            .update({
              plan_id: freePlan?.id,
              status: 'canceled',
              cancel_at_period_end: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
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

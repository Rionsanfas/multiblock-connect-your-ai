// Vercel Serverless Function: Polar Webhook Handler
// Deploy to: /api/webhooks/polar

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// TODO: Set these in Vercel Environment Variables
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function verifyPolarSignature(payload: string, signature: string): boolean {
  if (!POLAR_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', POLAR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${expected}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['polar-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  if (!verifyPolarSignature(rawBody, signature)) {
    console.error('Invalid Polar webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const event = req.body;
    console.log('Polar webhook event:', event.type);

    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated': {
        const sub = event.data;
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: sub.metadata?.user_id,
            provider: 'polar',
            provider_subscription_id: sub.id,
            provider_customer_id: sub.customer_id,
            plan: sub.product?.name?.toLowerCase() || 'pro',
            status: sub.status,
            current_period_end: sub.current_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'provider_subscription_id' });
        break;
      }

      case 'subscription.canceled': {
        const sub = event.data;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('provider_subscription_id', sub.id);
        break;
      }

      default:
        console.log('Unhandled Polar event:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Polar webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

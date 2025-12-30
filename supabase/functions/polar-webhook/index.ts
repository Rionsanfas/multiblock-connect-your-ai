import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("========================================");
  console.log("[polar-webhook] INCOMING REQUEST");
  console.log("========================================");

  // Log all headers
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });
  console.log("[polar-webhook] HEADERS:", JSON.stringify(headersObj, null, 2));

  // Get raw body
  let rawBody = "";
  let body: any = null;
  
  try {
    rawBody = await req.text();
    console.log("[polar-webhook] RAW BODY:", rawBody);
    
    if (rawBody) {
      body = JSON.parse(rawBody);
      console.log("[polar-webhook] PARSED BODY:", JSON.stringify(body, null, 2));
      
      // Log specific fields if they exist
      if (body.type) console.log("[polar-webhook] EVENT TYPE:", body.type);
      if (body.data) console.log("[polar-webhook] DATA KEYS:", Object.keys(body.data));
      if (body.data?.metadata) console.log("[polar-webhook] METADATA:", JSON.stringify(body.data.metadata, null, 2));
      if (body.data?.customer_external_id) console.log("[polar-webhook] customer_external_id:", body.data.customer_external_id);
      if (body.data?.external_customer_id) console.log("[polar-webhook] external_customer_id:", body.data.external_customer_id);
      if (body.data?.customer?.external_id) console.log("[polar-webhook] customer.external_id:", body.data.customer?.external_id);
    }
  } catch (e: unknown) {
    console.log("[polar-webhook] BODY PARSE ERROR:", e instanceof Error ? e.message : String(e));
    console.log("[polar-webhook] RAW BODY WAS:", rawBody);
  }

  console.log("========================================");
  console.log("[polar-webhook] RETURNING 200 OK");
  console.log("========================================");

  // ALWAYS return 200
  return new Response("ok", { 
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
  });
});

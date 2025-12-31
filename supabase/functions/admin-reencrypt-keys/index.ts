import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * MIGRATION COMPLETE - THIS FUNCTION IS DISABLED
 * 
 * All API keys have been encrypted using AES-256-GCM.
 * This function is no longer needed and returns 410 Gone.
 * 
 * Security architecture:
 * - API keys are encrypted server-side in encrypt-api-key function
 * - Decryption only happens in chat-proxy when making LLM calls
 * - Frontend NEVER receives raw API keys
 * - RLS + column grants block access to api_key_encrypted column
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[admin-reencrypt-keys] Migration complete. This endpoint is disabled.");
  
  return new Response(JSON.stringify({ 
    error: "Migration complete. This endpoint is permanently disabled.",
    message: "All API keys have been encrypted. No further migration is needed."
  }), {
    status: 410, // Gone
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
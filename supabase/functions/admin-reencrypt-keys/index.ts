import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use service role key as encryption key
const ENCRYPTION_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.substring(0, 32);

// Convert a string key to a CryptoKey for AES-256-GCM
async function getAESKey(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(keyString);
  
  if (keyBytes.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(keyBytes);
    keyBytes = padded;
  } else if (keyBytes.length > 32) {
    keyBytes = keyBytes.slice(0, 32);
  }
  
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// AES-256-GCM encryption with random IV
async function encrypt(text: string, keyString: string): Promise<string> {
  const key = await getAESKey(keyString);
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    textBytes
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Check if a value looks like a plaintext API key
function isPlaintextKey(value: string): boolean {
  const plaintextPatterns = [
    /^sk-/,           // OpenAI
    /^sk-ant-/,       // Anthropic
    /^xai-/,          // xAI
    /^AIza/,          // Google
  ];
  return plaintextPatterns.some(pattern => pattern.test(value));
}

// Generate a hint from the key
function getKeyHint(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Require admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roles || (roles.role !== "admin" && roles.role !== "super_admin")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[admin-reencrypt] Starting re-encryption by admin user ${user.id}`);

    // Get all API keys using service role (bypasses RLS)
    const { data: keys, error: fetchError } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, provider, api_key_encrypted, key_hint");

    if (fetchError) {
      console.error("Error fetching keys:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch keys" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let reencryptedCount = 0;
    const results: { id: string; provider: string; status: string }[] = [];

    for (const key of keys || []) {
      if (isPlaintextKey(key.api_key_encrypted)) {
        console.log(`[admin-reencrypt] Found plaintext key for provider: ${key.provider}`);
        
        const encryptedKey = await encrypt(key.api_key_encrypted, ENCRYPTION_KEY);
        const keyHint = getKeyHint(key.api_key_encrypted);
        
        const { error: updateError } = await supabaseAdmin
          .from("api_keys")
          .update({
            api_key_encrypted: encryptedKey,
            key_hint: keyHint,
          })
          .eq("id", key.id);

        if (updateError) {
          console.error(`Error updating key ${key.id}:`, updateError);
          results.push({ id: key.id, provider: key.provider, status: "error" });
        } else {
          reencryptedCount++;
          results.push({ id: key.id, provider: key.provider, status: "encrypted" });
          console.log(`[admin-reencrypt] Successfully encrypted key for ${key.provider}`);
        }
      } else {
        results.push({ id: key.id, provider: key.provider, status: "already_encrypted" });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total: keys?.length || 0,
      reencrypted: reencryptedCount,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("admin-reencrypt-keys error:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

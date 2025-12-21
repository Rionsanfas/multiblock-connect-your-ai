import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get encryption key from environment - this should be set as a secret
const ENCRYPTION_KEY = Deno.env.get("API_KEY_ENCRYPTION_SECRET") || "default-dev-key-32-chars-long!!";

// Simple XOR-based encryption (for production, use proper AES-256)
function encrypt(text: string, key: string): string {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const encrypted = new Uint8Array(textBytes.length);
  
  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode(...encrypted));
}

// Check if a string is valid base64
function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Base64 should only contain these characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) return false;
  // Length should be multiple of 4 (with padding)
  if (str.length % 4 !== 0) return false;
  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

function decrypt(encryptedBase64: string, key: string): string {
  // If not valid base64, it's likely a legacy plaintext key - return as-is
  if (!isValidBase64(encryptedBase64)) {
    console.log("[decrypt] Detected legacy plaintext key, returning as-is");
    return encryptedBase64;
  }
  
  const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(key);
  const decrypted = new Uint8Array(encrypted.length);
  
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

// Generate a hint from the key (first 4 + last 4 chars)
function getKeyHint(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, provider, api_key, key_id } = await req.json();

    if (action === "encrypt") {
      // Encrypt and store a new API key
      if (!provider || !api_key) {
        return new Response(JSON.stringify({ error: "provider and api_key required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const encryptedKey = encrypt(api_key, ENCRYPTION_KEY);
      const keyHint = getKeyHint(api_key);

      // Upsert the encrypted key
      const { data, error } = await supabase
        .from("api_keys")
        .upsert({
          user_id: user.id,
          provider,
          api_key_encrypted: encryptedKey,
          key_hint: keyHint,
          is_valid: true,
          last_validated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,provider",
        })
        .select("id, provider, key_hint, is_valid, created_at")
        .single();

      if (error) {
        console.error("Error storing API key:", error);
        return new Response(JSON.stringify({ error: "Failed to store API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[encrypt-api-key] Stored encrypted key for provider: ${provider}, user: ${user.id}`);

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "decrypt") {
      // Decrypt a key for use (internal only - returns decrypted key)
      if (!provider) {
        return new Response(JSON.stringify({ error: "provider required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("api_key_encrypted")
        .eq("user_id", user.id)
        .eq("provider", provider)
        .eq("is_valid", true)
        .maybeSingle();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "API key not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const decryptedKey = decrypt(data.api_key_encrypted, ENCRYPTION_KEY);

      return new Response(JSON.stringify({ api_key: decryptedKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "delete") {
      // Delete an API key
      if (!key_id) {
        return new Response(JSON.stringify({ error: "key_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", key_id)
        .eq("user_id", user.id);

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to delete API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("encrypt-api-key error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

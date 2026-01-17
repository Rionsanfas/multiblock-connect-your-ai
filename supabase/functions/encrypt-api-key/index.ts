import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use service role key as encryption key - already available in edge functions, no extra secret needed
const ENCRYPTION_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.substring(0, 32);

// Convert a string key to a CryptoKey for AES-256-GCM
async function getAESKey(keyString: string): Promise<CryptoKey> {
  // Ensure the key is exactly 32 bytes for AES-256
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(keyString);
  
  // Pad or truncate to 32 bytes
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
  
  // Generate a random 12-byte IV (recommended for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    textBytes
  );
  
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Check if a string is valid base64
function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) return false;
  if (str.length % 4 !== 0) return false;
  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

// Legacy XOR decryption for backward compatibility with existing keys
function decryptLegacyXOR(encryptedBase64: string, keyString: string): string {
  const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(keyString);
  const decrypted = new Uint8Array(encrypted.length);
  
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

// AES-256-GCM decryption with automatic legacy fallback
async function decrypt(encryptedBase64: string, keyString: string): Promise<string> {
  // If not valid base64, it's likely a legacy plaintext key - return as-is
  if (!isValidBase64(encryptedBase64)) {
    console.log("[decrypt] Detected legacy plaintext key, returning as-is");
    return encryptedBase64;
  }
  
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Check if it's long enough to be AES-GCM encrypted (at least 12 bytes IV + 16 bytes auth tag)
    if (combined.length < 28) {
      console.log("[decrypt] Data too short for AES-GCM, trying legacy XOR");
      return decryptLegacyXOR(encryptedBase64, keyString);
    }
    
    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const key = await getAESKey(keyString);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (aesError) {
    // If AES-GCM fails, try legacy XOR decryption for backward compatibility
    console.log("[decrypt] AES-GCM decryption failed, trying legacy XOR:", aesError);
    try {
      return decryptLegacyXOR(encryptedBase64, keyString);
    } catch (xorError) {
      console.error("[decrypt] Both AES-GCM and legacy XOR decryption failed");
      throw new Error("Failed to decrypt API key");
    }
  }
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

    const { action, provider, api_key, key_id, team_id } = await req.json();

    if (action === "encrypt") {
      // Encrypt and store a new API key
      if (!provider || !api_key) {
        return new Response(JSON.stringify({ error: "provider and api_key required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const encryptedKey = await encrypt(api_key, ENCRYPTION_KEY);
      const keyHint = getKeyHint(api_key);

      // Prepare the upsert data
      const keyData: Record<string, unknown> = {
        user_id: user.id,
        provider,
        api_key_encrypted: encryptedKey,
        key_hint: keyHint,
        is_valid: true,
        last_validated_at: new Date().toISOString(),
      };

      // Set team_id appropriately
      if (team_id) {
        keyData.team_id = team_id;
      } else {
        keyData.team_id = null;
      }

      // ALWAYS INSERT a new key (multiple keys per provider now allowed)
      // The DB trigger will enforce limits (free=3, paid=unlimited)
      const query = supabase
        .from("api_keys")
        .insert(keyData)
        .select("id, provider, key_hint, is_valid, created_at, team_id")
        .single();

      const { data, error } = await query;

      if (error) {
        console.error("Error storing API key:", error);
        
        // Check for limit exceeded error from database trigger (free plan = 3 keys max)
        if (error.message?.includes('LIMIT_EXCEEDED:API_KEY')) {
          return new Response(JSON.stringify({ 
            success: false,
            error: "Free plan allows up to 3 API keys. Upgrade to a paid plan for unlimited keys." 
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ success: false, error: "Failed to store API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[encrypt-api-key] Stored AES-256-GCM encrypted key for provider: ${provider}, user: ${user.id}${team_id ? `, team: ${team_id}` : ''}`);

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "decrypt") {
      // SECURITY: Decrypt action is no longer available from frontend
      // All AI calls must go through the chat-proxy edge function
      console.warn("[encrypt-api-key] Decrypt action called from frontend - this is deprecated");
      return new Response(JSON.stringify({ 
        error: "Direct decryption is not allowed. Use the chat-proxy endpoint." 
      }), {
        status: 403,
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

      // First check if the key exists and user has permission
      const { data: keyInfo, error: fetchError } = await supabase
        .from("api_keys")
        .select("id, user_id, team_id")
        .eq("id", key_id)
        .single();

      if (fetchError || !keyInfo) {
        return new Response(JSON.stringify({ error: "API key not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // RLS will handle the actual permission check, but we log what's happening
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", key_id);

      if (error) {
        console.error("Error deleting API key:", error);
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
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

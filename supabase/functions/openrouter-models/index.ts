import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENCRYPTION_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.substring(0, 32);

// AES-256-GCM decryption (same as chat-proxy)
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
  return await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
}

function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) return false;
  if (str.length % 4 !== 0) return false;
  try { atob(str); return true; } catch { return false; }
}

function decryptLegacyXOR(encryptedBase64: string, keyString: string): string {
  const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(keyString);
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(decrypted);
}

async function decrypt(encryptedBase64: string, keyString: string): Promise<string> {
  if (!isValidBase64(encryptedBase64)) return encryptedBase64;
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    if (combined.length < 28) return decryptLegacyXOR(encryptedBase64, keyString);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await getAESKey(keyString);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    try { return decryptLegacyXOR(encryptedBase64, keyString); }
    catch { throw new Error("Failed to decrypt API key"); }
  }
}

// Simple in-memory cache for model list (lasts the life of the edge function instance)
let cachedModels: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's OpenRouter API key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: keyRow, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, api_key_encrypted, is_valid, key_hint")
      .eq("user_id", user.id)
      .eq("provider", "openrouter")
      .is("team_id", null)
      .eq("is_valid", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (keyError || !keyRow?.api_key_encrypted) {
      return new Response(JSON.stringify({ 
        error: "No OpenRouter API key found. Please add your OpenRouter key in Settings > API Keys.",
        models: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = await decrypt(keyRow.api_key_encrypted, ENCRYPTION_KEY);

    // Check cache
    const now = Date.now();
    if (cachedModels && (now - cacheTimestamp) < CACHE_TTL_MS) {
      console.log("[openrouter-models] Returning cached models:", cachedModels.length);
      return new Response(JSON.stringify({ models: cachedModels }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch models from OpenRouter
    console.log("[openrouter-models] Fetching models from OpenRouter API...");
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://multiblock.app",
        "X-Title": "Multiblock",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[openrouter-models] OpenRouter API error:", response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `Failed to fetch models from OpenRouter (${response.status})`,
        models: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawModels = data.data || [];

    // Transform to our format
    const models = rawModels.map((m: any) => ({
      id: m.id, // e.g. "openai/gpt-4o"
      name: m.name || m.id,
      description: m.description || "",
      context_length: m.context_length || 0,
      pricing: {
        prompt: m.pricing?.prompt || "0",
        completion: m.pricing?.completion || "0",
        image: m.pricing?.image || "0",
      },
      top_provider: m.top_provider || null,
      architecture: m.architecture || null,
    }));

    // Update cache
    cachedModels = models;
    cacheTimestamp = now;

    console.log("[openrouter-models] Fetched", models.length, "models from OpenRouter");

    return new Response(JSON.stringify({ models }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[openrouter-models] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      models: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

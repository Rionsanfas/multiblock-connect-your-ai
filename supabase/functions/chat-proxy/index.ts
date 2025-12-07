import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-GCM decryption
async function decrypt(encryptedBase64: string, keyHex: string): Promise<string> {
  const keyBytes = hexToBytes(keyHex);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

const PROVIDER_ENDPOINTS: Record<string, { url: string; authHeader: (key: string) => Record<string, string> }> = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    authHeader: (key) => ({ "x-api-key": key, "anthropic-version": "2023-06-01" }),
  },
  google: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    authHeader: (key) => ({ "x-goog-api-key": key }),
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY");
    if (!ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { provider, model, messages, systemPrompt } = await req.json();

    if (!provider || !messages) {
      throw new Error("Missing provider or messages");
    }

    // Get user's encrypted API key
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("is_active", true)
      .maybeSingle();

    if (keyError || !keyData) {
      throw new Error(`No active ${provider} API key found. Please add your API key.`);
    }

    // Decrypt the API key
    const apiKey = await decrypt(keyData.encrypted_key, ENCRYPTION_KEY);

    // Route to appropriate provider
    const providerConfig = PROVIDER_ENDPOINTS[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    let response;

    if (provider === "openai") {
      response = await fetch(providerConfig.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...providerConfig.authHeader(apiKey),
        },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages: systemPrompt 
            ? [{ role: "system", content: systemPrompt }, ...messages]
            : messages,
        }),
      });
    } else if (provider === "anthropic") {
      response = await fetch(providerConfig.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...providerConfig.authHeader(apiKey),
        },
        body: JSON.stringify({
          model: model || "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          system: systemPrompt,
          messages,
        }),
      });
    } else {
      throw new Error(`Provider ${provider} not fully implemented`);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("Provider error:", data);
      throw new Error(data.error?.message || "Provider request failed");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat proxy error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

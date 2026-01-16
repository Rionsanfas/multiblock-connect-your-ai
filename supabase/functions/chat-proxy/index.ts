import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use service role key as encryption key - already available in edge functions
const ENCRYPTION_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.substring(0, 32);

// Provider endpoints
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  google: "https://generativelanguage.googleapis.com/v1beta/models",
  xai: "https://api.x.ai/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  mistral: "https://api.mistral.ai/v1/chat/completions",
  cohere: "https://api.cohere.com/v2/chat",
  together: "https://api.together.xyz/v1/chat/completions",
  perplexity: "https://api.perplexity.ai/chat/completions",
};

// AES-256-GCM decryption
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
  if (!isValidBase64(encryptedBase64)) {
    return encryptedBase64;
  }
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    if (combined.length < 28) {
      return decryptLegacyXOR(encryptedBase64, keyString);
    }
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await getAESKey(keyString);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    try {
      return decryptLegacyXOR(encryptedBase64, keyString);
    } catch {
      throw new Error("Failed to decrypt API key");
    }
  }
}

async function getDecryptedApiKey(supabase: any, userId: string, provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("api_key_encrypted")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("is_valid", true)
    .maybeSingle();

  if (error || !data?.api_key_encrypted) {
    console.log(`[chat-proxy] No API key found for provider: ${provider}`);
    return null;
  }

  return await decrypt(data.api_key_encrypted, ENCRYPTION_KEY);
}

// Format messages for different providers
function formatMessagesForProvider(provider: string, messages: any[]): any {
  if (provider === "anthropic") {
    const systemMessage = messages.find(m => m.role === "system");
    const nonSystemMessages = messages.filter(m => m.role !== "system");
    return {
      system: systemMessage?.content || "",
      messages: nonSystemMessages,
    };
  }
  
  if (provider === "cohere") {
    const systemMessage = messages.find(m => m.role === "system");
    const nonSystemMessages = messages.filter(m => m.role !== "system");
    return {
      preamble: systemMessage?.content || "",
      messages: nonSystemMessages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : m.content[0]?.text || "",
      })),
    };
  }
  
  return { messages };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role for reading encrypted keys
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate user with their JWT
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const body = await req.json();
    const { provider, model_id, messages, config, stream = true, action, prompt } = body;

    // Handle image generation
    if (action === "image_generation") {
      if (!provider || !prompt) {
        return new Response(JSON.stringify({ error: "provider and prompt are required for image generation" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider);
      if (!apiKey) {
        return new Response(JSON.stringify({ error: `No valid API key for ${provider}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[chat-proxy] Image generation for user ${user.id} via ${provider}`);

      let imageResponse;
      
      if (provider === "openai") {
        imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model_id.includes("dall-e") ? "dall-e-3" : "gpt-image-1",
            prompt,
            n: 1,
            size: "1024x1024",
          }),
        });
      } else if (provider === "together") {
        imageResponse = await fetch("https://api.together.xyz/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model_id,
            prompt,
            n: 1,
            size: "1024x1024",
          }),
        });
      } else {
        return new Response(JSON.stringify({ error: `Image generation not supported for ${provider}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: errorData.error?.message || "Image generation failed" }), {
          status: imageResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.data?.[0]?.url;

      return new Response(JSON.stringify({ image_url: imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle video generation
    if (action === "video_generation") {
      if (!provider || !prompt) {
        return new Response(JSON.stringify({ error: "provider and prompt are required for video generation" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Video generation is complex and provider-specific
      // For now, return a placeholder response
      return new Response(JSON.stringify({ 
        error: "Video generation is currently being set up. Please check back later.",
        video_url: null 
      }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Regular chat completion
    if (!provider || !model_id || !messages) {
      return new Response(JSON.stringify({ error: "provider, model_id, and messages are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get decrypted API key (server-side only - never exposed to frontend)
    const apiKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider);
    if (!apiKey) {
      return new Response(JSON.stringify({ error: `No valid API key for ${provider}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[chat-proxy] Proxying request for user ${user.id} to ${provider}/${model_id}`);

    // Build request based on provider
    let endpoint = PROVIDER_ENDPOINTS[provider];
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let requestBody: any;

    if (provider === "anthropic") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      const formatted = formatMessagesForProvider(provider, messages);
      requestBody = {
        model: model_id,
        max_tokens: config?.maxTokens || 4096,
        stream,
        system: formatted.system,
        messages: formatted.messages,
      };
    } else if (provider === "google") {
      endpoint = `${endpoint}/${model_id}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const formatted = formatMessagesForProvider(provider, messages);
      requestBody = {
        contents: formatted.messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: typeof m.content === "string" ? m.content : m.content[0]?.text || "" }],
        })),
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
          maxOutputTokens: config?.maxTokens || 4096,
        },
      };
    } else if (provider === "cohere") {
      headers["Authorization"] = `Bearer ${apiKey}`;
      const formatted = formatMessagesForProvider(provider, messages);
      requestBody = {
        model: model_id,
        preamble: formatted.preamble,
        messages: formatted.messages,
        stream,
      };
    } else if (provider === "mistral") {
      headers["Authorization"] = `Bearer ${apiKey}`;
      requestBody = {
        model: model_id,
        messages,
        stream,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens || 4096,
      };
    } else if (provider === "together") {
      headers["Authorization"] = `Bearer ${apiKey}`;
      requestBody = {
        model: model_id,
        messages,
        stream,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens || 4096,
      };
    } else if (provider === "perplexity") {
      headers["Authorization"] = `Bearer ${apiKey}`;
      requestBody = {
        model: model_id,
        messages,
        stream,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens || 4096,
      };
    } else {
      // OpenAI-compatible (openai, xai, deepseek)
      headers["Authorization"] = `Bearer ${apiKey}`;
      
      // Newer OpenAI models (GPT-5, O3, O4, GPT-4.1+) use max_completion_tokens and don't support temperature
      const isNewerOpenAIModel = provider === "openai" && (
        model_id.startsWith("gpt-5") ||
        model_id.startsWith("gpt-4.1") ||
        model_id.startsWith("o3") ||
        model_id.startsWith("o4")
      );
      
      if (isNewerOpenAIModel) {
        requestBody = {
          model: model_id,
          messages,
          stream,
          max_completion_tokens: config?.maxTokens || 4096,
        };
      } else {
        requestBody = {
          model: model_id,
          messages,
          stream,
          temperature: config?.temperature ?? 0.7,
          max_tokens: config?.maxTokens || 4096,
        };
      }
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[chat-proxy] Provider error: ${response.status}`, errorText);
      
      let errorMessage = `Provider error (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {}

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("[chat-proxy] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

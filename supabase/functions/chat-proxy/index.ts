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

// Get API key for a board (first checks board's linked key, then falls back to user's keys)
async function getApiKeyForBoard(supabase: any, boardId: string, provider: string): Promise<string | null> {
  // First, check if the board has a linked API key
  const { data: boardKey, error: boardKeyError } = await supabase
    .rpc('get_board_api_key', { p_board_id: boardId });
  
  if (!boardKeyError && boardKey && boardKey.length > 0) {
    const keyData = boardKey[0];
    // Verify the key matches the requested provider
    if (keyData.provider === provider && keyData.api_key_encrypted) {
      if (keyData.is_valid === false) {
        console.log(`[chat-proxy] Board's linked key for ${provider} is marked as invalid`);
        return null;
      }
      console.log(`[chat-proxy] Using board's linked API key for ${provider}`);
      return await decrypt(keyData.api_key_encrypted, ENCRYPTION_KEY);
    }
  }
  
  // No board-linked key found, return null - caller should handle
  console.log(`[chat-proxy] No board-linked key for ${provider}, board: ${boardId}`);
  return null;
}

// Legacy: Get API key from user's personal or team keys (for backwards compatibility)
// Now supports multiple keys per provider - picks the most recently created valid key
async function getDecryptedApiKey(supabase: any, userId: string, provider: string): Promise<string | null> {
  // First try to get a personal key (team_id IS NULL), prefer most recent
  let { data, error } = await supabase
    .from("api_keys")
    .select("api_key_encrypted, is_valid")
    .eq("user_id", userId)
    .eq("provider", provider)
    .is("team_id", null)
    .eq("is_valid", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no personal key, try to get a team key the user has access to
  if (!data?.api_key_encrypted) {
    const teamKeyResult = await supabase
      .from("api_keys")
      .select("api_key_encrypted, is_valid, team_id")
      .eq("user_id", userId)
      .eq("provider", provider)
      .not("team_id", "is", null)
      .eq("is_valid", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (teamKeyResult.data?.api_key_encrypted) {
      data = teamKeyResult.data;
      error = teamKeyResult.error;
    }
  }

  if (error) {
    console.error(`[chat-proxy] Database error fetching API key for ${provider}:`, error.message);
    return null;
  }

  if (!data?.api_key_encrypted) {
    console.log(`[chat-proxy] No API key found for provider: ${provider}, user: ${userId}`);
    return null;
  }

  console.log(`[chat-proxy] Found valid API key for ${provider}`);
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
    const { provider, model_id, messages, config, stream = true, action, prompt, board_id } = body;

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
      console.error("[chat-proxy] Missing required fields:", { provider: !!provider, model_id: !!model_id, messages: !!messages });
      return new Response(JSON.stringify({ 
        error: `Missing required fields: ${[
          !provider && 'provider',
          !model_id && 'model_id', 
          !messages && 'messages'
        ].filter(Boolean).join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate provider is supported
    if (!PROVIDER_ENDPOINTS[provider]) {
      console.error("[chat-proxy] Unsupported provider:", provider);
      return new Response(JSON.stringify({ 
        error: `Unsupported provider: ${provider}. Supported providers: ${Object.keys(PROVIDER_ENDPOINTS).join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get decrypted API key (server-side only - never exposed to frontend)
    // Priority: 1) Board's linked key, 2) User's personal/team keys (legacy fallback)
    let apiKey: string | null = null;
    
    if (board_id) {
      // Try to get the board's linked key first
      apiKey = await getApiKeyForBoard(supabaseAdmin, board_id, provider);
    }
    
    // Fallback to user's keys if no board-linked key found
    if (!apiKey) {
      apiKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider);
    }
    
    if (!apiKey) {
      console.error("[chat-proxy] No API key found for provider:", provider, "user:", user.id, "board:", board_id);
      return new Response(JSON.stringify({ 
        error: `No valid API key found for ${provider}. Please select an API key for this board in Board Settings, or add your API key in Settings > API Keys.`
      }), {
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
      console.error(`[chat-proxy] Provider ${provider} error: ${response.status}`, errorText);
      
      let errorMessage = `${provider} API error (${response.status})`;
      let errorDetails = '';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        errorDetails = errorJson.error?.type || '';
      } catch {}

      // Provide user-friendly error messages for common cases
      if (response.status === 401 || response.status === 403) {
        errorMessage = `Invalid or expired API key for ${provider}. Please update your key in Settings > API Keys.`;
      } else if (response.status === 429) {
        errorMessage = `Rate limit exceeded for ${provider}. Please wait a moment and try again.`;
      } else if (response.status === 404) {
        errorMessage = `Model "${model_id}" not found for ${provider}. It may not be available or the name is incorrect.`;
      } else if (response.status === 400) {
        errorMessage = `Invalid request to ${provider}: ${errorMessage}`;
      }

      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        status: response.status,
        provider 
      }), {
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

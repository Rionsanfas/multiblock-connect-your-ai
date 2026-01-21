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

// Map internal model IDs to STABLE Google API model IDs (avoid versioned previews)
const GOOGLE_MODEL_MAP: Record<string, string> = {
  // Gemini 3.x models -> stable 2.5 equivalents
  "gemini-3-pro": "gemini-2.5-pro",
  "gemini-3-flash": "gemini-2.5-flash",
  "gemini-3-nano": "gemini-2.0-flash-lite",
  // Gemini 2.5 models -> stable IDs
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-live-2.5-flash": "gemini-2.0-flash",
  // Gemini 2.0 stable models
  "gemini-2.0-flash": "gemini-2.0-flash",
  "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
  // Image generation
  "nano-banana-pro": "gemini-2.0-flash-exp",
};

// Fallback chain for Google models when a model returns 404
const GOOGLE_FALLBACK_CHAIN: Record<string, string[]> = {
  "gemini-2.5-pro": ["gemini-2.5-flash", "gemini-2.0-flash"],
  "gemini-2.5-flash": ["gemini-2.0-flash", "gemini-2.0-flash-lite"],
  "gemini-2.0-flash": ["gemini-2.0-flash-lite"],
  "gemini-2.0-flash-lite": [],
};

// Resolve any versioned preview model ID to a stable one
function resolveGoogleModelId(modelId: string): string {
  // Direct mapping
  if (GOOGLE_MODEL_MAP[modelId]) {
    return GOOGLE_MODEL_MAP[modelId];
  }
  // Handle versioned preview IDs like gemini-2.5-pro-preview-06-05
  const previewMatch = modelId.match(/^gemini-(2\.5|2\.0)-(pro|flash|flash-lite)-preview-/);
  if (previewMatch) {
    return `gemini-${previewMatch[1]}-${previewMatch[2]}`;
  }
  return modelId;
}

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

      // Try board-linked key first, then fallback to user keys
      let apiKey = board_id ? await getApiKeyForBoard(supabaseAdmin, board_id, provider) : null;
      if (!apiKey) {
        apiKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider);
      }
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: `No valid API key for ${provider}. Please add your ${provider} API key in Settings.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[chat-proxy] Image generation for user ${user.id} via ${provider}, model: ${model_id}`);

      let imageResponse;
      let imageUrl: string | null = null;
      let imageBytes: Uint8Array | null = null;
      
      if (provider === "openai") {
        imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            n: 1,
            size: "1024x1024",
          }),
        });
        
        if (imageResponse.ok) {
          const data = await imageResponse.json();
          const rawImage = data.data?.[0]?.url || data.data?.[0]?.b64_json;
          if (rawImage) {
            if (rawImage.startsWith('http')) {
              // It's a URL - fetch the actual image bytes
              const imgFetch = await fetch(rawImage);
              if (imgFetch.ok) {
                imageBytes = new Uint8Array(await imgFetch.arrayBuffer());
              }
            } else {
              // It's base64 - decode to bytes
              const b64 = rawImage.replace(/^data:image\/\w+;base64,/, '');
              imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            }
          }
        }
      } else if (provider === "together") {
        const togetherModel = model_id === "flux-together" ? "black-forest-labs/FLUX.1-schnell-Free" : model_id;
        imageResponse = await fetch("https://api.together.xyz/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: togetherModel,
            prompt,
            n: 1,
            width: 1024,
            height: 1024,
          }),
        });
        
        if (imageResponse.ok) {
          const data = await imageResponse.json();
          const rawImage = data.data?.[0]?.url || data.data?.[0]?.b64_json;
          if (rawImage) {
            if (rawImage.startsWith('http')) {
              const imgFetch = await fetch(rawImage);
              if (imgFetch.ok) {
                imageBytes = new Uint8Array(await imgFetch.arrayBuffer());
              }
            } else {
              const b64 = rawImage.replace(/^data:image\/\w+;base64,/, '');
              imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            }
          }
        }
      } else if (provider === "google") {
        // Use Gemini 2.5 Flash with image generation via generateContent + responseModalities
        // This is the correct approach for image generation with Gemini models
        const geminiModel = "gemini-2.0-flash-exp"; // Supports image output
        imageResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        });
        
        if (imageResponse.ok) {
          const data = await imageResponse.json();
          // Extract image from Gemini response structure
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              const b64 = part.inlineData.data;
              if (b64) {
                imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                break;
              }
            }
          }
        }
      } else if (provider === "xai") {
        imageResponse = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-2-image",
            prompt,
            n: 1,
          }),
        });
        
        if (imageResponse.ok) {
          const data = await imageResponse.json();
          const rawUrl = data.data?.[0]?.url;
          if (rawUrl) {
            const imgFetch = await fetch(rawUrl);
            if (imgFetch.ok) {
              imageBytes = new Uint8Array(await imgFetch.arrayBuffer());
            }
          }
        }
      } else if (provider === "mistral") {
        return new Response(JSON.stringify({ error: `Image generation is not yet available for Mistral. Please use a different provider.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ error: `Image generation not supported for ${provider}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!imageResponse!.ok) {
        const errorData = await imageResponse!.json().catch(() => ({}));
        console.error(`[chat-proxy] Image generation failed:`, errorData);
        return new Response(JSON.stringify({ error: errorData.error?.message || "Image generation failed" }), {
          status: imageResponse!.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!imageBytes) {
        return new Response(JSON.stringify({ error: "No image was generated" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // CRITICAL: Upload image to Supabase Storage for persistence and proper preview
      const { block_id: blockId, board_id: boardId } = body;
      const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('generated-media')
        .upload(storagePath, imageBytes, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error(`[chat-proxy] Failed to upload image to storage:`, uploadError);
        return new Response(JSON.stringify({ error: "Failed to save generated image" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create a signed URL for immediate preview (bucket is private)
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from('generated-media')
        .createSignedUrl(storagePath, 3600); // 1 hour

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error(`[chat-proxy] Failed to create signed URL:`, signedUrlError);
        return new Response(JSON.stringify({ error: "Failed to generate preview URL" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Stable reference URL (may not be publicly accessible; use storage_path + get-signed-url for access)
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('generated-media')
        .getPublicUrl(storagePath);

      // Save generated media metadata to database (NEVER store base64)
      const { data: mediaRow, error: mediaError } = await supabaseAdmin
        .from('generated_media')
        .insert({
          user_id: user.id,
          block_id: blockId || null,
          board_id: boardId || null,
          type: 'image',
          provider,
          model_id: model_id || 'unknown',
          model_name: model_id || 'Image Model',
          prompt,
          file_url: publicUrlData.publicUrl,
          storage_path: storagePath,
        })
        .select('id')
        .single();

      if (mediaError) {
        console.error(`[chat-proxy] Failed to save image metadata:`, mediaError);
        // Still return the signed URL so the user sees the preview, but indicate it wasn't saved.
        return new Response(JSON.stringify({
          image_url: signedUrlData.signedUrl,
          storage_path: storagePath,
          provider,
          model_id,
          prompt,
          warning: 'Image preview created but metadata could not be saved',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        image_url: signedUrlData.signedUrl,
        media_id: mediaRow.id,
        storage_path: storagePath,
        provider,
        model_id,
        prompt,
      }), {
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

      // Try board-linked key first, then fallback to user keys
      let apiKey = board_id ? await getApiKeyForBoard(supabaseAdmin, board_id, provider) : null;
      if (!apiKey) {
        apiKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider);
      }
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: `No valid API key for ${provider}. Please add your ${provider} API key in Settings.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[chat-proxy] Video generation for user ${user.id} via ${provider}, model: ${model_id}`);

      let videoUrl: string | null = null;
      let videoResponse;

      if (provider === "openai") {
        // OpenAI Sora uses async job API: create job, poll for completion, get content URL
        console.log(`[chat-proxy] Starting OpenAI Sora video generation...`);
        
        // Step 1: Create video generation job
        const createResponse = await fetch("https://api.openai.com/v1/videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model_id || "sora-2",
            prompt,
            size: "1280x720",
            seconds: "8", // OpenAI Sora uses 'seconds' (string: "4", "8", "12"), NOT 'duration'
          }),
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          console.error(`[chat-proxy] Sora job creation failed:`, errorData);
          
          // Check if Sora is not available
          if (createResponse.status === 404 || errorData.error?.message?.includes('not found')) {
            return new Response(JSON.stringify({ 
              error: `OpenAI Sora video generation is not available with your API key. Make sure you have Sora access enabled.`
            }), {
              status: 501,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          return new Response(JSON.stringify({ error: errorData.error?.message || "Failed to start video generation" }), {
            status: createResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const jobData = await createResponse.json();
        const jobId = jobData.id;
        console.log(`[chat-proxy] Sora job created: ${jobId}`);
        
        // Step 2: Poll for completion (max 5 minutes with exponential backoff)
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts * 5s avg = 5 minutes max
        let pollInterval = 2000; // Start at 2s, increase gradually
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          
          const pollResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
            headers: { "Authorization": `Bearer ${apiKey}` },
          });
          
          if (!pollResponse.ok) {
            console.error(`[chat-proxy] Sora poll failed:`, pollResponse.status);
            continue;
          }
          
          const pollData = await pollResponse.json();
          console.log(`[chat-proxy] Sora job ${jobId} status: ${pollData.status} (attempt ${attempts})`);
          
          if (pollData.status === "completed" || pollData.status === "succeeded") {
            // Step 3: Get the video content URL
            videoUrl = pollData.output?.url || pollData.data?.[0]?.url || pollData.video_url;
            if (videoUrl) {
              console.log(`[chat-proxy] Sora video ready: ${videoUrl.substring(0, 100)}...`);
              break;
            }
          } else if (pollData.status === "failed" || pollData.status === "error") {
            console.error(`[chat-proxy] Sora generation failed:`, pollData.error);
            return new Response(JSON.stringify({ 
              error: pollData.error?.message || "Video generation failed"
            }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Increase poll interval (max 10s)
          pollInterval = Math.min(pollInterval * 1.2, 10000);
        }
        
        if (!videoUrl) {
          return new Response(JSON.stringify({ 
            error: "Video generation timed out. Please try again."
          }), {
            status: 504,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Create a successful videoResponse-like object so the rest of the code works
        videoResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
      } else if (provider === "together") {
        // Together.ai video models
        videoResponse = await fetch("https://api.together.xyz/v1/videos/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model_id || "stable-video-diffusion",
            prompt,
          }),
        });
        
        if (videoResponse.ok) {
          const data = await videoResponse.json();
          videoUrl = data.data?.[0]?.url;
        }
      } else if (provider === "google") {
        // Google Veo API (when available)
        videoResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predict?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { duration: 5 },
          }),
        });
        
        if (videoResponse.ok) {
          const data = await videoResponse.json();
          videoUrl = data.predictions?.[0]?.videoUrl;
        }
      } else {
        return new Response(JSON.stringify({ 
          error: `Video generation is not yet available for ${provider}. Supported providers: OpenAI (Sora), Google (Veo), Together.ai (Stable Video).`
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!videoResponse!.ok) {
        const errorData = await videoResponse!.json().catch(() => ({}));
        console.error(`[chat-proxy] Video generation failed:`, errorData);
        // Check if it's a "not available" error
        const errorMessage = errorData.error?.message || "Video generation failed";
        if (errorMessage.includes("not found") || errorMessage.includes("not available")) {
          return new Response(JSON.stringify({ 
            error: `Video generation API is not yet available for ${provider}. This feature is coming soon.`
          }), {
            status: 501,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: videoResponse!.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!videoUrl) {
        return new Response(JSON.stringify({ error: "No video was generated" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save generated media metadata to database
      const { block_id: blockId, board_id: boardId } = body;
      try {
        await supabaseAdmin.from('generated_media').insert({
          user_id: user.id,
          block_id: blockId || null,
          board_id: boardId || null,
          type: 'video',
          provider,
          model_id: model_id || 'unknown',
          model_name: model_id || 'Video Model',
          prompt,
          file_url: videoUrl,
        });
        console.log(`[chat-proxy] Saved generated video metadata for user ${user.id}`);
      } catch (saveError) {
        console.error(`[chat-proxy] Failed to save video metadata:`, saveError);
        // Continue anyway - the video was generated successfully
      }

      return new Response(JSON.stringify({ 
        video_url: videoUrl,
        provider,
        model_id,
        prompt,
      }), {
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
      // Resolve to stable Google API model ID using helper function
      const googleModelId = resolveGoogleModelId(model_id);
      endpoint = `${endpoint}/${googleModelId}:streamGenerateContent?alt=sse&key=${apiKey}`;
      console.log(`[chat-proxy] Google model mapping: ${model_id} -> ${googleModelId}`);
      
      const formatted = formatMessagesForProvider(provider, messages);
      requestBody = {
        contents: formatted.messages.map((m: any) => {
          const parts: any[] = [];
          
          // Handle multimodal content (text + images/files)
          if (Array.isArray(m.content)) {
            for (const part of m.content) {
              if (part.type === "text" && part.text) {
                parts.push({ text: part.text });
              } else if (part.type === "image_url" && part.image_url?.url) {
                // Extract base64 from data URL or use URL directly
                const url = part.image_url.url;
                if (url.startsWith("data:")) {
                  const matches = url.match(/^data:([^;]+);base64,(.+)$/);
                  if (matches) {
                    parts.push({
                      inlineData: {
                        mimeType: matches[1],
                        data: matches[2],
                      },
                    });
                  }
                } else {
                  // For external URLs, detect mime type from extension
                  const ext = url.split('.').pop()?.toLowerCase() || '';
                  const mimeMap: Record<string, string> = {
                    'png': 'image/png',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'pdf': 'application/pdf',
                  };
                  parts.push({
                    fileData: {
                      mimeType: mimeMap[ext] || "image/jpeg",
                      fileUri: url,
                    },
                  });
                }
              } else if (part.type === "file" && part.file) {
                // Handle PDFs and other files sent as base64 inlineData
                parts.push({
                  inlineData: {
                    mimeType: part.file.mimeType,
                    data: part.file.data,
                  },
                });
              }
            }
          } else if (typeof m.content === "string") {
            parts.push({ text: m.content });
          }
          
          // Ensure at least one part
          if (parts.length === 0) {
            parts.push({ text: "" });
          }
          
          return {
            role: m.role === "assistant" ? "model" : "user",
            parts,
          };
        }),
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
        // Rate limit - be specific about retry timing
        const retryAfter = response.headers.get('retry-after') || response.headers.get('x-ratelimit-reset-requests');
        const waitTime = retryAfter ? ` (wait ~${retryAfter}s)` : '';
        errorMessage = `Rate limit reached for ${provider}${waitTime}. This is normal after heavy usage. Please wait 30-60 seconds before trying again.`;
        console.log(`[chat-proxy] Rate limit hit for ${provider}, user ${user.id}. Retry-After: ${retryAfter}`);
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

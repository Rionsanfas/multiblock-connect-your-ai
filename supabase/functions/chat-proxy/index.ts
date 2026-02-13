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

// OpenRouter endpoint and configuration
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_REFERER = "https://multiblock.app";
const OPENROUTER_TITLE = "Multiblock";

// Check if API key is an OpenRouter key (starts with sk-or-)
function isOpenRouterKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-or-');
}

// ============================================
// OPENROUTER MODEL MAPPINGS - CANONICAL SOURCE OF TRUTH
// Maps internal model IDs to OpenRouter's actual model slugs
// DO NOT MODIFY without explicit user instruction mentioning model changes
// ============================================
const OPENROUTER_MODEL_MAPPINGS: Record<string, string> = {
  // ========================================
  // OPENAI - GPT-5 & o3 Series
  // ========================================
  'gpt-5.2': 'openai/gpt-5.2',
  'gpt-5.2-pro': 'openai/gpt-5.2-pro',
  'gpt-5': 'openai/gpt-5',
  'gpt-5-mini': 'openai/gpt-5-mini',
  'gpt-5-nano': 'openai/gpt-5-nano',
  'gpt-4o': 'openai/gpt-4o',
  'o3-pro': 'openai/o3-pro',
  'o3-deep-research': 'openai/o3-deep-research',
  // User-specified exact ID (from canonical list)
  'o3-deep-search': 'openai/o3-deep-search',
  'gpt-image-1.5': 'openai/gpt-image-1.5',
  'sora-2-pro': 'openai/sora-2-pro',

  // ========================================
  // ANTHROPIC - Claude 4 series
  // Correct OpenRouter slugs: anthropic/claude-haiku-4.5, anthropic/claude-sonnet-4, etc.
  // ========================================
  'claude-opus-4.5': 'anthropic/claude-4.5-opus',
  'claude-sonnet-4.5': 'anthropic/claude-4.5-sonnet',
  'claude-haiku-4.5': 'anthropic/claude-haiku-4.5',
  'claude-opus-4.1': 'anthropic/claude-opus-4.1',
  'claude-sonnet-4': 'anthropic/claude-sonnet-4',
  // User-specified canonical IDs (exact match from list)
  'claude-haiku-4-5-20251001': 'anthropic/claude-haiku-4.5',
  'claude-opus-4-1-20250805': 'anthropic/claude-opus-4.1',
  'claude-sonnet-4-20250514': 'anthropic/claude-sonnet-4',
  'claude-opus-4-5-20251101': 'anthropic/claude-4.5-opus',
  'claude-sonnet-4-5-20250929': 'anthropic/claude-4.5-sonnet',

  // ========================================
  // GOOGLE - Gemini
  // ========================================
  'gemini-3-pro': 'google/gemini-3-pro-preview',
  'gemini-3-flash': 'google/gemini-3-flash-preview',
  'gemini-3-nano': 'google/gemini-3-nano',
  'gemini-2.5-pro': 'google/gemini-2.5-pro',
  // User-specified canonical ID
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  // User-specified: gemini-live-2.5-flash-native-audio (audio-only, will be disabled)
  'gemini-live-2.5-flash': 'google/gemini-2.5-flash-preview-native-audio-dialog',
  'gemini-live-2.5-flash-native-audio': 'google/gemini-2.5-flash-preview-native-audio-dialog',
  'gemini-3-pro-preview': 'google/gemini-3-pro-preview',
  'gemini-3-flash-preview': 'google/gemini-3-flash-preview',
  'gemini-2.5-flash-lite': 'google/gemini-2.5-flash-lite',

  // ========================================
  // XAI (GROK) - User-specified exact IDs
  // ========================================
  'grok-4.1-fast': 'x-ai/grok-4-fast',
  'grok-4.1-fast-reasoning': 'x-ai/grok-4-fast',
  'grok-4.1-fast-non-reasoning': 'x-ai/grok-4-fast',
  // User-specified canonical IDs
  'xai.grok-4.1-fast-reasoning': 'x-ai/grok-4-fast',
  'xai.grok-4.1-fast-non-reasoning': 'x-ai/grok-4-fast',
  'grok-code-fast-1': 'x-ai/grok-code-fast-1',
  'grok-4-fast-reasoning': 'x-ai/grok-4',
  // User-specified: grok-4-0709
  'grok-4-0709': 'x-ai/grok-4',
  'grok-4.0709': 'x-ai/grok-4',
  'grok-4-1-fast-non-reasoning': 'x-ai/grok-4-fast',
  'grok-4-1-fast-reasoning': 'x-ai/grok-4-fast',
  'grok-4-fast-non-reasoning': 'x-ai/grok-4',

  // ========================================
  // DEEPSEEK - Text (CANONICAL)
  // ========================================
  'deepseek-v3.1': 'deepseek-ai/DeepSeek-V3.1',
  'deepseek-v3.2': 'deepseek/deepseek-chat',
  'deepseek-v3.2-speciale': 'deepseek/deepseek-v3.2-speciale',
  'deepseek-v4-alpha': 'deepseek/deepseek-v4-preview',
  'deepseek-chat': 'deepseek/deepseek-chat',
  'deepseek-reasoner': 'deepseek/deepseek-r1',
  'deepseek-coder': 'deepseek/deepseek-coder',

  // ========================================
  // MISTRAL / MAGISTRAL - Text & Reasoning (CANONICAL)
  // ========================================
  'mistral-small-3.2': 'mistralai/Mistral-Small-3.2-24B-Instruct-2506',
  'magistral-medium-1.2': 'mistralai/Magistral-Medium-2509',
  'magistral-small-1.2': 'mistralai/Magistral-Small-2509',
  // Aliases for backward compatibility
  'mistral-large-3': 'mistralai/mistral-large-2512',
  'mistral-large-25-12': 'mistralai/mistral-large-2512',
  'mistral-medium-3.1': 'mistralai/mistral-medium-3',
  'mistral-small-2506': 'mistralai/Mistral-Small-3.2-24B-Instruct-2506',
  'ministral-3-14b': 'mistralai/ministral-14b-2512',
  'ministral-3-8b': 'mistralai/ministral-8b',
  'ministral-3-3b': 'mistralai/ministral-3b',
  'mistral-nemo-12b': 'mistralai/mistral-nemo',
  'mistralai/Mistral-Nemo-Instruct-2407': 'mistralai/mistral-nemo',
  'magistral-medium-2509': 'mistralai/Magistral-Medium-2509',
  'magistral-small-2509': 'mistralai/Magistral-Small-2509',
  'codestral': 'mistralai/codestral-2501',
  'mistral-large-latest': 'mistralai/mistral-large-2512',
  'mistral-medium-latest': 'mistralai/mistral-medium-3',
  'mistral-small-latest': 'mistralai/Mistral-Small-3.2-24B-Instruct-2506',

  // ========================================
  // META/TOGETHER - Llama (User-specified exact IDs)
  // ========================================
  'llama-4-maverick-17bx128e': 'meta-llama/llama-4-maverick',
  'llama-4-scout-17bx16e': 'meta-llama/llama-4-scout',
  'llama-3.3-70b-instruct-turbo': 'meta-llama/llama-3.3-70b-instruct',
  // User-specified canonical IDs
  'meta-llama/Llama-3.3-70B-Instruct': 'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/Llama-4-Maverick-17B-128E': 'meta-llama/llama-4-maverick',
  'meta-llama/Llama-4-Scout-17B-16E': 'meta-llama/llama-4-scout',

  // ========================================
  // QWEN - User-specified exact ID
  // ========================================
  'qwen3-235b-a22b-instruct': 'qwen/qwen3-235b-a22b-2507',
  // User-specified canonical ID
  'Qwen3-235B-A22B-Instruct-2507': 'qwen/qwen3-235b-a22b-2507',

  // ========================================
  // COHERE - Text / Reasoning / Translation (CANONICAL)
  // ========================================
  'command-a-03-2025': 'cohere/command-a-03-2025',
  'command-a-reasoning-08-2025': 'cohere/command-a-reasoning-08-2025',
  'command-a-translate-08-2025': 'cohere/command-a-translate-08-2025',
  'command-r-plus-08-2024': 'cohere/command-r-plus-08-2024',
  'c4ai-aya-expanse-32b': 'cohere/aya-expanse-32b',

  // ========================================
  // PERPLEXITY - Sonar 2026
  // ========================================
  'sonar': 'perplexity/sonar',
  'sonar-pro': 'perplexity/sonar-pro',
  'sonar-reasoning': 'perplexity/sonar-reasoning',
  'sonar-reasoning-pro': 'perplexity/sonar-reasoning-pro',

  // ========================================
  // IMAGE GENERATION - CANONICAL IDs (DO NOT CHANGE)
  // gpt-image-1.5 is already mapped above in OpenAI section
  // ========================================
  'nano-banana-pro': 'google/nano-banana-pro',
  'grok-imagine': 'x-ai/grok-imagine',
};

// Map internal model ID to OpenRouter model ID format
function getOpenRouterModelId(modelId: string, provider: string): string {
  // First check our explicit mapping
  if (OPENROUTER_MODEL_MAPPINGS[modelId]) {
    return OPENROUTER_MODEL_MAPPINGS[modelId];
  }
  
  // Fallback: try to construct a reasonable OpenRouter model ID
  // OpenRouter uses provider/model format
  const providerPrefixes: Record<string, string> = {
    openai: 'openai',
    anthropic: 'anthropic',
    google: 'google',
    xai: 'x-ai',
    deepseek: 'deepseek',
    mistral: 'mistralai',
    cohere: 'cohere',
    together: 'meta-llama',
    perplexity: 'perplexity',
  };
  
  const prefix = providerPrefixes[provider] || provider;
  
  // For unknown models, return with prefix but log a warning
  // This allows flexibility while still working
  return `${prefix}/${modelId}`;
}

// ============================================
// MODEL ID MAPPINGS - Internal ID → Provider API ID
// SINGLE SOURCE OF TRUTH - No audio models
// ============================================
const MODEL_ID_MAPPINGS: Record<string, string> = {
  // ========================================
  // OPENAI (User-specified exact IDs)
  // ========================================
  'gpt-5.2': 'gpt-5.2',
  'gpt-5.2-pro': 'gpt-5.2-pro',
  'gpt-5': 'gpt-5',
  'gpt-5-mini': 'gpt-5-mini',
  'gpt-5-nano': 'gpt-5-nano',
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
  'o3-pro': 'o3-pro',
  'o3-deep-research': 'o3-deep-research',
  'o3-deep-search': 'o3-deep-search',
  'gpt-image-1.5': 'gpt-image-1.5',
  'sora-2-pro': 'sora-2-pro',

  // ========================================
  // ANTHROPIC (User-specified exact IDs with date suffixes)
  // ========================================
  'claude-opus-4.5': 'claude-opus-4-5-20251101',
  'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
  'claude-haiku-4.5': 'claude-haiku-4-5-20251001',
  'claude-opus-4.1': 'claude-opus-4-1-20250805',
  'claude-sonnet-4': 'claude-sonnet-4-20250514',

  // ========================================
  // GOOGLE (User-specified exact IDs)
  // ========================================
  'gemini-3-pro': 'gemini-3-pro-preview',
  'gemini-3-flash': 'gemini-3-flash-preview',
  'gemini-3-nano': 'gemini-2.5-flash-lite',
  'gemini-2.5-pro': 'gemini-2.5-pro',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-live-2.5-flash': 'gemini-live-2.5-flash-native-audio',
  'gemini-live-2.5-flash-native-audio': 'gemini-live-2.5-flash-native-audio',
  'nano-banana-pro': 'nano-banana-pro', // Uses OpenRouter canonical ID

  // Backward compatibility for saved blocks
  'gemini-2.5-pro-preview-06-05': 'gemini-2.5-pro',
  'gemini-2.5-pro-preview-05-06': 'gemini-2.5-pro',
  'gemini-2.5-flash-preview-04-17': 'gemini-2.5-flash',
  'veo-3.1': 'veo-3.1-generate-preview',

  // ========================================
  // XAI (User-specified exact IDs)
  // ========================================
  'grok-4.1-fast': 'grok-4-1-fast-non-reasoning',
  'grok-4.1-fast-reasoning': 'grok-4-1-fast-reasoning',
  'grok-4.1-fast-non-reasoning': 'grok-4-1-fast-non-reasoning',
  'xai.grok-4.1-fast-reasoning': 'xai.grok-4.1-fast-reasoning',
  'xai.grok-4.1-fast-non-reasoning': 'xai.grok-4.1-fast-non-reasoning',
  'grok-code-fast-1': 'grok-code-fast-1',
  'grok-4-fast-reasoning': 'grok-4-fast-reasoning',
  'grok-4-fast-non-reasoning': 'grok-4-fast-non-reasoning',
  'grok-4.0709': 'grok-4-0709',
  'grok-4-0709': 'grok-4-0709',
  'grok-imagine': 'grok-imagine', // Uses OpenRouter canonical ID
  'grok-imagine-video': 'grok-2-video',

  // ========================================
  // DEEPSEEK (CANONICAL)
  // ========================================
  'deepseek-v3.1': 'deepseek-chat',
  'deepseek-v3.2': 'deepseek-chat',
  'deepseek-v3.2-speciale': 'deepseek-reasoner',
  'deepseek-chat': 'deepseek-chat',
  'deepseek-reasoner': 'deepseek-reasoner',
  'deepseek-coder': 'deepseek-coder',

  // ========================================
  // MISTRAL / MAGISTRAL (CANONICAL)
  // ========================================
  'mistral-small-3.2': 'mistral-small-2506',
  'magistral-medium-1.2': 'magistral-medium-2509',
  'magistral-small-1.2': 'magistral-small-2509',
  // Backward compatibility aliases
  'mistral-large-3': 'mistral-large-latest',
  'mistral-large-25-12': 'mistral-large-latest',
  'mistral-medium-3.1': 'mistral-medium-latest',
  'mistral-small-2506': 'mistral-small-2506',
  'ministral-3-14b': 'ministral-14b-latest',
  'ministral-3-8b': 'ministral-8b-latest',
  'ministral-3-3b': 'ministral-3b-latest',
  'magistral-medium-2509': 'magistral-medium-2509',
  'magistral-small-2509': 'magistral-small-2509',
  'codestral': 'codestral-latest',
  'mistral-nemo-12b': 'open-mistral-nemo',
  'mistralai/Mistral-Nemo-Instruct-2407': 'open-mistral-nemo',
  'mistral-embed': 'mistral-embed',

  // ========================================
  // TOGETHER.AI (CANONICAL)
  // ========================================
  'llama-3.3-70b-instruct-turbo': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  'llama-4-maverick-17bx128e': 'meta-llama/Llama-4-Maverick-17B-128E-Instruct',
  'llama-4-scout-17bx16e': 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
  'qwen3-235b-a22b-instruct': 'Qwen/Qwen3-235B-A22B-Instruct',
  'Qwen3-235B-A22B-Instruct-2507': 'Qwen/Qwen3-235B-A22B-Instruct-2507',
  'deepseek-v3.1-together': 'deepseek-ai/DeepSeek-V3.1',
  'flux-together': 'black-forest-labs/FLUX.1-schnell-Free',
  'stable-video-together': 'stabilityai/stable-video-diffusion-img2vid-xt-1-1',

  // ========================================
  // COHERE (CANONICAL)
  // ========================================
  'command-a-03-2025': 'command-a-03-2025',
  'command-a-reasoning-08-2025': 'command-a-reasoning-08-2025',
  'command-a-vision-07-2025': 'command-a-vision-07-2025',
  'command-a-translate-08-2025': 'command-a-translate-08-2025',
  'command-r-plus-08-2024': 'command-r-plus-08-2024',
  'embed-v4.0': 'embed-v4.0',
  'embed-english-v3.0': 'embed-english-v3.0',
  'embed-multilingual-v3.0': 'embed-multilingual-v3.0',
  'rerank-v4.0-pro': 'rerank-v4.0-pro',
  'c4ai-aya-expanse-32b': 'c4ai-aya-expanse-32b',
  'c4ai-aya-vision-32b': 'c4ai-aya-vision-32b',

  // ========================================
  // PERPLEXITY
  // ========================================
  'sonar-large-online': 'sonar-pro',
  'pplx-70b': 'sonar',
  'gpt-5.1-pplx': 'sonar-pro',
  'claude-sonnet-4.5-pplx': 'sonar-pro',
  'claude-opus-4.1-thinking-pplx': 'sonar-reasoning-pro',
  'gemini-3-pro-pplx': 'sonar-pro',
  'grok-4.1-pplx': 'sonar-pro',
  'kimi-k2-pplx': 'sonar',
  'o3-pro-pplx': 'sonar-reasoning-pro',
};

// Resolve model ID to provider API ID
function resolveModelId(modelId: string, provider: string, log: (msg: string, extra?: Record<string, unknown>) => void): string {
  const resolved = MODEL_ID_MAPPINGS[modelId];
  if (resolved) {
    log('Model ID resolved', { from: modelId, to: resolved, provider });
    return resolved;
  }
  // No silent fallback - log warning and return as-is (will fail at provider with clear error)
  log('Model ID not in mapping - may fail', { modelId, provider });
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
async function getApiKeyForBoard(
  supabase: any,
  boardId: string,
  provider: string,
  log: (msg: string, extra?: Record<string, unknown>) => void,
): Promise<{ apiKey: string; keyId: string; keyHint: string | null } | null> {
  // Use boards.api_key_id as the single source of truth for board-linked keys.
  // (This avoids any ambiguity/caching inside RPCs and lets us log which key row was used.)
  const { data: boardRow, error: boardErr } = await supabase
    .from('boards')
    .select('api_key_id')
    .eq('id', boardId)
    .maybeSingle();

  if (boardErr) {
    log(`Failed to read boards.api_key_id`, { error: boardErr.message });
    return null;
  }

  const apiKeyId = boardRow?.api_key_id as string | null | undefined;
  if (!apiKeyId) {
    log(`No board-linked key`, { board_id: boardId, provider });
    return null;
  }

  const { data: keyRow, error: keyErr } = await supabase
    .from('api_keys')
    .select('id, provider, api_key_encrypted, is_valid, key_hint, team_id, user_id, created_at')
    .eq('id', apiKeyId)
    .maybeSingle();

  if (keyErr) {
    log(`Failed to read api_keys row for board-linked key`, { api_key_id: apiKeyId, error: keyErr.message });
    return null;
  }

  if (!keyRow?.api_key_encrypted) {
    log(`Board-linked api_key_id points to missing key`, { api_key_id: apiKeyId });
    return null;
  }

  if (keyRow.provider !== provider) {
    log(`Board-linked key provider mismatch`, { api_key_id: apiKeyId, expected: provider, actual: keyRow.provider });
    return null;
  }

  if (keyRow.is_valid === false) {
    log(`Board-linked key is marked invalid`, { api_key_id: apiKeyId, provider });
    return null;
  }

  const decrypted = await decrypt(keyRow.api_key_encrypted, ENCRYPTION_KEY);
  log(`Using board-linked API key`, {
    provider,
    api_key_id: keyRow.id,
    key_hint: keyRow.key_hint,
    team_id: keyRow.team_id,
    key_owner_user_id: keyRow.user_id,
  });
  return { apiKey: decrypted, keyId: keyRow.id, keyHint: keyRow.key_hint };
}

// Legacy: Get API key from user's personal or team keys (for backwards compatibility)
// Now supports multiple keys per provider - picks the most recently created valid key
async function getDecryptedApiKey(
  supabase: any,
  userId: string,
  provider: string,
  log: (msg: string, extra?: Record<string, unknown>) => void,
): Promise<{ apiKey: string; keyId: string; keyHint: string | null; source: 'personal' | 'team' } | null> {
  // First try to get a personal key (team_id IS NULL), prefer most recent
  let { data, error } = await supabase
    .from("api_keys")
    .select("id, api_key_encrypted, is_valid, key_hint, team_id, created_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .is("team_id", null)
    .eq("is_valid", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let source: 'personal' | 'team' = 'personal';

  // If no personal key, try to get a team key the user has access to
  if (!data?.api_key_encrypted) {
    const teamKeyResult = await supabase
      .from("api_keys")
      .select("id, api_key_encrypted, is_valid, key_hint, team_id, created_at")
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
      source = 'team';
    }
  }

  if (error) {
    log(`Database error fetching API key`, { provider, error: error.message });
    return null;
  }

  if (!data?.api_key_encrypted) {
    log(`No API key found`, { provider, user_id: userId });
    return null;
  }

  log(`Using fallback API key`, {
    provider,
    source,
    api_key_id: data.id,
    key_hint: data.key_hint,
    team_id: data.team_id,
  });
  const decrypted = await decrypt(data.api_key_encrypted, ENCRYPTION_KEY);
  return { apiKey: decrypted, keyId: data.id, keyHint: data.key_hint, source };
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
    
    // CRITICAL: Cohere requires non-empty content - filter out any empty messages
    const formattedMessages = nonSystemMessages
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : m.content[0]?.text || "",
      }))
      .filter((m: any) => m.content && m.content.trim().length > 0);
    
    return {
      preamble: systemMessage?.content || "",
      messages: formattedMessages,
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

    const requestId = crypto.randomUUID();
    const body = await req.json();
    const {
      provider,
      model_id,
      messages,
      config,
      stream = true,
      action,
      prompt,
      board_id,
      block_id,
      client_request_id,
    } = body;

    const log = (msg: string, extra?: Record<string, unknown>) => {
      const payload = extra ? ` ${JSON.stringify(extra)}` : '';
      console.log(`[chat-proxy][${requestId}] ${msg}${payload}`);
    };

    log('Incoming request', {
      user_id: user.id,
      action: action || 'chat',
      provider,
      model_id,
      board_id,
      block_id,
      client_request_id,
      stream,
    });

    // Handle image generation
    if (action === "image_generation") {
      if (!provider || !prompt) {
        return new Response(JSON.stringify({ error: "provider and prompt are required for image generation" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try board-linked key first, then fallback to user keys
      let apiKey: string | null = null;
      let keySource = 'unknown';
      if (board_id) {
        const boardKey = await getApiKeyForBoard(supabaseAdmin, board_id, provider, log);
        if (boardKey) {
          apiKey = boardKey.apiKey;
          keySource = 'board';
        }
      }
      if (!apiKey) {
        const fallbackKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider, log);
        if (fallbackKey) {
          apiKey = fallbackKey.apiKey;
          keySource = 'personal';
        }
      }
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: `No valid API key for ${provider}. Please add your ${provider} API key in Settings.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const useOpenRouter = isOpenRouterKey(apiKey);
      log('Image generation', { provider, model_id, useOpenRouter, keySource });

      let imageResponse: Response | undefined;
      let imageBytes: Uint8Array | null = null;
      
      // ========================================
      // OPENROUTER IMAGE GENERATION
      // Uses /v1/chat/completions with modalities: ["image", "text"]
      // ========================================
      if (useOpenRouter) {
        // Map to OpenRouter-compatible image model slugs
        const OPENROUTER_IMAGE_MODELS: Record<string, string> = {
          // CANONICAL - DO NOT CHANGE
          'gpt-image-1.5': 'openai/gpt-image-1.5',
          'nano-banana-pro': 'google/nano-banana-pro',
          'grok-imagine': 'x-ai/grok-imagine',
        };
        
        const openRouterModel = OPENROUTER_IMAGE_MODELS[model_id] || 
          (provider === 'openai' ? 'openai/gpt-image-1' : 
           provider === 'google' ? 'google/gemini-2.0-flash-exp' :
           provider === 'xai' ? 'x-ai/grok-2-image' : null);
        
        if (!openRouterModel) {
          return new Response(JSON.stringify({ error: `Image generation not supported for ${provider}. Try OpenAI (gpt-image-1.5), Google (nano-banana-pro), or xAI (Grok Imagine).` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        log('OpenRouter image routing', { model_id, openRouterModel });
        
        imageResponse = await fetch(OPENROUTER_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": OPENROUTER_REFERER,
            "X-Title": OPENROUTER_TITLE,
          },
          body: JSON.stringify({
            model: openRouterModel,
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });
        
        if (imageResponse.ok) {
          const data = await imageResponse.json();
          log('OpenRouter image response structure', { 
            hasChoices: !!data.choices, 
            choicesLength: data.choices?.length,
            hasImages: !!data.choices?.[0]?.message?.images,
          });
          
          // OpenRouter returns images in message.images array (base64 or URL)
          const images = data.choices?.[0]?.message?.images || [];
          if (images.length > 0) {
            const imgData = images[0];
            if (typeof imgData === 'string') {
              if (imgData.startsWith('http')) {
                const imgFetch = await fetch(imgData);
                if (imgFetch.ok) {
                  imageBytes = new Uint8Array(await imgFetch.arrayBuffer());
                }
              } else {
                // Base64
                const b64 = imgData.replace(/^data:image\/\w+;base64,/, '');
                imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
              }
            } else if (imgData.b64_json) {
              imageBytes = Uint8Array.from(atob(imgData.b64_json), c => c.charCodeAt(0));
            } else if (imgData.url) {
              const imgFetch = await fetch(imgData.url);
              if (imgFetch.ok) {
                imageBytes = new Uint8Array(await imgFetch.arrayBuffer());
              }
            }
          }
          
          // Fallback: check for inline base64 in content parts (Gemini style via OpenRouter)
          if (!imageBytes) {
            const content = data.choices?.[0]?.message?.content;
            if (Array.isArray(content)) {
              for (const part of content) {
                if (part.type === 'image' && part.image?.base64) {
                  imageBytes = Uint8Array.from(atob(part.image.base64), c => c.charCodeAt(0));
                  break;
                }
                if (part.type === 'image_url' && part.image_url?.url?.startsWith('data:')) {
                  const b64 = part.image_url.url.split(',')[1];
                  if (b64) {
                    imageBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                    break;
                  }
                }
              }
            }
          }
        }
      }
      // ========================================
      // DIRECT PROVIDER IMAGE GENERATION
      // ========================================
      else if (provider === "openai") {
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
        const geminiModel = "gemini-2.0-flash-exp";
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
        // Mistral image models (mistral-gan-flux, flux-2-pro) route through Together.ai / Black Forest Labs
        // For native Mistral keys, we inform the user they need OpenRouter or Together
        return new Response(JSON.stringify({ 
          error: `Mistral image models (Flux) require an OpenRouter key. Please add an OpenRouter API key to use ${model_id}.` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ error: `Image generation not supported for ${provider}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!imageResponse || !imageResponse.ok) {
        const errorData = imageResponse ? await imageResponse.json().catch(() => ({})) : { error: { message: 'No response' } };
        console.error(`[chat-proxy] Image generation failed:`, errorData);
        return new Response(JSON.stringify({ error: errorData.error?.message || "Image generation failed" }), {
          status: imageResponse?.status || 500,
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
      let apiKey: string | null = null;
      if (board_id) {
        const boardKey = await getApiKeyForBoard(supabaseAdmin, board_id, provider, log);
        apiKey = boardKey?.apiKey || null;
      }
      if (!apiKey) {
        const fallbackKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider, log);
        apiKey = fallbackKey?.apiKey || null;
      }
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: `No valid API key for ${provider}. Please add your ${provider} API key in Settings.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      log('Video generation', { provider, model_id });

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
    let resolvedKeyInfo: { key_source: 'board' | 'fallback'; key_id?: string; key_hint?: string | null } = { key_source: 'fallback' };
    
    if (board_id) {
      // Try to get the board's linked key first
      const boardKey = await getApiKeyForBoard(supabaseAdmin, board_id, provider, log);
      if (boardKey) {
        apiKey = boardKey.apiKey;
        resolvedKeyInfo = { key_source: 'board', key_id: boardKey.keyId, key_hint: boardKey.keyHint };
      }
    }
    
    // Fallback to user's keys if no board-linked key found
    if (!apiKey) {
      const fallbackKey = await getDecryptedApiKey(supabaseAdmin, user.id, provider, log);
      if (fallbackKey) {
        apiKey = fallbackKey.apiKey;
        resolvedKeyInfo = { key_source: 'fallback', key_id: fallbackKey.keyId, key_hint: fallbackKey.keyHint };
      }
    }
    
    if (!apiKey) {
      log('No API key resolved', { provider, user_id: user.id, board_id });
      return new Response(JSON.stringify({ 
        error: `No valid API key found for ${provider}. Please select an API key for this board in Board Settings, or add your API key in Settings > API Keys.`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect if this is an OpenRouter key
    const useOpenRouter = isOpenRouterKey(apiKey);
    
    log('Proxying request', { 
      provider, 
      model_id, 
      key_source: resolvedKeyInfo.key_source,
      key_id: resolvedKeyInfo.key_id,
      key_hint: resolvedKeyInfo.key_hint,
      use_openrouter: useOpenRouter,
    });

    // Build request based on provider (or OpenRouter if detected)
    let endpoint = useOpenRouter ? OPENROUTER_ENDPOINT : PROVIDER_ENDPOINTS[provider];
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let requestBody: any;
    
    // If using OpenRouter, set up OpenRouter-specific headers and model ID
    if (useOpenRouter) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = OPENROUTER_REFERER;
      headers["X-Title"] = OPENROUTER_TITLE;
      
      // Convert model ID to OpenRouter format (provider/model)
      const openRouterModelId = getOpenRouterModelId(model_id, provider);
      log('OpenRouter routing', { original_model: model_id, openrouter_model: openRouterModelId, provider });
      
      requestBody = {
        model: openRouterModelId,
        messages,
        stream,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens || 4096,
      };
    } else if (provider === "anthropic") {
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
      const googleModelId = resolveModelId(model_id, provider, log);
      endpoint = `${endpoint}/${googleModelId}:streamGenerateContent?alt=sse&key=${apiKey}`;
      log('Google request', { from: model_id, to: googleModelId });
      
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
      console.error(`[chat-proxy][${requestId}] Provider ${provider} error: ${response.status}`, errorText);
      
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
        // Distinguish between rate limit (temporary) and quota exhausted (daily/monthly limit)
        const retryAfter = response.headers.get('retry-after') || response.headers.get('x-ratelimit-reset-requests');
        
        // Check if it's a quota exhaustion (Google-specific: RESOURCE_EXHAUSTED with limit: 0 or "exceeded quota")
        const isQuotaExhausted = errorText.includes('RESOURCE_EXHAUSTED') || 
                                  errorText.includes('exceeded your current quota') ||
                                  errorText.includes('limit: 0');
        
        if (isQuotaExhausted) {
          // Daily/monthly quota exhausted - need to wait until reset or upgrade
          errorMessage = `Your ${provider} API quota has been exhausted. This usually resets daily. You can check your quota at ${provider === 'google' ? 'https://ai.google.dev/gemini-api/docs/rate-limits' : 'your provider dashboard'}. Consider upgrading your API plan for higher limits.`;
          log('Quota exhausted (or RESOURCE_EXHAUSTED)', { provider, retryAfter, ...resolvedKeyInfo });
        } else {
          // Temporary rate limit - just wait
          const waitTime = retryAfter ? ` (wait ~${retryAfter}s)` : '';
          errorMessage = `Rate limit reached for ${provider}${waitTime}. Please wait 30-60 seconds before trying again.`;
          log('Rate limit hit', { provider, retryAfter, ...resolvedKeyInfo });
        }
      } else if (response.status === 404) {
        errorMessage = `Model "${model_id}" not found for ${provider}. It may not be available or the name is incorrect.`;
      } else if (response.status === 400) {
        errorMessage = `Invalid request to ${provider}: ${errorMessage}`;
      }

      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        status: response.status,
        provider,
        request_id: requestId,
        client_request_id,
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

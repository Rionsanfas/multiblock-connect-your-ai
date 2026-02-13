// Secure Chat Service with Streaming Support
// All API calls go through chat-proxy edge function - API keys NEVER exposed to frontend

import { supabase } from '@/integrations/supabase/client';
import {
  getModelConfig,
  getVisionModelForProvider,
  getImageGenModelForProvider,
  type Provider,
  type ModelConfig,
} from '@/config/models';
import type { Message } from '@/types';
import { isModelInScope, useModelDisableStore } from '@/store/useModelDisableStore';

// Lovable does not reliably expose VITE_* env vars on the client; use the project ref URL directly.
const SUPABASE_FUNCTIONS_BASE_URL = "https://dpeljwqtkjjkriobkhtj.supabase.co/functions/v1";


export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url' | 'file';
  text?: string;
  image_url?: { url: string };
  file?: { mimeType: string; data: string; name?: string };
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string, meta?: MessageMeta) => void;
  onError: (error: string) => void;
}

export interface MessageMeta {
  tokens?: number;
  cost?: number;
  model?: string;
  latency_ms?: number;
}

// ============================================
// MODEL ID MAPPINGS - Internal ID → Provider API ID
// SINGLE SOURCE OF TRUTH - User-specified canonical IDs
// ============================================
const getProviderModelId = (modelId: string, provider: Provider): string => {
  const mappings: Record<string, string> = {
    // ========================================
    // OPENAI
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
    // User-specified canonical ID
    'o3-deep-search': 'o3-deep-search',
    'gpt-image-1.5': 'gpt-image-1.5',
    'sora-2-pro': 'sora-2-pro',

    // ========================================
    // ANTHROPIC - User-specified canonical IDs
    // ========================================
    'claude-opus-4.5': 'claude-opus-4-5-20251101',
    'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
    'claude-haiku-4.5': 'claude-haiku-4-5-20251001',
    'claude-opus-4.1': 'claude-opus-4-1-20250805',
    'claude-sonnet-4': 'claude-sonnet-4-20250514',
    // Canonical IDs as primary
    'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
    'claude-opus-4-1-20250805': 'claude-opus-4-1-20250805',
    'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',

    // ========================================
    // GOOGLE - User-specified canonical IDs
    // ========================================
    'gemini-3-pro': 'gemini-3-pro-preview',
    'gemini-3-flash': 'gemini-3-flash-preview',
    'gemini-3-nano': 'gemini-2.5-flash-lite',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    // User-specified canonical ID (audio-only, disabled)
    'gemini-live-2.5-flash-native-audio': 'gemini-live-2.5-flash-native-audio',
    'nano-banana-pro': 'gemini-3-pro-image-preview',
    'gemini-2.5-pro-preview-06-05': 'gemini-2.5-pro',
    'gemini-2.5-pro-preview-05-06': 'gemini-2.5-pro',
    'gemini-2.5-flash-preview-04-17': 'gemini-2.5-flash',
    'veo-3.1': 'veo-3.1-generate-preview',

    // ========================================
    // XAI - User-specified canonical IDs
    // ========================================
    'grok-4.1-fast': 'grok-4-1-fast-non-reasoning',
    'grok-4.1-fast-reasoning': 'grok-4-1-fast-reasoning',
    'grok-4.1-fast-non-reasoning': 'grok-4-1-fast-non-reasoning',
    // User-specified canonical IDs
    'xai.grok-4.1-fast-reasoning': 'xai.grok-4.1-fast-reasoning',
    'xai.grok-4.1-fast-non-reasoning': 'xai.grok-4.1-fast-non-reasoning',
    'grok-code-fast-1': 'grok-code-fast-1',
    'grok-4-fast-reasoning': 'grok-4-fast-reasoning',
    'grok-4-fast-non-reasoning': 'grok-4-fast-non-reasoning',
    // User-specified canonical ID
    'grok-4-0709': 'grok-4-0709',
    'grok-imagine-image': 'grok-2-image-1212',
    'grok-imagine-video': 'grok-2-video',

    // ========================================
    // DEEPSEEK - User-specified canonical IDs
    // ========================================
    'deepseek-v3.2': 'deepseek-chat',
    // User-specified canonical ID
    'deepseek-v3.2-speciale': 'deepseek-v3.2-speciale',
    'deepseek-v3.1': 'deepseek-chat',
    'deepseek-chat': 'deepseek-chat',
    'deepseek-reasoner': 'deepseek-reasoner',
    'deepseek-coder': 'deepseek-coder',

    // ========================================
    // MISTRAL - User-specified canonical IDs
    // ========================================
    'mistral-large-3': 'mistral-large-latest',
    // User-specified canonical ID
    'mistral-large-25-12': 'mistral-large-25-12',
    'mistral-medium-3.1': 'mistral-medium-latest',
    'mistral-small-3.2': 'mistral-small-latest',
    // User-specified canonical ID
    'mistral-small-2506': 'mistral-small-2506',
    // User-specified canonical IDs
    'ministral-3-14b': 'ministral-3-14b',
    'ministral-3-8b': 'ministral-3-8b',
    'ministral-3-3b': 'ministral-3-3b',
    'magistral-medium-1.2': 'magistral-medium-latest',
    'magistral-small-1.2': 'magistral-small-latest',
    // User-specified canonical IDs
    'magistral-medium-2509': 'magistral-medium-2509',
    'magistral-small-2509': 'magistral-small-2509',
    'codestral': 'codestral-latest',
    'mistral-nemo-12b': 'open-mistral-nemo',
    // User-specified canonical ID
    'mistralai/Mistral-Nemo-Instruct-2407': 'mistralai/Mistral-Nemo-Instruct-2407',
    'mistral-embed': 'mistral-embed',
    'mistral-gan': 'pixtral-12b-latest',

    // ========================================
    // TOGETHER.AI - User-specified canonical IDs
    // ========================================
    'llama-3.3-70b-instruct-turbo': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'llama-4-maverick-17bx128e': 'meta-llama/Llama-4-Maverick-17B-128E-Instruct',
    'llama-4-scout-17bx16e': 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    'qwen3-235b-a22b-instruct': 'Qwen/Qwen3-235B-A22B-Instruct',
    // User-specified canonical IDs
    'meta-llama/Llama-3.3-70B-Instruct': 'meta-llama/Llama-3.3-70B-Instruct',
    'meta-llama/Llama-4-Maverick-17B-128E': 'meta-llama/Llama-4-Maverick-17B-128E',
    'meta-llama/Llama-4-Scout-17B-16E': 'meta-llama/Llama-4-Scout-17B-16E',
    'Qwen3-235B-A22B-Instruct-2507': 'Qwen3-235B-A22B-Instruct-2507',
    'deepseek-v3.1-together': 'deepseek-ai/DeepSeek-V3.1',
    'flux-together': 'black-forest-labs/FLUX.1-schnell-Free',
    'stable-video-together': 'stabilityai/stable-video-diffusion-img2vid-xt-1-1',

    // ========================================
    // COHERE - User-specified canonical IDs
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

    // ========================================
    // ANTHROPIC - Claude 4.6 Series
    // ========================================
    'claude-opus-4.6': 'claude-opus-4-6-20260201',
    'claude-sonnet-4.6': 'claude-sonnet-4-6-20260201',
    'claude-haiku-4.6': 'claude-haiku-4-6-20260201',

    // ========================================
    // DEEPSEEK - V4 Alpha
    // ========================================
    'deepseek-v4-alpha': 'deepseek-chat',

    // ========================================
    // MISTRAL - Large 3 2512
    // ========================================
    'mistral-large-3-2512': 'mistral-large-2512',

    // ========================================
    // OPENROUTER MODELS (routed via OpenRouter API)
    // ========================================
    'llama-4-maverick': 'meta-llama/llama-4-maverick',
    'llama-4-scout': 'meta-llama/llama-4-scout',
    'llama-3.3-70b-instruct': 'meta-llama/llama-3.3-70b-instruct',
    'kimi-k2.5-or': 'moonshotai/kimi-k2.5',
    'kimi-k2-thinking-or': 'moonshotai/kimi-k2-thinking',
    'kimi-k2-0905-or': 'moonshotai/kimi-k2-0905',
    'kimi-k1.5-or': 'moonshotai/kimi-k1.5',
    'qwen3-235b-a22b': 'qwen/qwen3-235b-a22b-2507',
    'sonar-or': 'sonar',
    'sonar-pro-or': 'sonar-pro',
    'sonar-reasoning-or': 'sonar-reasoning',
    'sonar-reasoning-pro-or': 'sonar-reasoning-pro',

    // ========================================
    // MOONSHOT (KIMI) - Direct via Moonshot API
    // ========================================
    'kimi-k2.5': 'kimi-k2.5',
    'kimi-k2-thinking': 'kimi-k2-thinking',
    'kimi-k2-0905': 'kimi-k2-0905',
    'kimi-k1.5': 'kimi-k1.5',
  };

  // Direct match - return mapped value
  if (mappings[modelId]) {
    return mappings[modelId];
  }

  // No fallback - if model is not in mapping, it's invalid
  // Log warning and return as-is (will fail at provider level with clear error)
  console.warn(`[ChatService] Model ID "${modelId}" not in mapping - may fail at provider`);
  return modelId;
};


class ChatService {
  private abortController: AbortController | null = null;

  /**
   * Detect if message contains image generation request
   */
  private detectImageGenerationRequest(content: string): boolean {
    const imageGenPatterns = [
      /generate\s+(an?\s+)?image/i,
      /create\s+(an?\s+)?image/i,
      /draw\s+(me\s+)?(an?\s+)?/i,
      /make\s+(an?\s+)?picture/i,
      /generate\s+(a\s+)?picture/i,
      /create\s+(a\s+)?picture/i,
      /can you (draw|generate|create|make)\s/i,
      /show me (an?\s+)?(image|picture|drawing)/i,
    ];
    
    return imageGenPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Determine the appropriate model based on message content
   */
  resolveModel(
    selectedModelId: string,
    hasImages: boolean,
    messageContent: string
  ): { modelId: string; modelConfig: ModelConfig | undefined; reason?: string } {
    const selectedModel = getModelConfig(selectedModelId);
    
    if (!selectedModel) {
      return { modelId: selectedModelId, modelConfig: undefined };
    }

    const provider = selectedModel.provider;

    // Check if user is requesting image generation
    if (this.detectImageGenerationRequest(messageContent)) {
      const imageGenModel = getImageGenModelForProvider(provider);
      if (imageGenModel) {
        return { 
          modelId: imageGenModel.id, 
          modelConfig: imageGenModel,
          reason: `Auto-routing to ${imageGenModel.name} for image generation`
        };
      }
      return { 
        modelId: selectedModelId, 
        modelConfig: selectedModel,
        reason: `${provider} does not support image generation`
      };
    }

    // Check if user uploaded images but model doesn't support vision
    if (hasImages && !selectedModel.supports_vision) {
      const visionModel = getVisionModelForProvider(provider);
      if (visionModel) {
        return { 
          modelId: visionModel.id, 
          modelConfig: visionModel,
          reason: `Auto-routing to ${visionModel.name} for image analysis`
        };
      }
    }

    return { modelId: selectedModelId, modelConfig: selectedModel };
  }

  /**
   * Build conversation history with model identity and context
   * @param boardMemory - Formatted board memory string (from formatMemoryForContext)
   */
  buildConversationHistory(
    messages: Message[],
    modelId: string,
    systemPrompt?: string,
    sourceContext?: string,
    incomingBlockContext?: string,
    boardMemory?: string
  ): ChatMessage[] {
    const history: ChatMessage[] = [];

    const modelConfig = getModelConfig(modelId);
    const modelName = modelConfig?.name || modelId;
    const providerName = modelConfig?.provider 
      ? modelConfig.provider.charAt(0).toUpperCase() + modelConfig.provider.slice(1)
      : 'AI';

    let systemContent = systemPrompt || 'You are a helpful assistant.';
    
    systemContent = `You are ${modelName}, an AI model by ${providerName}. ` +
      `When asked about your identity, always truthfully state that you are ${modelName}.\n\n` +
      systemContent;

    // Inject board memory FIRST (highest priority context)
    if (boardMemory) {
      systemContent = boardMemory + '\n\n' + systemContent;
    }

    if (sourceContext) {
      systemContent += `\n\nContext provided:\n"${sourceContext}"`;
    }

    if (incomingBlockContext) {
      systemContent += `\n\nContext from connected blocks:\n${incomingBlockContext}`;
    }

    history.push({ role: 'system', content: systemContent });

    for (const msg of messages) {
      if (msg.role === 'system') continue;
      if (msg.role === 'context') {
        history.push({
          role: 'user',
          content: `[Context from connected block]\n${msg.content}`,
        });
      } else {
        let content = msg.content;
        if (msg.role === 'user') {
          const urls = this.extractUrls(content);
          if (urls.length > 0) {
            content += `\n\n[Note: This message contains ${urls.length === 1 ? 'a URL' : 'URLs'}: ${urls.join(', ')}. Please consider this context if relevant.]`;
          }
        }
        history.push({
          role: msg.role as 'user' | 'assistant',
          content,
        });
      }
    }

    return history;
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  stopGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  isGenerating(): boolean {
    return this.abortController !== null;
  }

  /**
   * Stream chat completion via secure proxy - API keys never exposed to frontend
   * @param boardId - The board ID to resolve the API key from (required for board-level key binding)
   */
  async streamChat(
    modelId: string,
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    config?: { temperature?: number; maxTokens?: number },
    attachments?: ChatAttachment[],
    boardId?: string,
    blockId?: string
  ): Promise<void> {
    // Pre-flight validation
    if (!modelId) {
      callbacks.onError('No model selected. Please choose a model first.');
      return;
    }

    const hasImages = attachments?.some(a => a.type.startsWith('image/')) || false;
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const messageContent = typeof lastUserMessage?.content === 'string' 
      ? lastUserMessage.content 
      : '';
    
    const { modelId: resolvedModelId, modelConfig, reason } = this.resolveModel(
      modelId, 
      hasImages, 
      messageContent
    );
    
    if (reason) {
      console.log('[ChatService] Model routing:', reason);
    }

    if (!modelConfig) {
      callbacks.onError(`Model "${modelId}" is not recognized. Please select a valid model.`);
      return;
    }

    const provider = modelConfig.provider;
    
    // Validate provider is supported
    if (!provider) {
      callbacks.onError(`Could not determine provider for model "${modelId}".`);
      return;
    }
    
    const providerModelId = getProviderModelId(resolvedModelId, provider);
    console.log(`[ChatService] Using model: ${resolvedModelId} → API: ${providerModelId}`);

    // Hard-disable enforcement (ONLY for the user-specified model set)
    const disabledReason = useModelDisableStore.getState().getDisabledReason(providerModelId);
    if (disabledReason) {
      callbacks.onError(`Model is disabled: ${disabledReason}`);
      return;
    }

    // Handle image generation separately
    if (modelConfig.supports_image_generation) {
      await this.handleImageGeneration(modelConfig, messageContent, callbacks, boardId, blockId);
      return;
    }

    // Handle video generation separately
    if (modelConfig.supports_video_generation) {
      await this.handleVideoGeneration(modelConfig, messageContent, callbacks, boardId, blockId);
      return;
    }

    this.abortController = new AbortController();
    const startTime = Date.now();
    let fullResponse = '';
    const clientRequestId = crypto.randomUUID();

    try {
      // Format messages with attachments for the proxy
      const formattedMessages = this.formatMessagesWithAttachments(messages, attachments, provider);

      // Ensure we have a fresh-ish token; if the call fails with 401 we refresh once and retry.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        callbacks.onError('Not authenticated. Please log in.');
        return;
      }

      const makeRequest = async (accessToken: string) => {
        return fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/chat-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            provider,
            model_id: providerModelId,
            messages: formattedMessages,
            config: {
              temperature: config?.temperature ?? 0.7,
              maxTokens: config?.maxTokens ?? 2048,
            },
            stream: true,
            board_id: boardId,
            block_id: blockId,
            client_request_id: clientRequestId,
          }),
          signal: this.abortController?.signal,
        });
      };

      let response = await makeRequest(session.access_token);

      // If the JWT is stale/expired, refresh once and retry.
      if (response.status === 401) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        const nextToken = refreshed.session?.access_token;
        if (nextToken) {
          response = await makeRequest(nextToken);
        }
      }

      if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.request_id) {
            errorMessage = `${errorMessage} (request_id: ${errorData.request_id})`;
          }
          if (errorData.details) {
            console.error('[ChatService] Error details:', errorData.details);
          }
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText.substring(0, 200);
          } catch {}
        }

        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        }

        // Cohere/OpenRouter compatibility enforcement: hard-disable on known provider incompatibility.
        if (
          isModelInScope(providerModelId) &&
          provider === 'cohere' &&
          /invalid request to cohere/i.test(errorMessage)
        ) {
          useModelDisableStore
            .getState()
            .disableModel(providerModelId, 'OpenRouter reports Cohere provider incompatibility (Invalid request to cohere)');
          callbacks.onError(`${errorMessage} (model disabled)`);
          return;
        }

        callbacks.onError(errorMessage);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('Failed to initialize response stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = this.extractContent(parsed, provider);
              
              if (content) {
                fullResponse += content;
                callbacks.onChunk(content);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Treat "success with no text" as failure (ONLY for the user-specified model set)
      if (isModelInScope(providerModelId) && fullResponse.trim().length === 0) {
        useModelDisableStore
          .getState()
          .disableModel(providerModelId, 'No text output returned (API call succeeded but produced no visible text)');
        callbacks.onError('Model returned no visible text output and has been disabled.');
        return;
      }

      const latency = Date.now() - startTime;
      const meta: MessageMeta = {
        tokens: Math.floor(fullResponse.length / 4),
        model: resolvedModelId,
        latency_ms: latency,
      };

      callbacks.onComplete(fullResponse, meta);

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          callbacks.onComplete(fullResponse, {
            model: resolvedModelId,
            latency_ms: Date.now() - startTime,
          });
          return;
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          callbacks.onError('Network error - please check your internet connection and try again.');
        } else if (error.message.includes('timeout')) {
          callbacks.onError('Request timed out. The server may be busy, please try again.');
        } else {
          callbacks.onError(`Error: ${error.message}`);
        }
      } else {
        callbacks.onError('An unexpected error occurred. Please try again.');
      }
      
      console.error('[ChatService] Stream error:', error);
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Handle image generation requests via proxy
   * 
   * CRITICAL: Returns markdown image that MarkdownRenderer will display.
   * The image_url from the proxy is embedded directly in markdown.
   */
  private async handleImageGeneration(
    model: ModelConfig,
    prompt: string,
    callbacks: StreamCallbacks,
    boardId?: string,
    blockId?: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      callbacks.onChunk('🎨 Generating image...\n\n');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        callbacks.onError('Not authenticated. Please log in.');
        return;
      }

      // Call image generation through proxy
      const clientRequestId = crypto.randomUUID();
      const response = await fetch(
        `${SUPABASE_FUNCTIONS_BASE_URL}/chat-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            provider: model.provider,
            model_id: model.id,
            action: 'image_generation',
            prompt,
            board_id: boardId,
            block_id: blockId,
            client_request_id: clientRequestId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const withId = errorData.request_id
          ? `${errorData.error || 'Image generation failed'} (request_id: ${errorData.request_id})`
          : (errorData.error || 'Image generation failed');
        callbacks.onError(withId);
        return;
      }

      const data = await response.json();
      
      if (data.image_url) {
        // Build response with proper markdown image syntax
        // MarkdownRenderer will render this as an actual <img> with loading states
        const imageUrl = data.image_url;
        const promptPreview = prompt.length > 100 ? prompt.substring(0, 97) + '...' : prompt;
        
        const imageMarkdown = `![Generated Image](${imageUrl})

*Image generated based on your prompt.*

${model.name} · ${((Date.now() - startTime) / 1000).toFixed(1)}s`;

        callbacks.onComplete(imageMarkdown, {
          model: model.id,
          latency_ms: Date.now() - startTime,
        });
      } else {
        callbacks.onError('No image was returned from the API. Please try again.');
      }
    } catch (error) {
      console.error('[ChatService] Image generation error:', error);
      callbacks.onError(error instanceof Error ? error.message : 'Image generation failed');
    }
  }

  /**
   * Handle video generation requests via proxy
   * 
   * CRITICAL: Returns markdown with video link that MarkdownRenderer will display.
   */
  private async handleVideoGeneration(
    model: ModelConfig,
    prompt: string,
    callbacks: StreamCallbacks,
    boardId?: string,
    blockId?: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      callbacks.onChunk('🎬 Generating video... This may take a few minutes.\n\n');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        callbacks.onError('Not authenticated. Please log in.');
        return;
      }

      const clientRequestId = crypto.randomUUID();
      const response = await fetch(
        `${SUPABASE_FUNCTIONS_BASE_URL}/chat-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            provider: model.provider,
            model_id: model.id,
            action: 'video_generation',
            prompt,
            board_id: boardId,
            block_id: blockId,
            client_request_id: clientRequestId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const withId = errorData.request_id
          ? `${errorData.error || 'Video generation failed'} (request_id: ${errorData.request_id})`
          : (errorData.error || 'Video generation failed');
        callbacks.onError(withId);
        return;
      }

      const data = await response.json();
      
      if (data.video_url) {
        // Build response with video link that MarkdownRenderer will handle
        const videoMessage = `🎬 **Video Generated Successfully!**

[▶️ Play Video](${data.video_url})

*${model.name} · ${((Date.now() - startTime) / 1000).toFixed(1)}s*`;

        callbacks.onComplete(videoMessage, {
          model: model.id,
          latency_ms: Date.now() - startTime,
        });
      } else {
        callbacks.onError('No video was returned from the API. Please try again.');
      }
    } catch (error) {
      console.error('[ChatService] Video generation error:', error);
      callbacks.onError(error instanceof Error ? error.message : 'Video generation failed');
    }
  }

  /**
   * Format messages with attachments for multi-modal support
   */
  private formatMessagesWithAttachments(
    messages: ChatMessage[],
    attachments: ChatAttachment[] | undefined,
    provider: Provider
  ): ChatMessage[] {
    if (!attachments || attachments.length === 0) {
      return messages;
    }

    const formattedMessages = [...messages];
    let lastUserMessageIndex = -1;
    for (let i = formattedMessages.length - 1; i >= 0; i--) {
      if (formattedMessages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) {
      return messages;
    }

    const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
    const otherAttachments = attachments.filter(a => !a.type.startsWith('image/'));

    const lastMessage = formattedMessages[lastUserMessageIndex];
    const textContent = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : lastMessage.content.find(c => c.type === 'text')?.text || '';

    // For non-image files, embed text-based content directly (all providers).
    // For PDFs, only Gemini can ingest as inlineData; other providers get a note.
    let enhancedText = textContent;
    for (const file of otherAttachments) {
      const isTextLike =
        file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        file.type === 'text/csv' ||
        file.type === 'text/markdown';
      const isPdf = file.type === 'application/pdf';

      if (isTextLike && file.content) {
        enhancedText += `\n\n[File: ${file.name}]\n\n\`\`\`\n${file.content}\n\`\`\``;
      } else if (isPdf) {
        enhancedText += `\n\n[Attached PDF: ${file.name}]`;
      } else {
        enhancedText += `\n\n[Attached file: ${file.name} (${file.type})]`;
      }
    }

    // Format for vision-capable models
    const multimodalContent: MessageContent[] = [
      { type: 'text', text: enhancedText },
    ];

    for (const img of imageAttachments) {
      if (img.url) {
        multimodalContent.push({
          type: 'image_url',
          image_url: { url: img.url },
        });
      } else if (img.content) {
        multimodalContent.push({
          type: 'image_url',
          image_url: { url: `data:${img.type};base64,${img.content}` },
        });
      }
    }

    // Gemini-only: send PDFs as inlineData so the model can actually read them
    if (provider === 'google') {
      for (const file of otherAttachments) {
        if (file.type === 'application/pdf' && file.content) {
          multimodalContent.push({
            type: 'file',
            file: { mimeType: file.type, data: file.content, name: file.name },
          });
        }
      }
    }

    formattedMessages[lastUserMessageIndex] = {
      ...lastMessage,
      content: multimodalContent,
    };

    return formattedMessages;
  }

  /**
   * Extract content from streaming response based on provider format
   * Supports both direct provider responses AND OpenRouter responses
   */
  private extractContent(parsed: any, provider: Provider): string {
    // 1) OpenAI / OpenRouter Chat Completions streaming
    const delta = parsed?.choices?.[0]?.delta;
    if (delta) {
      // Some providers use different delta fields via OpenRouter
      if (delta.content !== undefined) return delta.content || '';
      if (delta.text !== undefined) return delta.text || '';
      if (delta.reasoning !== undefined) return delta.reasoning || '';
    }

    // 2) OpenAI / OpenRouter Chat Completions non-stream
    const msg = parsed?.choices?.[0]?.message;
    if (msg?.content !== undefined) return msg.content || '';

    // 3) OpenAI Responses-style streaming events (and OpenRouter normalized events)
    // Examples: { type: 'response.output_text.delta', delta: '...' }
    if (typeof parsed?.type === 'string' && typeof parsed?.delta === 'string') {
      if (parsed.type.includes('output_text') && parsed.type.endsWith('.delta')) {
        return parsed.delta;
      }
      // Generic delta events (best-effort)
      if (parsed.type.endsWith('.delta')) {
        return parsed.delta;
      }
    }

    // 4) OpenAI Responses-style final payload (best-effort)
    // { response: { output: [{ type: 'message', content: [{ type: 'output_text', text: '...' }] }] } }
    const outputItems = parsed?.response?.output;
    if (Array.isArray(outputItems)) {
      const texts: string[] = [];
      for (const item of outputItems) {
        const content = item?.content;
        if (Array.isArray(content)) {
          for (const c of content) {
            if (c?.type === 'output_text' && typeof c?.text === 'string') {
              texts.push(c.text);
            }
          }
        }
      }
      if (texts.length) return texts.join('');
    }
    
    // Provider-specific formats (for direct API calls, not through OpenRouter)
    switch (provider) {
      case 'anthropic':
        if (parsed.type === 'content_block_delta') {
          return parsed.delta?.text || '';
        }
        return '';
      
      case 'google':
        // Google Gemini SSE format: candidates[0].content.parts[0].text
        const parts = parsed.candidates?.[0]?.content?.parts;
        if (parts && Array.isArray(parts)) {
          return parts.map((p: any) => p.text || '').join('');
        }
        return '';
      
      case 'cohere':
        return parsed.text || '';
      
      default:
        // Fallback for any other format
        return '';
    }
  }
}

export const chatService = new ChatService();

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

// Lovable does not reliably expose VITE_* env vars on the client; use the project ref URL directly.
const SUPABASE_FUNCTIONS_BASE_URL = "https://dpeljwqtkjjkriobkhtj.supabase.co/functions/v1";


export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
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
// MODEL ID MAPPINGS - Internal ID → API ID
// ============================================
const getProviderModelId = (modelId: string, provider: Provider): string => {
  const mappings: Record<string, string> = {
    // ========================================
    // OPENAI
    // ========================================
    'gpt-5.2': 'gpt-4o',  // Map to best available
    'gpt-5.2-pro': 'gpt-4o',
    'gpt-5': 'gpt-4o',
    'gpt-5-mini': 'gpt-4o-mini',
    'gpt-5-nano': 'gpt-4o-mini',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4-turbo',
    'o3-pro': 'o3',  // Map to available o-series
    'o3-deep-research': 'o3',
    'gpt-4o-audio': 'gpt-4o-audio-preview',
    'whisper': 'whisper-1',
    'gpt-image-1.5': 'gpt-image-1',
    'sora-2-pro': 'sora',

    // ========================================
    // ANTHROPIC
    // ========================================
    'claude-opus-4.5': 'claude-sonnet-4-20250514',
    'claude-sonnet-4.5': 'claude-sonnet-4-20250514',
    'claude-haiku-4.5': 'claude-3-5-haiku-20241022',
    'claude-opus-4.1': 'claude-sonnet-4-20250514',
    'claude-sonnet-4': 'claude-sonnet-4-20250514',

    // ========================================
    // GOOGLE
    // ========================================
    'gemini-3-pro': 'gemini-2.5-pro-preview-06-05',
    'gemini-3-flash': 'gemini-2.5-flash-preview-05-20',
    'gemini-3-nano': 'gemini-2.0-flash-lite',
    'gemini-2.5-pro': 'gemini-2.5-pro-preview-06-05',
    'gemini-2.5-flash': 'gemini-2.5-flash-preview-05-20',
    'gemini-live-2.5-flash': 'gemini-2.0-flash-live-001',
    'nano-banana-pro': 'imagen-3.0-generate-002',
    'veo-3.1': 'veo-2.0-generate-001',

    // ========================================
    // XAI
    // ========================================
    'grok-4.1-fast': 'grok-3',
    'grok-4.1-fast-reasoning': 'grok-3',
    'grok-4.1-fast-non-reasoning': 'grok-3-fast',
    'grok-code-fast-1': 'grok-3',
    'grok-4-fast-reasoning': 'grok-3',
    'grok-4-fast-non-reasoning': 'grok-3-fast',
    'grok-4.0709': 'grok-3',
    'grok-imagine-image': 'grok-2-image',
    'grok-imagine-video': 'grok-2-image',

    // ========================================
    // DEEPSEEK
    // ========================================
    'deepseek-v3.2': 'deepseek-chat',
    'deepseek-v3.2-speciale': 'deepseek-reasoner',
    'deepseek-v3.1': 'deepseek-chat',

    // ========================================
    // MISTRAL
    // ========================================
    'mistral-large-3': 'mistral-large-latest',
    'mistral-medium-3.1': 'mistral-medium-latest',
    'mistral-small-3.2': 'mistral-small-latest',
    'ministral-3-14b': 'ministral-8b-latest',
    'ministral-3-8b': 'ministral-8b-latest',
    'ministral-3-3b': 'ministral-3b-latest',
    'magistral-medium-1.2': 'magistral-medium-latest',
    'magistral-small-1.2': 'magistral-small-latest',
    'codestral': 'codestral-latest',
    'voxtral-small': 'mistral-small-latest',
    'voxtral-mini': 'ministral-3b-latest',
    'mistral-nemo-12b': 'open-mistral-nemo',
    'mistral-embed': 'mistral-embed',
    'mistral-gan': 'pixtral-large-latest',

    // ========================================
    // TOGETHER.AI
    // ========================================
    'llama-3.3-70b-instruct-turbo': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'llama-4-maverick-17bx128e': 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    'llama-4-scout-17bx16e': 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    'qwen3-235b-a22b-instruct': 'Qwen/Qwen3-235B-A22B-fp8-tput',
    'deepseek-v3.1-together': 'deepseek-ai/DeepSeek-V3',
    'flux-together': 'black-forest-labs/FLUX.1-schnell-Free',
    'stable-video-together': 'stabilityai/stable-video-diffusion-img2vid-xt-1-1',

    // ========================================
    // COHERE
    // ========================================
    'command-a-03-2025': 'command-a-03-2025',
    'command-a-reasoning-08-2025': 'command-r-plus-08-2024',
    'command-a-vision-07-2025': 'command-r-plus-08-2024',
    'command-a-translate-08-2025': 'command-r-08-2024',
    'command-r-plus-08-2024': 'command-r-plus-08-2024',
    'embed-v4.0': 'embed-v4.0',
    'embed-english-v3.0': 'embed-english-v3.0',
    'embed-multilingual-v3.0': 'embed-multilingual-v3.0',
    'rerank-v4.0-pro': 'rerank-v3.5',
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
  return mappings[modelId] || modelId;
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
   */
  buildConversationHistory(
    messages: Message[],
    modelId: string,
    systemPrompt?: string,
    sourceContext?: string,
    incomingBlockContext?: string
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        callbacks.onError(errorData.error || 'Image generation failed');
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        callbacks.onError(errorData.error || 'Video generation failed');
        return;
      }

      const data = await response.json();
      
      if (data.video_url) {
        // Build response with video that MarkdownRenderer will render as inline player
        // Use markdown image syntax with video URL - MarkdownRenderer detects .mp4 and shows VideoPreview
        const videoUrl = data.video_url;
        const duration = data.duration || '?';
        
        const videoMarkdown = `![Generated Video](${videoUrl})

🎬 **Video Generated Successfully!**

*Duration: ${duration}s · ${model.name} · ${((Date.now() - startTime) / 1000).toFixed(1)}s generation time*`;

        callbacks.onComplete(videoMarkdown, {
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
    
    if (imageAttachments.length === 0) {
      return messages;
    }

    const lastMessage = formattedMessages[lastUserMessageIndex];
    const textContent = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : lastMessage.content.find(c => c.type === 'text')?.text || '';

    // Format for vision-capable models
    const multimodalContent: MessageContent[] = [
      { type: 'text', text: textContent },
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

    formattedMessages[lastUserMessageIndex] = {
      ...lastMessage,
      content: multimodalContent,
    };

    return formattedMessages;
  }

  /**
   * Extract content from streaming response based on provider format
   */
  private extractContent(parsed: any, provider: Provider): string {
    switch (provider) {
      case 'anthropic':
        if (parsed.type === 'content_block_delta') {
          return parsed.delta?.text || '';
        }
        return '';
      
      case 'cohere':
        return parsed.text || '';
      
      case 'openai':
      case 'xai':
      case 'deepseek':
      case 'mistral':
      case 'together':
      case 'perplexity':
      default:
        return parsed.choices?.[0]?.delta?.content || '';
    }
  }
}

export const chatService = new ChatService();

// Secure Chat Service with Streaming Support
// All API calls go through chat-proxy edge function - API keys NEVER exposed to frontend

import { supabase } from '@/integrations/supabase/client';
import { 
  getModelConfig, 
  getVisionModelForProvider,
  getImageGenModelForProvider,
  type Provider, 
  type ModelConfig 
} from '@/config/models';
import type { Message } from '@/types';

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

// Model ID mappings for each provider (internal ID -> API ID)
const getProviderModelId = (modelId: string, provider: Provider): string => {
  const mappings: Record<string, string> = {
    // OpenAI
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
    'gpt-image-1.5': 'gpt-image-1',
    'sora-2': 'sora-2',
    'sora-2-pro': 'sora-2-pro',
    'gpt-4o-audio': 'gpt-4o-audio-preview',
    'whisper': 'whisper-1',
    
    // Anthropic
    'claude-opus-4.5': 'claude-opus-4-5-20250115',
    'claude-sonnet-4.5': 'claude-sonnet-4-5-20250115',
    'claude-haiku-4.5': 'claude-haiku-4-5-20250115',
    'claude-opus-4.1': 'claude-opus-4-1-20250101',
    'claude-sonnet-4': 'claude-sonnet-4-20250101',
    
    // Google
    'gemini-3-pro': 'gemini-3-pro',
    'gemini-3-flash': 'gemini-3-flash',
    'gemini-3-nano': 'gemini-3-nano',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-live-2.5-flash': 'gemini-live-2.5-flash',
    'imagen-4.0-ultra': 'imagen-4.0-ultra',
    'imagen-3': 'imagen-3',
    'veo-3.1': 'veo-3.1',
    'veo-3.1-fast': 'veo-3.1-fast',
    
    // xAI
    'grok-4.1-fast': 'grok-4.1-fast',
    'grok-4.1-fast-reasoning': 'grok-4.1-fast-reasoning',
    'grok-4.1-fast-non-reasoning': 'grok-4.1-fast-non-reasoning',
    'grok-4-fast-reasoning': 'grok-4-fast-reasoning',
    'grok-4-fast-non-reasoning': 'grok-4-fast-non-reasoning',
    'grok-4.0709': 'grok-4.0709',
    'grok-code-fast-1': 'grok-code-fast-1',
    
    // DeepSeek
    'deepseek-v3.2': 'deepseek-chat',
    'deepseek-v3.2-speciale': 'deepseek-chat',
    'deepseek-v3.1': 'deepseek-chat',
    
    // Mistral
    'mistral-large-3': 'mistral-large-latest',
    'mistral-medium-3.1': 'mistral-medium-latest',
    'mistral-small-3.2': 'mistral-small-latest',
    'ministral-3-14b': 'ministral-3b-latest',
    'ministral-3-8b': 'ministral-8b-latest',
    'ministral-3-3b': 'ministral-3b-latest',
    'magistral-medium-1.2': 'magistral-medium-latest',
    'magistral-small-1.2': 'magistral-small-latest',
    'mistral-nemo-12b': 'open-mistral-nemo',
    'pixtral-large': 'pixtral-large-latest',
    'codestral': 'codestral-latest',
    'voxtral-small': 'voxtral-small-latest',
    'voxtral-mini': 'voxtral-mini-latest',
    'mistral-embed': 'mistral-embed',
    
    // Cohere
    'command-a-03-2025': 'command-a-03-2025',
    'command-a-reasoning-08-2025': 'command-a-reasoning-08-2025',
    'command-r-plus-08-2024': 'command-r-plus-08-2024',
    'command-a-vision-07-2025': 'command-a-vision-07-2025',
    'c4ai-aya-vision-32b': 'c4ai-aya-vision-32b',
    'embed-v4.0': 'embed-v4.0',
    'embed-english-v3.0': 'embed-english-v3.0',
    'embed-multilingual-v3.0': 'embed-multilingual-v3.0',
    'rerank-v4.0-pro': 'rerank-v4.0',
    'c4ai-aya-expanse-32b': 'c4ai-aya-expanse-32b',
    
    // Together.ai
    'llama-3.3-70b-instruct-turbo': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'llama-4-maverick-17bx128e': 'meta-llama/Llama-4-Maverick-17Bx128E',
    'llama-4-scout-17bx16e': 'meta-llama/Llama-4-Scout-17Bx16E',
    'qwen3-235b-a22b-instruct': 'Qwen/Qwen3-235B-A22B-Instruct',
    'deepseek-v3.1-together': 'deepseek-ai/DeepSeek-V3.1',
    'flux-schnell-turbo': 'black-forest-labs/FLUX.1-schnell-Turbo',
    'flux-1-dev': 'black-forest-labs/FLUX.1-dev',
    'flux-1.1-pro': 'black-forest-labs/FLUX.1.1-pro',
    'flux-1-kontext-pro': 'black-forest-labs/FLUX.1-Kontext-pro',
    'flux-2-pro': 'black-forest-labs/FLUX.2-pro',
    'imagen-4.0-ultra-together': 'google/imagen-4.0-ultra',
    'veo-3.0': 'google/veo-3.0',
    'veo-3.0-fast-audio': 'google/veo-3.0-fast-audio',
    'kling-2.1-pro': 'kuaishou/kling-2.1-pro',
    'sora-2-pro-together': 'openai/sora-2-pro',
    
    // Perplexity
    'sonar-large-online': 'sonar-pro',
    'pplx-70b': 'llama-3.1-sonar-large-128k-online',
    'gpt-5.1-pplx': 'gpt-5.1',
    'claude-sonnet-4.5-pplx': 'claude-sonnet-4.5',
    'claude-opus-4.1-thinking-pplx': 'claude-opus-4.1-thinking',
    'gemini-3-pro-pplx': 'gemini-3-pro',
    'grok-4.1-pplx': 'grok-4.1',
    'kimi-k2-pplx': 'kimi-k2',
    'o3-pro-pplx': 'o3-pro',
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
   */
  async streamChat(
    modelId: string,
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    config?: { temperature?: number; maxTokens?: number },
    attachments?: ChatAttachment[]
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

    // Handle image generation separately
    if (modelConfig.supports_image_generation) {
      await this.handleImageGeneration(modelConfig, messageContent, callbacks);
      return;
    }

    // Handle video generation separately
    if (modelConfig.supports_video_generation) {
      await this.handleVideoGeneration(modelConfig, messageContent, callbacks);
      return;
    }

    this.abortController = new AbortController();
    const startTime = Date.now();
    let fullResponse = '';

    try {
      // Format messages with attachments for the proxy
      const formattedMessages = this.formatMessagesWithAttachments(messages, attachments, provider);

      // Get session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        callbacks.onError('Not authenticated. Please log in.');
        return;
      }

      // Call chat-proxy edge function - API key decryption happens server-side
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
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
          }),
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;
        
        try {
          const errorData = await response.json();
          // Use the detailed error from the proxy
          errorMessage = errorData.error || errorMessage;
          
          // Log additional details for debugging
          if (errorData.details) {
            console.error('[ChatService] Error details:', errorData.details);
          }
        } catch {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText.substring(0, 200); // Limit length
            }
          } catch {}
        }

        // Handle specific HTTP status codes with user-friendly messages
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 400 && errorMessage.includes('No valid API key')) {
          // This is already a good message from the proxy
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
   */
  private async handleImageGeneration(
    model: ModelConfig,
    prompt: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      callbacks.onChunk('Generating image...\n\n');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        callbacks.onError('Not authenticated. Please log in.');
        return;
      }

      // Call image generation through proxy
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-proxy`,
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        callbacks.onError(errorData.error || `Image generation failed (${response.status})`);
        return;
      }

      const data = await response.json();
      const imageUrl = data.image_url;

      if (imageUrl) {
        const fullResponse = `![Generated Image](${imageUrl})\n\n*Image generated based on your prompt.*`;
        callbacks.onComplete(fullResponse, {
          model: model.id,
          latency_ms: Date.now() - startTime,
        });
      } else {
        callbacks.onError('No image was generated');
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error.message : 'Image generation failed');
    }
  }

  /**
   * Handle video generation requests via proxy
   */
  private async handleVideoGeneration(
    model: ModelConfig,
    prompt: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      callbacks.onChunk('Generating video... This may take a few minutes.\n\n');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        callbacks.onError('Not authenticated. Please log in.');
        return;
      }

      // Call video generation through proxy
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-proxy`,
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        callbacks.onError(errorData.error || `Video generation failed (${response.status})`);
        return;
      }

      const data = await response.json();
      const videoUrl = data.video_url;

      if (videoUrl) {
        const fullResponse = `🎬 [Video Generated](${videoUrl})\n\n*Video generated based on your prompt.*`;
        callbacks.onComplete(fullResponse, {
          model: model.id,
          latency_ms: Date.now() - startTime,
        });
      } else {
        callbacks.onError('No video was generated');
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error.message : 'Video generation failed');
    }
  }

  private formatMessagesWithAttachments(
    messages: ChatMessage[],
    attachments: ChatAttachment[] | undefined,
    provider: Provider
  ): any[] {
    if (!attachments?.length) {
      return messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : '',
      }));
    }

    return messages.map((m, idx) => {
      if (m.role === 'user' && idx === messages.length - 1) {
        const content: any[] = [
          { type: 'text', text: typeof m.content === 'string' ? m.content : '' }
        ];

        attachments.filter(a => a.type.startsWith('image/')).forEach(att => {
          if (att.content) {
            if (provider === 'anthropic') {
              content.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: att.type,
                  data: att.content.replace(/^data:image\/\w+;base64,/, ''),
                },
              });
            } else {
              content.push({
                type: 'image_url',
                image_url: {
                  url: att.content.startsWith('data:') ? att.content : `data:${att.type};base64,${att.content}`,
                },
              });
            }
          }
        });

        return { role: m.role, content };
      }

      return {
        role: m.role,
        content: typeof m.content === 'string' ? m.content : '',
      };
    });
  }

  /**
   * Extract content from streaming response based on provider format
   */
  private extractContent(parsed: any, provider: Provider): string | null {
    if (provider === 'anthropic') {
      if (parsed.type === 'content_block_delta') {
        return parsed.delta?.text || null;
      }
      return null;
    }
    
    if (provider === 'google') {
      return parsed.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    
    // OpenAI-compatible format (openai, xai, deepseek, mistral, together, perplexity)
    return parsed.choices?.[0]?.delta?.content || null;
  }
}

export const chatService = new ChatService();

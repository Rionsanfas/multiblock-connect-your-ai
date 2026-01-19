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

// Model ID mappings for each provider (internal ID -> API ID)
const getProviderModelId = (modelId: string, provider: Provider): string => {
  const mappings: Record<string, string> = {
    // OpenAI (actual Chat Completions API models)
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4-turbo',
    'dall-e-3': 'dall-e-3',
    'gpt-4o-audio': 'gpt-4o-audio-preview',
    'whisper': 'whisper-1',

    // Anthropic (real model IDs)
    'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307',
    
    // Google (real model IDs)
    'gemini-1.5-pro': 'gemini-1.5-pro-latest',
    'gemini-1.5-flash': 'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b': 'gemini-1.5-flash-8b-latest',
    'gemini-2.0-flash': 'gemini-2.0-flash-exp',

    
    // xAI (real Grok model IDs)
    'grok-2': 'grok-2-1212',
    'grok-2-mini': 'grok-2-mini-1212',
    'grok-beta': 'grok-beta',

    
    // DeepSeek (real model IDs)
    'deepseek-chat': 'deepseek-chat',
    'deepseek-reasoner': 'deepseek-reasoner',
    
    // Mistral (real model IDs)
    'mistral-large': 'mistral-large-latest',
    'mistral-small': 'mistral-small-latest',
    'mistral-nemo': 'open-mistral-nemo',
    'codestral': 'codestral-latest',
    'pixtral-large': 'pixtral-large-latest',

    
    // Cohere (real model IDs)
    'command-r-plus': 'command-r-plus',
    'command-r': 'command-r',
    'command-light': 'command-light',

    
    // Together.ai (real model IDs)
    'llama-3.3-70b-instruct-turbo': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'flux-schnell-turbo': 'black-forest-labs/FLUX.1-schnell-Turbo',
    
    // Perplexity (real model IDs)
    'sonar-large-online': 'sonar-pro',
    'sonar-small-online': 'sonar',
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
    boardId?: string
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

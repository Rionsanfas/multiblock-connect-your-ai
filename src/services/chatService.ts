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
    'gpt-5': 'gpt-5',
    'gpt-5-mini': 'gpt-5-mini',
    'gpt-4.1': 'gpt-4.1',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4-turbo',
    'gpt-image-1': 'gpt-image-1',
    'dall-e-3': 'dall-e-3',
    'o1-preview': 'o1-preview',
    'o1-mini': 'o1-mini',
    // Anthropic
    'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307',
    // Google
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-1.5-flash': 'gemini-1.5-flash',
    // xAI
    'grok-3': 'grok-3',
    'grok-2': 'grok-2',
    'grok-vision': 'grok-vision-beta',
    // DeepSeek
    'deepseek-chat': 'deepseek-chat',
    'deepseek-coder': 'deepseek-coder',
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
      callbacks.onError(`Unknown model: ${modelId}`);
      return;
    }

    const provider = modelConfig.provider;
    const providerModelId = getProviderModelId(resolvedModelId, provider);

    // Handle image generation separately (still needs direct call for now)
    if (modelConfig.supports_image_generation) {
      await this.handleImageGeneration(modelConfig, messageContent, callbacks);
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
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `API request failed (${response.status})`;

        if (response.status === 401) {
          errorMessage = 'Not authenticated. Please log in again.';
        } else if (response.status === 400 && errorMessage.includes('No valid API key')) {
          errorMessage = `No valid API key for ${provider}. Please add your API key in Settings > API Keys.`;
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
          callbacks.onError('Network error - check your internet connection');
        } else {
          callbacks.onError(`Error: ${error.message}`);
        }
      } else {
        callbacks.onError('An unexpected error occurred');
      }
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

  private extractContent(parsed: any, provider: Provider): string {
    switch (provider) {
      case 'anthropic':
        if (parsed.type === 'content_block_delta') {
          return parsed.delta?.text || '';
        }
        return '';
      case 'google':
        return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
      default:
        return parsed.choices?.[0]?.delta?.content || '';
    }
  }
}

export const chatService = new ChatService();

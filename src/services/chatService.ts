// Real Chat Service with Streaming Support
// Uses encrypted API keys via edge function - NEVER exposes raw keys to frontend

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

// Provider-specific API endpoints
const PROVIDER_ENDPOINTS: Record<Provider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  xai: 'https://api.x.ai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
};

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
   * Get decrypted API key for a provider from edge function
   * NEVER stores or exposes raw keys on frontend
   */
  private async getDecryptedApiKey(provider: Provider): Promise<string | null> {
    console.log('[ChatService] Requesting decrypted key for provider:', provider);
    
    const { data, error } = await supabase.functions.invoke('encrypt-api-key', {
      body: { action: 'decrypt', provider },
    });

    if (error) {
      console.error('[ChatService] Failed to get API key:', error);
      return null;
    }

    if (!data?.api_key) {
      console.warn('[ChatService] No API key found for provider:', provider);
      return null;
    }

    console.log('[ChatService] Successfully retrieved decrypted key for:', provider);
    return data.api_key;
  }

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
   * Stream chat completion - REAL API CALLS with encrypted keys
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
    
    // Get decrypted API key from edge function
    const apiKey = await this.getDecryptedApiKey(provider);

    if (!apiKey) {
      callbacks.onError(`No valid API key for ${provider}. Please add your API key in Settings > API Keys.`);
      return;
    }

    // Handle image generation separately
    if (modelConfig.supports_image_generation) {
      await this.handleImageGeneration(modelConfig, messageContent, apiKey, callbacks);
      return;
    }

    this.abortController = new AbortController();
    const startTime = Date.now();
    let fullResponse = '';

    try {
      const response = await this.callProviderAPI(
        provider,
        resolvedModelId,
        messages,
        apiKey,
        config,
        this.abortController.signal,
        attachments
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed (${response.status})`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }

        if (response.status === 401) {
          errorMessage = `Invalid API key for ${provider} - please check your credentials in Settings > API Keys`;
        } else if (response.status === 403) {
          errorMessage = `Access denied by ${provider} - your API key may lack required permissions`;
        } else if (response.status === 429) {
          errorMessage = `Rate limit exceeded on ${provider} - please try again in a few moments`;
        } else if (response.status === 402) {
          errorMessage = `Insufficient credits on ${provider} - please add funds to your provider account`;
        } else if (response.status === 500 || response.status === 502 || response.status === 503) {
          errorMessage = `${provider} service is temporarily unavailable - please try again`;
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
          callbacks.onError(`Network error connecting to ${provider} - check your internet connection`);
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
   * Handle image generation requests
   */
  private async handleImageGeneration(
    model: ModelConfig,
    prompt: string,
    apiKey: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      callbacks.onChunk('Generating image...\n\n');
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model.id === 'dall-e-3' ? 'dall-e-3' : 'gpt-image-1',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        callbacks.onError(errorData.error?.message || `Image generation failed (${response.status})`);
        return;
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

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

  private async callProviderAPI(
    provider: Provider,
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal,
    attachments?: ChatAttachment[]
  ): Promise<Response> {
    const providerModelId = getProviderModelId(modelId, provider);

    switch (provider) {
      case 'anthropic':
        return this.callAnthropicAPI(providerModelId, messages, apiKey, config, signal, attachments);
      case 'google':
        return this.callGoogleAPI(providerModelId, messages, apiKey, config, signal);
      default:
        return this.callOpenAICompatibleAPI(
          provider,
          providerModelId,
          messages,
          apiKey,
          config,
          signal,
          attachments
        );
    }
  }

  private async callOpenAICompatibleAPI(
    provider: Provider,
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal,
    attachments?: ChatAttachment[]
  ): Promise<Response> {
    const endpoint = PROVIDER_ENDPOINTS[provider];
    const formattedMessages = this.formatMessagesWithAttachments(messages, attachments, provider);

    // OpenAI "new" models (GPT-5, GPT-4.1, o-series) do NOT support `temperature`
    // and require `max_completion_tokens` instead of `max_tokens`.
    const isOpenAIProvider = provider === 'openai';
    const isOpenAINewerModel =
      /^gpt-5(?!-image)/.test(modelId) ||
      modelId.startsWith('gpt-4.1') ||
      modelId.startsWith('o1') ||
      modelId.startsWith('o3') ||
      modelId.startsWith('o4');

    const body: Record<string, unknown> = {
      model: modelId,
      messages: formattedMessages,
      stream: true,
    };

    const maxTokens = config?.maxTokens ?? 2048;
    if (isOpenAIProvider && isOpenAINewerModel) {
      body.max_completion_tokens = maxTokens;
      // Do not include temperature (OpenAI will reject it for these models)
    } else {
      body.max_tokens = maxTokens;
      body.temperature = config?.temperature ?? 0.7;
    }

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  }

  private async callAnthropicAPI(
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal,
    attachments?: ChatAttachment[]
  ): Promise<Response> {
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const formattedMessages = nonSystemMessages.map(m => {
      if (m.role === 'user' && attachments?.length) {
        const content: any[] = [];
        
        attachments.filter(a => a.type.startsWith('image/')).forEach(att => {
          if (att.content) {
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: att.type,
                data: att.content.replace(/^data:image\/\w+;base64,/, ''),
              },
            });
          }
        });
        
        content.push({ type: 'text', text: typeof m.content === 'string' ? m.content : '' });
        
        return { role: m.role, content };
      }
      
      return {
        role: m.role,
        content: typeof m.content === 'string' ? m.content : '',
      };
    });

    return fetch(PROVIDER_ENDPOINTS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: modelId,
        system: typeof systemMessage?.content === 'string' ? systemMessage.content : '',
        messages: formattedMessages,
        stream: true,
        max_tokens: config?.maxTokens ?? 2048,
        temperature: config?.temperature ?? 0.7,
      }),
      signal,
    });
  }

  private async callGoogleAPI(
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal
  ): Promise<Response> {
    const endpoint = `${PROVIDER_ENDPOINTS.google}/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : '' }],
      }));

    const systemInstruction = messages.find(m => m.role === 'system');

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { 
          parts: [{ text: typeof systemInstruction.content === 'string' ? systemInstruction.content : '' }] 
        } : undefined,
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
          maxOutputTokens: config?.maxTokens ?? 2048,
        },
      }),
      signal,
    });
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
            content.push({
              type: 'image_url',
              image_url: {
                url: att.content.startsWith('data:') ? att.content : `data:${att.type};base64,${att.content}`,
              },
            });
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

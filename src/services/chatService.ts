// Real Chat Service with Streaming Support
import { useAppStore } from '@/store/useAppStore';
import { getModelConfig, type Provider, type Message } from '@/types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // Base64 or text content
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
  cohere: 'https://api.cohere.ai/v1/chat',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  xai: 'https://api.x.ai/v1/chat/completions',
  meta: 'https://api.llama.meta.com/v1/chat/completions',
};

// Model ID mappings for each provider
const getProviderModelId = (modelId: string, provider: Provider): string => {
  // Map our internal model IDs to provider-specific IDs
  const mappings: Record<string, string> = {
    // OpenAI
    'gpt-5': 'gpt-5',
    'gpt-5-mini': 'gpt-5-mini',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4-turbo',
    'gpt-4': 'gpt-4',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    // Anthropic
    'claude-4-opus': 'claude-opus-4-20250514',
    'claude-4-sonnet': 'claude-sonnet-4-20250514',
    'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307',
    // Google
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-1.5-flash': 'gemini-1.5-flash',
  };
  return mappings[modelId] || modelId;
};

class ChatService {
  private abortController: AbortController | null = null;

  // Get API key for a provider - uses the stored actual key
  private getApiKey(provider: Provider): string | null {
    const { apiKeys } = useAppStore.getState();
    const apiKeyRecord = apiKeys.find(k => k.provider === provider);
    // Return the actual stored API key value
    return apiKeyRecord?.key_value || null;
  }

  // Build conversation history for API call
  buildConversationHistory(
    messages: Message[],
    systemPrompt?: string,
    sourceContext?: string
  ): ChatMessage[] {
    const history: ChatMessage[] = [];

    // Add system prompt
    if (systemPrompt || sourceContext) {
      let systemContent = systemPrompt || 'You are a helpful assistant.';
      if (sourceContext) {
        systemContent += `\n\nContext for reference:\n"${sourceContext}"`;
      }
      history.push({ role: 'system', content: systemContent });
    }

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role === 'system') continue; // Already handled
      if (msg.role === 'context') {
        // Add context as user message with clear framing
        history.push({
          role: 'user',
          content: `[Context from connected block]\n${msg.content}`,
        });
      } else {
        history.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    return history;
  }

  // Stop current generation
  stopGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Check if generation is in progress
  isGenerating(): boolean {
    return this.abortController !== null;
  }

  // Stream chat completion - REAL API CALLS ONLY
  async streamChat(
    modelId: string,
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    config?: { temperature?: number; maxTokens?: number }
  ): Promise<void> {
    const modelConfig = getModelConfig(modelId);
    if (!modelConfig) {
      callbacks.onError(`Unknown model: ${modelId}`);
      return;
    }

    const provider = modelConfig.provider;
    const apiKey = this.getApiKey(provider);

    if (!apiKey) {
      callbacks.onError(`No API key configured for ${provider}. Please add your API key in Settings > API Keys.`);
      return;
    }

    // Create new abort controller
    this.abortController = new AbortController();
    const startTime = Date.now();
    let fullResponse = '';

    try {
      const response = await this.callProviderAPI(
        provider,
        modelId,
        messages,
        apiKey,
        config,
        this.abortController.signal
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

        // Handle specific error codes with clear messages
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

      // Handle streaming response
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
              // Skip invalid JSON lines - this is normal for SSE
            }
          }
        }
      }

      const latency = Date.now() - startTime;
      const meta: MessageMeta = {
        tokens: Math.floor(fullResponse.length / 4), // Rough estimate
        model: modelId,
        latency_ms: latency,
      };

      callbacks.onComplete(fullResponse, meta);

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // User stopped generation - complete with partial response
          callbacks.onComplete(fullResponse, {
            model: modelId,
            latency_ms: Date.now() - startTime,
          });
          return;
        }
        // Network or other errors
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

  // Call provider-specific API
  private async callProviderAPI(
    provider: Provider,
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal
  ): Promise<Response> {
    const providerModelId = getProviderModelId(modelId, provider);

    switch (provider) {
      case 'anthropic':
        return this.callAnthropicAPI(providerModelId, messages, apiKey, config, signal);
      case 'google':
        return this.callGoogleAPI(providerModelId, messages, apiKey, config, signal);
      default:
        // OpenAI-compatible API (OpenAI, Mistral, Perplexity, xAI)
        return this.callOpenAICompatibleAPI(
          provider,
          providerModelId,
          messages,
          apiKey,
          config,
          signal
        );
    }
  }

  // OpenAI-compatible API call
  private async callOpenAICompatibleAPI(
    provider: Provider,
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal
  ): Promise<Response> {
    const endpoint = PROVIDER_ENDPOINTS[provider];

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: true,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 2048,
      }),
      signal,
    });
  }

  // Anthropic API call
  private async callAnthropicAPI(
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal
  ): Promise<Response> {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

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
        system: systemMessage?.content,
        messages: nonSystemMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        max_tokens: config?.maxTokens ?? 2048,
        temperature: config?.temperature ?? 0.7,
      }),
      signal,
    });
  }

  // Google Gemini API call
  private async callGoogleAPI(
    modelId: string,
    messages: ChatMessage[],
    apiKey: string,
    config?: { temperature?: number; maxTokens?: number },
    signal?: AbortSignal
  ): Promise<Response> {
    const endpoint = `${PROVIDER_ENDPOINTS.google}/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`;

    // Convert to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find(m => m.role === 'system');

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
          maxOutputTokens: config?.maxTokens ?? 2048,
        },
      }),
      signal,
    });
  }

  // Extract content from streaming response based on provider
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
        // OpenAI-compatible format
        return parsed.choices?.[0]?.delta?.content || '';
    }
  }
}

export const chatService = new ChatService();

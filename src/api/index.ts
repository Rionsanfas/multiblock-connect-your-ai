// API layer - Real Supabase integration
// All endpoints return promises with proper error handling

import { boardsDb, blocksDb, apiKeysDb, subscriptionsDb } from '@/lib/database';
import type { Board, Block, Message } from '@/types';
import type { LLMProvider } from '@/types/database.types';
import { useAppStore } from '@/store/useAppStore';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulate rate limiting for AI calls
let lastRunTime = 0;
const RATE_LIMIT_MS = 2000;

export const api = {
  // Board endpoints - Real Supabase integration
  boards: {
    // GET /api/boards - Returns only boards owned by current user
    list: async (): Promise<Board[]> => {
      const boards = await boardsDb.getAll();
      // Transform to legacy format
      return boards.map((b) => ({
        id: b.id,
        title: b.name,
        user_id: b.user_id,
        metadata: { description: b.description || undefined },
        created_at: b.created_at,
        updated_at: b.updated_at,
      }));
    },
    
    // GET /api/boards/:id - Only returns if owned by current user
    get: async (id: string): Promise<Board | null> => {
      const board = await boardsDb.getById(id);
      if (!board) return null;
      return {
        id: board.id,
        title: board.name,
        user_id: board.user_id,
        metadata: { description: board.description || undefined },
        created_at: board.created_at,
        updated_at: board.updated_at,
      };
    },
    
    // POST /api/boards - Creates board in Supabase
    create: async (title: string): Promise<Board> => {
      const board = await boardsDb.create({ name: title });
      return {
        id: board.id,
        title: board.name,
        user_id: board.user_id,
        metadata: { description: board.description || undefined },
        created_at: board.created_at,
        updated_at: board.updated_at,
      };
    },
    
    // PUT /api/boards/:id
    update: async (id: string, updates: Partial<Board>): Promise<void> => {
      await boardsDb.update(id, { 
        name: updates.title,
        description: updates.metadata?.description,
      });
    },
    
    // DELETE /api/boards/:id
    delete: async (id: string): Promise<void> => {
      await boardsDb.delete(id);
    },
    
    // POST /api/boards/:id/duplicate
    duplicate: async (id: string): Promise<Board> => {
      const original = await boardsDb.getById(id);
      if (!original) throw new Error('Board not found');
      
      const newBoard = await boardsDb.create({
        name: `${original.name} (Copy)`,
        description: original.description,
      });
      
      // TODO: Duplicate blocks and connections
      return {
        id: newBoard.id,
        title: newBoard.name,
        user_id: newBoard.user_id,
        metadata: { description: newBoard.description || undefined },
        created_at: newBoard.created_at,
        updated_at: newBoard.updated_at,
      };
    },
    
    // GET /api/boards/:id/export
    export: async (id: string): Promise<object> => {
      const board = await boardsDb.getById(id);
      const blocks = await blocksDb.getForBoard(id);
      
      return {
        board,
        blocks,
        connections: [], // TODO: Fetch from Supabase
        messages: [], // TODO: Fetch from Supabase
        exported_at: new Date().toISOString(),
      };
    },
  },
  
  // API Keys endpoints - Using secure encryption service
  keys: {
    // GET /api/keys - List all API keys for current user (display only, no raw keys)
    list: async () => {
      // Import dynamically to avoid circular deps
      const { apiKeyService } = await import('@/services/apiKeyService');
      return apiKeyService.list();
    },
    
    // POST /api/keys - Add/update an API key via encrypted edge function
    upsert: async (provider: LLMProvider, apiKey: string) => {
      const { apiKeyService } = await import('@/services/apiKeyService');
      return apiKeyService.upsert(provider, apiKey);
    },
    
    // DELETE /api/keys/:id - Delete via encrypted edge function
    delete: async (id: string) => {
      const { apiKeyService } = await import('@/services/apiKeyService');
      return apiKeyService.delete(id);
    },
    
    // GET /api/keys/:provider - Get key for provider
    getForProvider: async (provider: LLMProvider) => {
      return apiKeysDb.getForProvider(provider);
    },
    
    // POST /api/keys/test - Test if an API key is valid
    test: async (
      provider: string,
      key: string
    ): Promise<{ valid: boolean; error?: string }> => {
      await delay(1500);
      
      // Basic format validation
      if (provider === 'openai' && !key.startsWith('sk-')) {
        return { valid: false, error: 'Invalid OpenAI key format' };
      }
      if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid Anthropic key format' };
      }
      if (provider === 'google' && key.length < 20) {
        return { valid: false, error: 'Invalid Google API key format' };
      }
      if (provider === 'xai' && !key.startsWith('xai-')) {
        return { valid: false, error: 'Invalid xAI key format' };
      }
      if (provider === 'deepseek' && !key.startsWith('sk-')) {
        return { valid: false, error: 'Invalid DeepSeek key format' };
      }
      
      // For now, accept keys that pass format validation
      return { valid: true };
    },
  },
  
  // Subscription/limits endpoints
  limits: {
    // GET /api/limits - Get current user's usage limits
    get: async () => {
      return subscriptionsDb.getUsageLimits();
    },
    
    // GET /api/limits/can-create-board
    canCreateBoard: async () => {
      return subscriptionsDb.canCreateBoard();
    },
    
    // GET /api/limits/can-create-block
    canCreateBlock: async (boardId: string) => {
      return subscriptionsDb.canCreateBlock(boardId);
    },
    
    // GET /api/limits/can-send-message
    canSendMessage: async () => {
      return subscriptionsDb.canSendMessage();
    },
  },
  
  // Block endpoints - Real Supabase integration
  blocks: {
    // GET /api/boards/:boardId/blocks
    list: async (boardId: string): Promise<Block[]> => {
      const blocks = await blocksDb.getForBoard(boardId);
      // Transform to legacy format
      return blocks.map((b) => ({
        id: b.id,
        board_id: b.board_id,
        title: b.title || 'Untitled Block',
        type: 'chat' as const,
        model_id: b.model_id,
        system_prompt: b.system_prompt || '',
        config: { temperature: 0.7, max_tokens: 2048 },
        position: { x: b.position_x, y: b.position_y },
        created_at: b.created_at,
        updated_at: b.updated_at,
      }));
    },
    
    // GET /api/blocks/:id
    get: async (id: string): Promise<Block | null> => {
      const block = await blocksDb.getById(id);
      if (!block) return null;
      return {
        id: block.id,
        board_id: block.board_id,
        title: block.title || 'Untitled Block',
        type: 'chat' as const,
        model_id: block.model_id,
        system_prompt: block.system_prompt || '',
        config: { temperature: 0.7, max_tokens: 2048 },
        position: { x: block.position_x, y: block.position_y },
        created_at: block.created_at,
        updated_at: block.updated_at,
      };
    },
    
    // POST /api/boards/:boardId/blocks
    create: async (boardId: string, data: Partial<Block>): Promise<Block> => {
      // Get provider from model_id
      const { getProviderFromModel } = await import('@/config/models');
      const provider = data.model_id ? getProviderFromModel(data.model_id) : undefined;
      
      if (!provider) {
        throw new Error('Invalid model selected');
      }
      
      // Map frontend provider to Supabase enum
      const providerMap: Record<string, LLMProvider> = {
        openai: 'openai',
        anthropic: 'anthropic', 
        google: 'google',
        xai: 'xai',
        deepseek: 'deepseek',
      };
      
      const supabaseProvider = providerMap[provider];
      if (!supabaseProvider) {
        throw new Error(`Provider ${provider} is not supported for blocks`);
      }
      
      const block = await blocksDb.create({
        board_id: boardId,
        title: data.title || 'New Block',
        model_id: data.model_id || '',
        provider: supabaseProvider,
        system_prompt: data.system_prompt || 'You are a helpful assistant.',
        position_x: data.position?.x || 100,
        position_y: data.position?.y || 100,
        width: 400,
        height: 300,
      });
      
      return {
        id: block.id,
        board_id: block.board_id,
        title: block.title || 'Untitled Block',
        type: 'chat' as const,
        model_id: block.model_id,
        system_prompt: block.system_prompt || '',
        config: { temperature: 0.7, max_tokens: 2048 },
        position: { x: block.position_x, y: block.position_y },
        created_at: block.created_at,
        updated_at: block.updated_at,
      };
    },
    
    // PUT /api/blocks/:id
    update: async (id: string, updates: Partial<Block>): Promise<void> => {
      await blocksDb.update(id, {
        title: updates.title,
        system_prompt: updates.system_prompt,
        model_id: updates.model_id,
        position_x: updates.position?.x,
        position_y: updates.position?.y,
      });
    },
    
    // PUT /api/blocks/:id/position
    updatePosition: async (id: string, position: { x: number; y: number }): Promise<void> => {
      await blocksDb.update(id, {
        position_x: position.x,
        position_y: position.y,
      });
    },
    
    // DELETE /api/blocks/:id
    delete: async (id: string): Promise<void> => {
      await blocksDb.delete(id);
    },
    
    // POST /api/blocks/:id/duplicate
    duplicate: async (id: string): Promise<Block> => {
      const original = await blocksDb.getById(id);
      if (!original) throw new Error('Block not found');
      
      const block = await blocksDb.create({
        board_id: original.board_id,
        title: `${original.title} (Copy)`,
        model_id: original.model_id,
        provider: original.provider,
        system_prompt: original.system_prompt,
        position_x: original.position_x + 50,
        position_y: original.position_y + 50,
        width: original.width,
        height: original.height,
      });
      
      return {
        id: block.id,
        board_id: block.board_id,
        title: block.title || 'Untitled Block',
        type: 'chat' as const,
        model_id: block.model_id,
        system_prompt: block.system_prompt || '',
        config: { temperature: 0.7, max_tokens: 2048 },
        position: { x: block.position_x, y: block.position_y },
        created_at: block.created_at,
        updated_at: block.updated_at,
      };
    },
    
    // POST /api/blocks/run - Run AI inference (still mock for now)
    run: async (
      blockId: string,
      input: string,
      onChunk: (chunk: string) => void
    ): Promise<{ success: boolean; error?: string }> => {
      // Rate limit check
      const now = Date.now();
      if (now - lastRunTime < RATE_LIMIT_MS) {
        return { success: false, error: 'Rate limit exceeded. Please wait before running again.' };
      }
      lastRunTime = now;
      
      const { addMessage } = useAppStore.getState();
      
      const block = await blocksDb.getById(blockId);
      if (!block) {
        return { success: false, error: 'Block not found' };
      }
      
      // Add user message
      addMessage({
        block_id: blockId,
        role: 'user',
        content: input,
      });
      
      // Simulate streaming response
      const mockResponses = [
        'Based on my analysis, ',
        'I can provide several insights. ',
        'First, the key concept here involves ',
        'understanding the fundamental principles. ',
        'Additionally, it\'s worth noting that ',
        'this connects to broader themes in the field. ',
        'In conclusion, the evidence suggests ',
        'a comprehensive understanding requires ',
        'considering multiple perspectives.',
      ];
      
      let fullResponse = '';
      
      for (let i = 0; i < mockResponses.length; i++) {
        await delay(300);
        const chunk = mockResponses[i];
        fullResponse += chunk;
        onChunk(chunk);
      }
      
      // Add assistant message
      addMessage({
        block_id: blockId,
        role: 'assistant',
        content: fullResponse,
        meta: {
          tokens: Math.floor(fullResponse.length / 4),
          cost: parseFloat((fullResponse.length * 0.00001).toFixed(4)),
          model: block.model_id,
          latency_ms: mockResponses.length * 300,
        },
      });
      
      return { success: true };
    },
  },
  
  // Message endpoints (still using local store for now)
  messages: {
    // GET /api/blocks/:blockId/messages
    list: async (blockId: string): Promise<Message[]> => {
      const { messages } = useAppStore.getState();
      return messages
        .filter((m) => m.block_id === blockId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    
    // POST /api/blocks/:blockId/messages
    create: async (blockId: string, content: string, role: 'user' | 'assistant' | 'system' = 'user'): Promise<Message | null> => {
      const { addMessage } = useAppStore.getState();
      return addMessage({
        block_id: blockId,
        role,
        content,
      });
    },
    
    // DELETE /api/messages/:id
    delete: async (messageId: string): Promise<boolean> => {
      const { deleteMessage } = useAppStore.getState();
      deleteMessage(messageId);
      return true;
    },
    
    // DELETE /api/blocks/:blockId/messages - Clear all messages for a block
    clearBlock: async (blockId: string): Promise<boolean> => {
      const { messages, deleteMessage } = useAppStore.getState();
      const blockMessages = messages.filter((m) => m.block_id === blockId);
      blockMessages.forEach((m) => deleteMessage(m.id));
      return true;
    },
  },
  
  // Checkout endpoints (placeholder)
  checkout: {
    createSession: async (sku: string): Promise<{ session_id: string; checkout_url: string }> => {
      const sessionId = `cs_${Math.random().toString(36).substring(2, 15)}`;
      return {
        session_id: sessionId,
        checkout_url: `/checkout/success?session_id=${sessionId}&sku=${sku}`,
      };
    },
    
    complete: async (sessionId: string, sku: string): Promise<{ success: boolean; plan: object }> => {
      return {
        success: true,
        plan: {
          sku,
          status: 'active',
          purchased_at: new Date().toISOString(),
        },
      };
    },
  },
};

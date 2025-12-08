// Mock API layer - REPLACE WITH REAL ENDPOINTS LATER
// All endpoints return promises to simulate async behavior

import { useAppStore } from '@/store/useAppStore';
import type { Board, Block, Message, Connection } from '@/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulate rate limiting
let lastRunTime = 0;
const RATE_LIMIT_MS = 2000;

export const api = {
  // Auth endpoints
  auth: {
    // POST /api/auth/magic-link
    sendMagicLink: async (email: string): Promise<{ success: boolean }> => {
      await delay(800);
      console.log('[MOCK API] Magic link sent to:', email);
      return { success: true };
    },
    
    // GET /api/me
    getMe: async () => {
      await delay(300);
      const { user } = useAppStore.getState();
      return user;
    },
  },
  
  // Board endpoints
  boards: {
    // GET /api/boards
    list: async (): Promise<Board[]> => {
      await delay(400);
      const { boards } = useAppStore.getState();
      return boards;
    },
    
    // GET /api/boards/:id
    get: async (id: string): Promise<Board | null> => {
      await delay(300);
      const { boards } = useAppStore.getState();
      return boards.find((b) => b.id === id) || null;
    },
    
    // POST /api/boards
    create: async (title: string): Promise<Board> => {
      await delay(500);
      const { createBoard } = useAppStore.getState();
      return createBoard(title);
    },
    
    // PUT /api/boards/:id
    update: async (id: string, updates: Partial<Board>): Promise<void> => {
      await delay(400);
      const { updateBoard } = useAppStore.getState();
      updateBoard(id, updates);
    },
    
    // DELETE /api/boards/:id
    delete: async (id: string): Promise<void> => {
      await delay(400);
      const { deleteBoard } = useAppStore.getState();
      deleteBoard(id);
    },
    
    // POST /api/boards/:id/duplicate
    duplicate: async (id: string): Promise<Board> => {
      await delay(600);
      const { duplicateBoard } = useAppStore.getState();
      return duplicateBoard(id);
    },
    
    // GET /api/boards/:id/export
    export: async (id: string): Promise<object> => {
      await delay(500);
      const { boards, blocks, connections, messages } = useAppStore.getState();
      const board = boards.find((b) => b.id === id);
      const boardBlocks = blocks.filter((b) => b.board_id === id);
      const blockIds = boardBlocks.map((b) => b.id);
      const boardConnections = connections.filter(
        (c) => blockIds.includes(c.from_block) || blockIds.includes(c.to_block)
      );
      const boardMessages = messages.filter((m) => blockIds.includes(m.block_id));
      
      return {
        board,
        blocks: boardBlocks,
        connections: boardConnections,
        messages: boardMessages,
        exported_at: new Date().toISOString(),
      };
    },
  },
  
  // Block endpoints
  blocks: {
    // POST /api/blocks/run
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
      
      const { blocks, addMessage } = useAppStore.getState();
      const block = blocks.find((b) => b.id === blockId);
      
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
          model: block.model,
          latency_ms: mockResponses.length * 300,
        },
      });
      
      return { success: true };
    },
  },
  
  // API Keys endpoints
  keys: {
    // POST /api/keys/test
    test: async (
      provider: string,
      key: string
    ): Promise<{ valid: boolean; error?: string }> => {
      await delay(1500);
      
      // Mock validation - check format
      if (provider === 'openai' && !key.startsWith('sk-')) {
        return { valid: false, error: 'Invalid OpenAI key format' };
      }
      if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid Anthropic key format' };
      }
      
      // Random success/failure for demo
      const success = Math.random() > 0.2;
      if (!success) {
        return { valid: false, error: 'API key authentication failed' };
      }
      
      return { valid: true };
    },
  },
  
  // Import endpoints
  import: {
    // POST /api/import/parse
    parse: async (
      content: string,
      format: 'json' | 'txt' | 'md'
    ): Promise<{ conversations: Array<{ title: string; messages: Array<{ role: string; content: string }> }> }> => {
      await delay(1000);
      
      // Mock parsing - return sample conversations
      return {
        conversations: [
          {
            title: 'Imported Conversation 1',
            messages: [
              { role: 'user', content: 'Hello, I need help with...' },
              { role: 'assistant', content: 'Of course! I\'d be happy to help...' },
            ],
          },
          {
            title: 'Imported Conversation 2',
            messages: [
              { role: 'user', content: 'Can you explain...' },
              { role: 'assistant', content: 'Certainly! Let me break this down...' },
            ],
          },
        ],
      };
    },
  },
  
  // Checkout endpoints
  checkout: {
    // POST /api/checkout/create-session
    createSession: async (
      sku: string
    ): Promise<{ session_id: string; checkout_url: string }> => {
      await delay(800);
      
      const sessionId = `cs_${Math.random().toString(36).substring(2, 15)}`;
      
      return {
        session_id: sessionId,
        checkout_url: `/checkout/success?session_id=${sessionId}&sku=${sku}`,
      };
    },
    
    // POST /api/checkout/complete
    complete: async (
      sessionId: string,
      sku: string
    ): Promise<{ success: boolean; plan: object }> => {
      await delay(1000);
      
      const { user, setUser, ltdOffers } = useAppStore.getState();
      const offer = ltdOffers.find((o) => o.sku === sku);
      
      if (user && offer) {
        setUser({
          ...user,
          plan: sku.replace('ltd-', '') as 'solo' | 'team' | 'agency',
          boards_limit: offer.limits.boards,
        });
      }
      
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

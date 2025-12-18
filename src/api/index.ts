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
    // GET /api/boards - Returns only boards owned by current user
    list: async (): Promise<Board[]> => {
      await delay(400);
      const { boards, user } = useAppStore.getState();
      // Filter by user ownership - in production this is done by RLS
      if (!user) return [];
      return boards.filter((b) => b.user_id === user.id);
    },
    
    // GET /api/boards/:id - Only returns if owned by current user
    get: async (id: string): Promise<Board | null> => {
      await delay(300);
      const { boards, user } = useAppStore.getState();
      if (!user) return null;
      const board = boards.find((b) => b.id === id);
      // Verify ownership
      if (board && board.user_id !== user.id) return null;
      return board || null;
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
    // GET /api/boards/:boardId/blocks - Returns blocks for a board with ownership check
    list: async (boardId: string): Promise<Block[]> => {
      await delay(300);
      const { blocks, boards, user } = useAppStore.getState();
      if (!user) return [];
      
      // Verify board ownership
      const board = boards.find((b) => b.id === boardId);
      if (!board || board.user_id !== user.id) return [];
      
      return blocks.filter((b) => b.board_id === boardId);
    },
    
    // GET /api/blocks/:id - Returns block with ownership check via board
    get: async (id: string): Promise<Block | null> => {
      await delay(200);
      const { blocks, boards, user } = useAppStore.getState();
      if (!user) return null;
      
      const block = blocks.find((b) => b.id === id);
      if (!block) return null;
      
      // Verify ownership through board
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) return null;
      
      return block;
    },
    
    // POST /api/boards/:boardId/blocks
    create: async (boardId: string, data: Partial<Block>): Promise<Block> => {
      await delay(400);
      const { createBlock, boards, user } = useAppStore.getState();
      if (!user) throw new Error('Not authenticated');
      
      // Verify board ownership
      const board = boards.find((b) => b.id === boardId);
      if (!board || board.user_id !== user.id) {
        throw new Error('Board not found or access denied');
      }
      
      return createBlock(boardId, data);
    },
    
    // PUT /api/blocks/:id
    update: async (id: string, updates: Partial<Block>): Promise<void> => {
      await delay(300);
      const { updateBlock, blocks, boards, user } = useAppStore.getState();
      if (!user) throw new Error('Not authenticated');
      
      const block = blocks.find((b) => b.id === id);
      if (!block) throw new Error('Block not found');
      
      // Verify ownership through board
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) {
        throw new Error('Access denied');
      }
      
      updateBlock(id, updates);
    },
    
    // PUT /api/blocks/:id/position
    updatePosition: async (id: string, position: { x: number; y: number }): Promise<void> => {
      await delay(100); // Fast for drag operations
      const { updateBlockPosition, blocks, boards, user } = useAppStore.getState();
      if (!user) throw new Error('Not authenticated');
      
      const block = blocks.find((b) => b.id === id);
      if (!block) throw new Error('Block not found');
      
      // Verify ownership through board
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) {
        throw new Error('Access denied');
      }
      
      updateBlockPosition(id, position);
    },
    
    // DELETE /api/blocks/:id
    delete: async (id: string): Promise<void> => {
      await delay(300);
      const { deleteBlock, blocks, boards, user } = useAppStore.getState();
      if (!user) throw new Error('Not authenticated');
      
      const block = blocks.find((b) => b.id === id);
      if (!block) throw new Error('Block not found');
      
      // Verify ownership through board
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) {
        throw new Error('Access denied');
      }
      
      deleteBlock(id);
    },
    
    // POST /api/blocks/:id/duplicate
    duplicate: async (id: string): Promise<Block> => {
      await delay(400);
      const { duplicateBlock, blocks, boards, user } = useAppStore.getState();
      if (!user) throw new Error('Not authenticated');
      
      const block = blocks.find((b) => b.id === id);
      if (!block) throw new Error('Block not found');
      
      // Verify ownership through board
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) {
        throw new Error('Access denied');
      }
      
      return duplicateBlock(id);
    },
    
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
      
      const { blocks, boards, user, addMessage } = useAppStore.getState();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }
      
      const block = blocks.find((b) => b.id === blockId);
      if (!block) {
        return { success: false, error: 'Block not found' };
      }
      
      // Verify ownership through board
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) {
        return { success: false, error: 'Access denied' };
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
  
  // Message endpoints
  messages: {
    // GET /api/blocks/:blockId/messages - Returns messages for a block with ownership check
    list: async (blockId: string): Promise<Message[]> => {
      await delay(200);
      const { blocks, boards, messages, user } = useAppStore.getState();
      if (!user) return [];
      
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return [];
      
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) return [];
      
      return messages
        .filter((m) => m.block_id === blockId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    
    // POST /api/blocks/:blockId/messages
    create: async (blockId: string, content: string, role: 'user' | 'assistant' | 'system' = 'user'): Promise<Message | null> => {
      await delay(200);
      const { blocks, boards, addMessage, user } = useAppStore.getState();
      if (!user) return null;
      
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return null;
      
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) return null;
      
      return addMessage({
        block_id: blockId,
        role,
        content,
      });
    },
    
    // DELETE /api/messages/:id
    delete: async (messageId: string): Promise<boolean> => {
      await delay(200);
      const { messages, blocks, boards, deleteMessage, user } = useAppStore.getState();
      if (!user) return false;
      
      const message = messages.find((m) => m.id === messageId);
      if (!message) return false;
      
      const block = blocks.find((b) => b.id === message.block_id);
      if (!block) return false;
      
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) return false;
      
      deleteMessage(messageId);
      return true;
    },
    
    // DELETE /api/blocks/:blockId/messages - Clear all messages for a block
    clearBlock: async (blockId: string): Promise<boolean> => {
      await delay(300);
      const { blocks, boards, messages, deleteMessage, user } = useAppStore.getState();
      if (!user) return false;
      
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return false;
      
      const board = boards.find((b) => b.id === block.board_id);
      if (!board || board.user_id !== user.id) return false;
      
      const blockMessages = messages.filter((m) => m.block_id === blockId);
      blockMessages.forEach((m) => deleteMessage(m.id));
      return true;
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
        // TODO: Replace with Supabase plan update
        setUser({
          ...user,
          plan: 'pro-50', // Default to pro-50 for legacy LTD purchases
          boards_limit: offer.limits.boards,
          storage_limit_mb: 5120,
          storage_used_mb: user.storage_used_mb || 0,
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

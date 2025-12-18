import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Board, Block, Message, Connection, ApiKey, LtdOffer } from '@/types';
import { seedData, mockUser } from '@/mocks/seed';

interface AppState {
  // Auth - current user state
  user: User | null;
  isAuthenticated: boolean;
  
  // Boards - all boards (filtered by user_id in selectors)
  boards: Board[];
  currentBoard: Board | null;
  
  // Blocks - all blocks (filtered by board_id in selectors)
  blocks: Block[];
  selectedBlockId: string | null;
  
  // Messages
  messages: Message[];
  
  // Connections
  connections: Connection[];
  
  // API Keys - per user in production
  apiKeys: ApiKey[];
  
  // LTD Offers
  ltdOffers: LtdOffer[];
  
  // UI State
  isBlockChatOpen: boolean;
  chatBlockId: string | null;
  autoChainEnabled: boolean;
  snapToGrid: boolean;
  zoom: number;
  
  // Auth Actions
  setUser: (user: User | null) => void;
  login: (email: string) => void;
  logout: () => void;
  
  // Selector helpers for user-scoped data
  getUserBoards: () => Board[];
  canCreateBoard: () => boolean;
  
  // Board actions
  createBoard: (title: string) => Board;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  duplicateBoard: (id: string) => Board;
  setCurrentBoard: (board: Board | null) => void;
  
  // Block actions
  createBlock: (boardId: string, block: Partial<Block>) => Block;
  createBlockFromSelection: (params: {
    boardId: string;
    sourceBlockId: string;
    sourceMessageId: string;
    selectedText: string;
    modelId?: string;
    title?: string;
    position?: { x: number; y: number };
  }) => Block;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string, options?: { withMessages?: boolean }) => Block;
  duplicateBlockToBoard: (blockId: string, targetBoardId: string, options?: { withMessages?: boolean }) => Block;
  moveBlockToBoard: (blockId: string, targetBoardId: string) => Block;
  selectBlock: (id: string | null) => void;
  updateBlockPosition: (id: string, position: { x: number; y: number }) => void;
  
  // Message actions
  addMessage: (message: Omit<Message, 'id' | 'created_at' | 'size_bytes'>) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  
  // Connection actions
  createConnection: (connection: Omit<Connection, 'id' | 'created_at' | 'updated_at'>) => Connection;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  
  // API Key actions
  addApiKey: (key: Omit<ApiKey, 'id' | 'created_at'>) => void;
  removeApiKey: (id: string) => void;
  
  // UI actions
  openBlockChat: (blockId: string) => void;
  closeBlockChat: () => void;
  toggleAutoChain: () => void;
  toggleSnapToGrid: () => void;
  setZoom: (zoom: number) => void;
  
  // Reset
  resetMocks: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state from seed
      user: null,
      isAuthenticated: false,
      boards: seedData.boards,
      currentBoard: null,
      blocks: seedData.blocks,
      selectedBlockId: null,
      messages: seedData.messages,
      connections: seedData.connections,
      apiKeys: seedData.apiKeys,
      ltdOffers: seedData.ltdOffers,
      isBlockChatOpen: false,
      chatBlockId: null,
      autoChainEnabled: false,
      snapToGrid: true,
      zoom: 1,
      
      // Auth actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      login: (email) => {
        // Use mockUser as template but with provided email
        // This ensures consistent user ID for data ownership
        const user: User = {
          ...mockUser,
          email,
          name: email.split('@')[0],
          created_at: new Date().toISOString(),
        };
        set({ user, isAuthenticated: true });
      },
      
      logout: () => set({ user: null, isAuthenticated: false }),
      
      // Selector: Get boards owned by current user
      getUserBoards: () => {
        const state = get();
        if (!state.user) return [];
        return state.boards.filter((b) => b.user_id === state.user!.id);
      },
      
      // Selector: Check if user can create more boards
      canCreateBoard: () => {
        const state = get();
        if (!state.user) return false;
        const userBoards = state.boards.filter((b) => b.user_id === state.user!.id);
        return userBoards.length < state.user.boards_limit;
      },
      
      // Board actions
      createBoard: (title) => {
        const state = get();
        const userId = state.user?.id;
        
        if (!userId) {
          throw new Error('Cannot create board: No authenticated user');
        }
        
        const board: Board = {
          id: generateId(),
          title,
          user_id: userId, // Explicit user ownership
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((s) => ({ boards: [...s.boards, board] }));
        return board;
      },
      
      updateBoard: (id, updates) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
          ),
          currentBoard: state.currentBoard?.id === id 
            ? { ...state.currentBoard, ...updates, updated_at: new Date().toISOString() }
            : state.currentBoard,
        }));
      },
      
      deleteBoard: (id) => {
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== id),
          blocks: state.blocks.filter((b) => b.board_id !== id),
          currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
        }));
      },
      
      duplicateBoard: (id) => {
        const state = get();
        const userId = state.user?.id;
        
        if (!userId) {
          throw new Error('Cannot duplicate board: No authenticated user');
        }
        
        const original = state.boards.find((b) => b.id === id);
        if (!original) throw new Error('Board not found');
        
        // Verify ownership before duplicating
        if (original.user_id !== userId) {
          throw new Error('Cannot duplicate: Board does not belong to user');
        }
        
        const newBoard: Board = {
          ...original,
          id: generateId(),
          title: `${original.title} (Copy)`,
          user_id: userId, // Ensure new board has correct ownership
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const originalBlocks = get().blocks.filter((b) => b.board_id === id);
        const blockIdMap: Record<string, string> = {};
        
        const newBlocks = originalBlocks.map((block) => {
          const newId = generateId();
          blockIdMap[block.id] = newId;
          return { ...block, id: newId, board_id: newBoard.id };
        });
        
        const originalConnections = get().connections.filter(
          (c) => originalBlocks.some((b) => b.id === c.from_block)
        );
        
        const newConnections = originalConnections.map((conn) => ({
          ...conn,
          id: generateId(),
          from_block: blockIdMap[conn.from_block],
          to_block: blockIdMap[conn.to_block],
        }));
        
        set((state) => ({
          boards: [...state.boards, newBoard],
          blocks: [...state.blocks, ...newBlocks],
          connections: [...state.connections, ...newConnections],
        }));
        
        return newBoard;
      },
      
      setCurrentBoard: (board) => set({ currentBoard: board }),
      
      // Block actions
      createBlock: (boardId, blockData) => {
        const block: Block = {
          id: generateId(),
          board_id: boardId,
          title: blockData.title || 'New Block',
          type: blockData.type || 'chat',
          model_id: blockData.model_id || 'gpt-4o',
          system_prompt: blockData.system_prompt || 'You are a helpful assistant.',
          config: blockData.config || { temperature: 0.7, max_tokens: 2048 },
          position: blockData.position || { x: 100, y: 100 },
          source_context: blockData.source_context,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ blocks: [...state.blocks, block] }));
        return block;
      },
      
      createBlockFromSelection: (params) => {
        const { boardId, sourceBlockId, sourceMessageId, selectedText, modelId, title, position } = params;
        const state = get();
        
        const sourceBlock = state.blocks.find((b) => b.id === sourceBlockId);
        if (!sourceBlock) throw new Error('Source block not found');
        
        const block: Block = {
          id: generateId(),
          board_id: boardId,
          title: title || `From: ${sourceBlock.title}`,
          type: 'chat',
          model_id: modelId || sourceBlock.model_id,
          system_prompt: 'You are a helpful assistant. Analyze and respond based on the provided context.',
          config: { temperature: 0.7, max_tokens: 2048 },
          position: position || { x: sourceBlock.position.x + 350, y: sourceBlock.position.y },
          source_context: {
            source_block_id: sourceBlockId,
            source_block_title: sourceBlock.title,
            source_message_id: sourceMessageId,
            selected_text: selectedText,
            created_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set((state) => ({ blocks: [...state.blocks, block] }));
        return block;
      },
      
      updateBlock: (id, updates) => {
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
          ),
        }));
      },
      
      deleteBlock: (id) => {
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
          connections: state.connections.filter((c) => c.from_block !== id && c.to_block !== id),
          messages: state.messages.filter((m) => m.block_id !== id),
          selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        }));
      },
      
      duplicateBlock: (id, options = {}) => {
        const state = get();
        const original = state.blocks.find((b) => b.id === id);
        if (!original) throw new Error('Block not found');
        
        const newBlockId = generateId();
        const block: Block = {
          ...original,
          id: newBlockId,
          title: `${original.title} (Copy)`,
          position: { x: original.position.x + 50, y: original.position.y + 50 },
          source_context: undefined, // Don't copy source context
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Optionally copy messages
        let newMessages: Message[] = [];
        if (options.withMessages) {
          const originalMessages = state.messages.filter((m) => m.block_id === id);
          newMessages = originalMessages.map((m) => ({
            ...m,
            id: generateId(),
            block_id: newBlockId,
            created_at: new Date().toISOString(),
          }));
        }
        
        set((state) => ({ 
          blocks: [...state.blocks, block],
          messages: [...state.messages, ...newMessages],
        }));
        return block;
      },
      
      duplicateBlockToBoard: (blockId, targetBoardId, options = {}) => {
        const state = get();
        const original = state.blocks.find((b) => b.id === blockId);
        if (!original) throw new Error('Block not found');
        
        const targetBoard = state.boards.find((b) => b.id === targetBoardId);
        if (!targetBoard) throw new Error('Target board not found');
        
        // Verify ownership
        if (state.user && targetBoard.user_id !== state.user.id) {
          throw new Error('Cannot duplicate to board you do not own');
        }
        
        const newBlockId = generateId();
        const block: Block = {
          ...original,
          id: newBlockId,
          board_id: targetBoardId,
          title: original.board_id === targetBoardId ? `${original.title} (Copy)` : original.title,
          position: { x: 100, y: 100 }, // Reset position for new board
          source_context: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Optionally copy messages
        let newMessages: Message[] = [];
        if (options.withMessages) {
          const originalMessages = state.messages.filter((m) => m.block_id === blockId);
          newMessages = originalMessages.map((m) => ({
            ...m,
            id: generateId(),
            block_id: newBlockId,
            created_at: new Date().toISOString(),
          }));
        }
        
        set((state) => ({ 
          blocks: [...state.blocks, block],
          messages: [...state.messages, ...newMessages],
        }));
        return block;
      },
      
      moveBlockToBoard: (blockId, targetBoardId) => {
        const state = get();
        const original = state.blocks.find((b) => b.id === blockId);
        if (!original) throw new Error('Block not found');
        
        const targetBoard = state.boards.find((b) => b.id === targetBoardId);
        if (!targetBoard) throw new Error('Target board not found');
        
        // Verify ownership
        if (state.user && targetBoard.user_id !== state.user.id) {
          throw new Error('Cannot move to board you do not own');
        }
        
        // Remove connections since they won't make sense in the new board
        const blockConnections = state.connections.filter(
          (c) => c.from_block === blockId || c.to_block === blockId
        );
        
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? {
                  ...b,
                  board_id: targetBoardId,
                  position: { x: 100, y: 100 },
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
          connections: state.connections.filter(
            (c) => c.from_block !== blockId && c.to_block !== blockId
          ),
        }));
        
        return { ...original, board_id: targetBoardId };
      },
      
      selectBlock: (id) => set({ selectedBlockId: id }),
      
      updateBlockPosition: (id, position) => {
        const { snapToGrid } = get();
        const snappedPosition = snapToGrid
          ? { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 }
          : position;
        
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id 
              ? { ...b, position: snappedPosition, updated_at: new Date().toISOString() } 
              : b
          ),
        }));
      },
      
      // Message actions
      addMessage: (messageData) => {
        // Calculate size_bytes from content
        const sizeBytes = new TextEncoder().encode(messageData.content).length;
        
        const message: Message = {
          id: generateId(),
          ...messageData,
          size_bytes: sizeBytes,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ messages: [...state.messages, message] }));
        return message;
      },
      
      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },
      
      deleteMessage: (id) => {
        set((state) => ({ messages: state.messages.filter((m) => m.id !== id) }));
      },
      
      // Connection actions
      createConnection: (connData) => {
        const connection: Connection = {
          id: generateId(),
          ...connData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ connections: [...state.connections, connection] }));
        return connection;
      },
      
      updateConnection: (id, updates) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          ),
        }));
      },
      
      deleteConnection: (id) => {
        set((state) => ({ connections: state.connections.filter((c) => c.id !== id) }));
      },
      
      // API Key actions
      addApiKey: (keyData) => {
        const apiKey: ApiKey = {
          id: generateId(),
          ...keyData,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ apiKeys: [...state.apiKeys, apiKey] }));
      },
      
      removeApiKey: (id) => {
        set((state) => ({ apiKeys: state.apiKeys.filter((k) => k.id !== id) }));
      },
      
      // UI actions
      openBlockChat: (blockId) => set({ isBlockChatOpen: true, chatBlockId: blockId }),
      closeBlockChat: () => set({ isBlockChatOpen: false, chatBlockId: null }),
      toggleAutoChain: () => set((state) => ({ autoChainEnabled: !state.autoChainEnabled })),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
      
      // Reset
      resetMocks: () => {
        set({
          user: null,
          isAuthenticated: false,
          boards: seedData.boards,
          currentBoard: null,
          blocks: seedData.blocks,
          selectedBlockId: null,
          messages: seedData.messages,
          connections: seedData.connections,
          apiKeys: seedData.apiKeys,
          ltdOffers: seedData.ltdOffers,
          isBlockChatOpen: false,
          chatBlockId: null,
          autoChainEnabled: false,
          snapToGrid: true,
          zoom: 1,
        });
      },
    }),
    {
      name: 'multiblock-storage',
    }
  )
);

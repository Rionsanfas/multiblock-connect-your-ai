import { create } from 'zustand';

/**
 * Real-time block positions for drag operations.
 * 
 * This store provides immediate position updates during drag operations,
 * bypassing React Query entirely. Connection lines subscribe to this
 * store to move in sync with blocks during drag.
 * 
 * CRITICAL: This is the single source of truth for block positions during drag.
 * When not dragging, positions come from React Query cache.
 */

interface BlockPosition {
  x: number;
  y: number;
}

interface BlockPositionsState {
  // Map of blockId -> current position
  positions: Record<string, BlockPosition>;

  // Set a block's position (called during drag)
  setPosition: (blockId: string, position: BlockPosition) => void;

  // Initialize positions from cache (called on mount or cache update)
  initializePositions: (blocks: Array<{ id: string; position: BlockPosition }>) => void;

  // Get a block's position (returns from store if exists)
  getPosition: (blockId: string) => BlockPosition | undefined;

  // Remove a single block's position (e.g. on block delete)
  removePosition: (blockId: string) => void;

  // Clear all positions (called on unmount)
  clearPositions: () => void;
}

export const useBlockPositions = create<BlockPositionsState>((set, get) => ({
  positions: {},

  setPosition: (blockId, position) => {
    set((state) => ({
      positions: {
        ...state.positions,
        [blockId]: position,
      },
    }));
  },

  initializePositions: (blocks) => {
    const positions: Record<string, BlockPosition> = {};
    blocks.forEach((block) => {
      positions[block.id] = block.position;
    });
    set({ positions });
  },

  getPosition: (blockId) => {
    return get().positions[blockId];
  },

  removePosition: (blockId) => {
    set((state) => {
      if (!state.positions[blockId]) return state;
      const { [blockId]: _removed, ...rest } = state.positions;
      return { positions: rest };
    });
  },

  clearPositions: () => {
    set({ positions: {} });
  },
}));

// Non-reactive getter for use in RAF loops
export function getBlockPosition(blockId: string): BlockPosition | undefined {
  return useBlockPositions.getState().positions[blockId];
}

// Non-reactive setter for use in RAF loops
export function setBlockPosition(blockId: string, position: BlockPosition): void {
  useBlockPositions.setState((state) => ({
    positions: {
      ...state.positions,
      [blockId]: position,
    },
  }));
}

// Non-reactive remover for use outside React (e.g. optimistic deletes)
export function removeBlockPosition(blockId: string): void {
  useBlockPositions.getState().removePosition(blockId);
}

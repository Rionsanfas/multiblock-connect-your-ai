/**
 * Global drag state store - isolated from React render cycle
 * 
 * CRITICAL: This store prevents ANY state updates from interrupting drag operations.
 * All drag operations (blocks, connections, resize) must set isDragging=true at start.
 * 
 * Rules:
 * 1. When isDragging is true, NO refetches, NO cache invalidations, NO toasts
 * 2. Drag state is stored in refs where possible, not useState
 * 3. Only persist to backend AFTER drag ends
 */

import { create } from 'zustand';

interface DragState {
  // Global drag lock - when true, nothing should update
  isDragging: boolean;
  dragType: 'block' | 'connection' | 'resize' | 'pan' | null;
  dragId: string | null;
  
  // Actions
  startDrag: (type: 'block' | 'connection' | 'resize' | 'pan', id?: string) => void;
  endDrag: () => void;
  
  // Check if dragging (for use in queries)
  shouldRefetch: () => boolean;
}

export const useDragStore = create<DragState>((set, get) => ({
  isDragging: false,
  dragType: null,
  dragId: null,
  
  startDrag: (type, id) => {
    set({ isDragging: true, dragType: type, dragId: id || null });
  },
  
  endDrag: () => {
    set({ isDragging: false, dragType: null, dragId: null });
  },
  
  shouldRefetch: () => {
    return !get().isDragging;
  },
}));

// Non-reactive getter for use in callbacks (doesn't subscribe to updates)
export const getDragState = () => useDragStore.getState();

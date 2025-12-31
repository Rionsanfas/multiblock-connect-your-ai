/**
 * Enhanced Text Selection hook
 * 
 * Tracks text selection within a container, captures:
 * - Selected text
 * - Message ID and role
 * - Character range (start/end)
 * - Selection rectangle for positioning
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export interface TextSelectionState {
  selectedText: string;
  messageId: string | null;
  messageRole: 'user' | 'assistant' | null;
  selectionRect: DOMRect | null;
  range: {
    start: number;
    end: number;
  } | null;
}

const INITIAL_STATE: TextSelectionState = {
  selectedText: '',
  messageId: null,
  messageRole: null,
  selectionRect: null,
  range: null,
};

/**
 * Hook to track text selection within a container
 */
export function useTextSelection(containerRef: React.RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<TextSelectionState>(INITIAL_STATE);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectionChange = useCallback(() => {
    // Debounce to avoid rapid updates during selection
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const windowSelection = window.getSelection();
      
      if (!windowSelection || windowSelection.isCollapsed) {
        setSelection(INITIAL_STATE);
        return;
      }

      const selectedText = windowSelection.toString().trim();
      if (!selectedText || selectedText.length < 3) {
        setSelection(INITIAL_STATE);
        return;
      }

      // Check if selection is within our container
      const anchorNode = windowSelection.anchorNode;
      if (!containerRef.current || !anchorNode) {
        return;
      }

      if (!containerRef.current.contains(anchorNode)) {
        return;
      }

      // Find the message element containing the selection
      let messageElement = anchorNode.parentElement;
      while (messageElement && !messageElement.dataset.messageId) {
        messageElement = messageElement.parentElement;
      }

      const messageId = messageElement?.dataset.messageId || null;
      const messageRole = (messageElement?.dataset.messageRole as 'user' | 'assistant') || null;

      // Calculate character range within the message
      let range: { start: number; end: number } | null = null;
      if (messageElement) {
        const messageText = messageElement.textContent || '';
        const selectionStart = messageText.indexOf(selectedText);
        if (selectionStart !== -1) {
          range = {
            start: selectionStart,
            end: selectionStart + selectedText.length,
          };
        }
      }

      // Get the selection rectangle for positioning the popover
      const selectionRange = windowSelection.getRangeAt(0);
      const rect = selectionRange.getBoundingClientRect();

      setSelection({
        selectedText,
        messageId,
        messageRole,
        selectionRect: rect,
        range,
      });
    }, 50); // 50ms debounce
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(INITIAL_STATE);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [handleSelectionChange]);

  return {
    ...selection,
    hasSelection: selection.selectedText.length >= 3 && selection.messageId !== null,
    clearSelection,
  };
}

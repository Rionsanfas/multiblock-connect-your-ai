// Text Selection hook - Enables creating new blocks from selected text
import { useState, useCallback, useEffect } from 'react';

export interface TextSelectionState {
  selectedText: string;
  messageId: string | null;
  selectionRect: DOMRect | null;
}

/**
 * Hook to track text selection within a container
 */
export function useTextSelection(containerRef: React.RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<TextSelectionState>({
    selectedText: '',
    messageId: null,
    selectionRect: null,
  });

  const handleSelectionChange = useCallback(() => {
    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.isCollapsed) {
      setSelection({ selectedText: '', messageId: null, selectionRect: null });
      return;
    }

    const selectedText = windowSelection.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setSelection({ selectedText: '', messageId: null, selectionRect: null });
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

    // Get the selection rectangle for positioning the popover
    const range = windowSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelection({
      selectedText,
      messageId,
      selectionRect: rect,
    });
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection({ selectedText: '', messageId: null, selectionRect: null });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return {
    ...selection,
    hasSelection: selection.selectedText.length > 0,
    clearSelection,
  };
}

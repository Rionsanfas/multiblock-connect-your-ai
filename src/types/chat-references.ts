/**
 * Chat Reference Types
 * 
 * Defines the data structures for text selection referencing and branching.
 * References are attached to messages and preserved structurally.
 */

/**
 * Represents a text selection reference from another message.
 * Used to quote/reference text in new messages.
 */
export interface ChatReference {
  id: string;
  source_message_id: string;
  source_block_id: string;
  source_role: 'user' | 'assistant';
  selected_text: string;
  /** Character range in the original message (for highlighting) */
  range: {
    start: number;
    end: number;
  };
  created_at: string;
}

/**
 * Parameters for creating a branch from selected text
 */
export interface BranchParams {
  source_block_id: string;
  source_block_title: string;
  source_message_id: string;
  source_role: 'user' | 'assistant';
  selected_text: string;
  board_id: string;
}

/**
 * Generate a unique ID for references
 */
export function generateReferenceId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a ChatReference from selection data
 */
export function createReference(
  sourceMessageId: string,
  sourceBlockId: string,
  sourceRole: 'user' | 'assistant',
  selectedText: string,
  range: { start: number; end: number }
): ChatReference {
  return {
    id: generateReferenceId(),
    source_message_id: sourceMessageId,
    source_block_id: sourceBlockId,
    source_role: sourceRole,
    selected_text: selectedText,
    range,
    created_at: new Date().toISOString(),
  };
}

/**
 * Format references as context for the AI
 */
export function formatReferencesForContext(references: ChatReference[]): string {
  if (references.length === 0) return '';
  
  return references
    .map((ref, i) => {
      const roleLabel = ref.source_role === 'user' ? 'User' : 'Assistant';
      return `[Reference ${i + 1} from ${roleLabel}]:\n"${ref.selected_text}"`;
    })
    .join('\n\n');
}

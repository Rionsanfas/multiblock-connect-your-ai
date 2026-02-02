import type { MemoryItem, MemoryItemType } from '@/hooks/useBoardMemory';

export type MemoryScope = 'board' | 'block' | 'chat';

export interface MemoryFilterOptions {
  /** Filter by scope(s) */
  scopes?: MemoryScope[];
  /** Filter by type(s) */
  types?: MemoryItemType[];
  /** Filter by keywords (any match) */
  keywords?: string[];
  /** Filter to items from a specific block */
  sourceBlockId?: string;
  /** Maximum characters to include in context */
  maxChars?: number;
}

export interface ScopedMemoryItem extends MemoryItem {
  scope: MemoryScope;
  keywords: string[];
}

export interface InjectedMemoryResult {
  /** Formatted memory string for prompt injection */
  formattedContent: string;
  /** Items that were included */
  includedItems: ScopedMemoryItem[];
  /** Items that were excluded due to limits */
  excludedItems: ScopedMemoryItem[];
  /** Total character count */
  charCount: number;
  /** Whether content was truncated */
  wasTruncated: boolean;
}

const DEFAULT_MAX_CHARS = 8000; // ~2000 tokens, safe limit

/**
 * Filter memory items based on scope, type, keywords, and source block
 */
export function filterMemoryItems(
  items: ScopedMemoryItem[],
  options: MemoryFilterOptions
): ScopedMemoryItem[] {
  let filtered = [...items];

  // Filter by scope
  if (options.scopes && options.scopes.length > 0) {
    filtered = filtered.filter(item => options.scopes!.includes(item.scope));
  }

  // Filter by type
  if (options.types && options.types.length > 0) {
    filtered = filtered.filter(item => options.types!.includes(item.type));
  }

  // Filter by source block
  if (options.sourceBlockId) {
    filtered = filtered.filter(
      item => item.scope === 'board' || item.source_block_id === options.sourceBlockId
    );
  }

  // Filter by keywords (any match)
  if (options.keywords && options.keywords.length > 0) {
    const lowerKeywords = options.keywords.map(k => k.toLowerCase());
    filtered = filtered.filter(item => {
      // Check item keywords
      const hasMatchingKeyword = item.keywords?.some(
        k => lowerKeywords.includes(k.toLowerCase())
      );
      // Also check content for keyword matches
      const contentLower = item.content.toLowerCase();
      const hasContentMatch = lowerKeywords.some(k => contentLower.includes(k));
      return hasMatchingKeyword || hasContentMatch;
    });
  }

  return filtered;
}

/**
 * Group memory items by type for readable formatting
 */
function groupByType(items: ScopedMemoryItem[]): Record<MemoryItemType, ScopedMemoryItem[]> {
  return {
    fact: items.filter(i => i.type === 'fact'),
    decision: items.filter(i => i.type === 'decision'),
    constraint: items.filter(i => i.type === 'constraint'),
    note: items.filter(i => i.type === 'note'),
  };
}

/**
 * Format a single memory item with scope indicator
 */
function formatItem(item: ScopedMemoryItem, includeScope: boolean): string {
  const scopeIndicator = includeScope ? ` [${item.scope}]` : '';
  return `- ${item.content}${scopeIndicator}`;
}

/**
 * Format grouped memory items into a readable prompt section
 */
export function formatMemoryForPrompt(
  items: ScopedMemoryItem[],
  options: { includeScope?: boolean; header?: string } = {}
): string {
  if (items.length === 0) return '';

  const { includeScope = false, header = '## Memory' } = options;
  const grouped = groupByType(items);
  const lines: string[] = [header];

  const typeLabels: Record<MemoryItemType, string> = {
    fact: 'Facts',
    decision: 'Decisions',
    constraint: 'Constraints',
    note: 'Notes',
  };

  for (const type of ['fact', 'decision', 'constraint', 'note'] as MemoryItemType[]) {
    const typeItems = grouped[type];
    if (typeItems.length > 0) {
      lines.push(`\n### ${typeLabels[type]}`);
      typeItems.forEach(item => lines.push(formatItem(item, includeScope)));
    }
  }

  return lines.join('\n');
}

/**
 * Build memory context for AI prompt with intelligent filtering and limits
 */
export function buildMemoryContext(
  allItems: ScopedMemoryItem[],
  options: MemoryFilterOptions = {}
): InjectedMemoryResult {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  
  // Apply filters
  const filteredItems = filterMemoryItems(allItems, options);
  
  // Sort by priority: constraints > decisions > facts > notes
  // Also prioritize board-level over block-level over chat-level
  const priorityOrder: Record<MemoryItemType, number> = {
    constraint: 0,
    decision: 1,
    fact: 2,
    note: 3,
  };
  const scopePriority: Record<MemoryScope, number> = {
    board: 0,
    block: 1,
    chat: 2,
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    const typeDiff = priorityOrder[a.type] - priorityOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return scopePriority[a.scope] - scopePriority[b.scope];
  });

  // Build content within character limit
  const includedItems: ScopedMemoryItem[] = [];
  const excludedItems: ScopedMemoryItem[] = [];
  let currentChars = 0;
  const headerSize = '## Memory\n\n### Facts\n'.length; // Approximate header overhead

  for (const item of sortedItems) {
    const itemLength = item.content.length + 20; // Account for formatting
    if (currentChars + itemLength + headerSize <= maxChars) {
      includedItems.push(item);
      currentChars += itemLength;
    } else {
      excludedItems.push(item);
    }
  }

  const formattedContent = formatMemoryForPrompt(includedItems, { includeScope: true });

  return {
    formattedContent,
    includedItems,
    excludedItems,
    charCount: formattedContent.length,
    wasTruncated: excludedItems.length > 0,
  };
}

/**
 * Get relevant memory for a specific block context
 * This is the main entry point for the chat system
 */
export function getMemoryForBlock(
  allItems: ScopedMemoryItem[],
  blockId: string,
  options: Omit<MemoryFilterOptions, 'sourceBlockId'> = {}
): InjectedMemoryResult {
  // For a block, include:
  // 1. All board-level memory
  // 2. Block-specific memory for this block only
  // 3. Chat-session memory for this block only
  const relevantItems = allItems.filter(item => {
    if (item.scope === 'board') return true;
    if (item.scope === 'block' && item.source_block_id === blockId) return true;
    if (item.scope === 'chat' && item.source_block_id === blockId) return true;
    return false;
  });

  return buildMemoryContext(relevantItems, options);
}

/**
 * Extract keywords from content for auto-tagging
 */
export function extractKeywords(content: string): string[] {
  // Simple keyword extraction - could be enhanced with NLP
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Get unique words, sorted by frequency
  const freq = new Map<string, number>();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  
  // Return top 5 most frequent words
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

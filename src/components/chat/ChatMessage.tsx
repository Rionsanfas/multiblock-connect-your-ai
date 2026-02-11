import { useState } from 'react';
import { Copy, Check, Trash2, RotateCcw, Paperclip, Quote, User, Bot, Bookmark } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Message } from '@/types';
import type { ChatAttachment } from '@/services/chatService';
import type { ChatReference } from '@/types/chat-references';

interface ChatMessageProps {
  message: Message;
  onDelete?: (id: string) => void;
  onRetry?: (message: Message) => void;
  onSaveToMemory?: (messageId: string, content: string, role: 'user' | 'assistant') => void;
  attachments?: ChatAttachment[];
  /** References attached to this message */
  references?: ChatReference[];
  isStreaming?: boolean;
  /** Enable text selection for referencing */
  selectable?: boolean;
}

export function ChatMessage({
  message,
  onDelete,
  onRetry,
  onSaveToMemory,
  attachments,
  references,
  isStreaming,
  selectable = true,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-message-id={message.id}
      data-message-role={message.role}
      className={cn(
        "group flex gap-3 w-full",
        isUser && "justify-end",
        selectable && "select-text"
      )}
    >
      {/* Message content */}
      <div className={cn("flex flex-col max-w-[95%] sm:max-w-[85%]", isUser && "items-end")}>
        {/* References displayed above message */}
        {references && references.length > 0 && (
          <div className="mb-2 space-y-1.5 w-full">
            {references.map((ref) => (
              <div
                key={ref.id}
                className="flex gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20"
              >
                <Quote className="h-3 w-3 text-primary/60 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {ref.source_role === 'user' ? (
                      <User className="h-2.5 w-2.5 text-muted-foreground" />
                    ) : (
                      <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {ref.source_role === 'user' ? 'User' : 'Assistant'} said:
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
                    "{ref.selected_text.length > 150 
                      ? ref.selected_text.substring(0, 147) + '...' 
                      : ref.selected_text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-xs"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{att.name}</span>
                <span className="text-muted-foreground">
                  ({(att.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Message bubble with glow effect for user messages - increased font sizes */}
        <div
          className={cn(
            "rounded-xl sm:rounded-2xl relative",
            isUser 
              ? "bg-secondary/60 text-foreground px-3 sm:px-4 py-2.5 sm:py-3 user-message-glow text-base sm:text-lg"
              : "bg-transparent py-1 text-[15px] sm:text-base"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} className="text-[15px] sm:text-base leading-relaxed" />
          )}
          
          {/* Streaming cursor */}
          {isStreaming && isAssistant && (
            <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1 rounded-sm" />
          )}
        </div>

        {/* Meta info for assistant messages */}
        {isAssistant && message.meta && !isStreaming && (
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            {message.meta.model && (
              <span className="opacity-70">{message.meta.model}</span>
            )}
            {message.meta.tokens && (
              <span>· {message.meta.tokens} tokens</span>
            )}
            {message.meta.latency_ms && (
              <span>· {(message.meta.latency_ms / 1000).toFixed(1)}s</span>
            )}
          </div>
        )}

        {/* Action buttons - always visible */}
        {!isStreaming && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              isUser && "flex-row-reverse"
            )}
          >
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {onSaveToMemory && (
              <button
                onClick={() => onSaveToMemory(message.id, message.content, message.role as 'user' | 'assistant')}
                className="memory-btn-highlight p-1.5 rounded-md transition-colors"
                title="Save to board memory"
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            )}

            {isAssistant && onRetry && (
              <button
                onClick={() => onRetry(message)}
                className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                title="Regenerate response"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors"
                title="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

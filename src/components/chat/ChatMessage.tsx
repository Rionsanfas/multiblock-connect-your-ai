import { useState } from 'react';
import { Copy, Check, Trash2, RotateCcw, User, Bot, Paperclip } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Message } from '@/types';
import type { ChatAttachment } from '@/services/chatService';

interface ChatMessageProps {
  message: Message;
  onDelete?: (id: string) => void;
  onRetry?: (message: Message) => void;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
}

export function ChatMessage({
  message,
  onDelete,
  onRetry,
  attachments,
  isStreaming,
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
      className={cn(
        "group flex gap-3 w-full",
        isUser && "justify-end"
      )}
    >
      {/* Avatar for assistant */}
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex flex-col max-w-[85%]", isUser && "items-end")}>
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

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl text-sm",
            isUser 
              ? "bg-primary text-primary-foreground px-4 py-2.5"
              : "bg-transparent py-1"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          
          {/* Streaming cursor */}
          {isStreaming && isAssistant && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 rounded-sm" />
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

        {/* Action buttons */}
        {!isStreaming && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
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

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square, Paperclip, X, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ReferenceList } from './ReferenceBlock';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ChatAttachment } from '@/services/chatService';
import type { ChatReference } from '@/types/chat-references';
import { formatReferencesForContext } from '@/types/chat-references';

interface ChatInputProps {
  onSend: (content: string, attachments?: ChatAttachment[], references?: ChatReference[]) => void;
  onStop?: () => void;
  isRunning?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** References to attach to the next message */
  references?: ChatReference[];
  /** Callback when references change */
  onReferencesChange?: (refs: ChatReference[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export function ChatInput({
  onSend,
  onStop,
  isRunning,
  disabled,
  placeholder = 'Type your message...',
  references = [],
  onReferencesChange,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!input.trim() && attachments.length === 0 && references.length === 0) return;
    if (isRunning) return;

    onSend(
      input.trim(),
      attachments.length > 0 ? attachments : undefined,
      references.length > 0 ? references : undefined
    );
    setInput('');
    setAttachments([]);
    // Clear references after send
    onReferencesChange?.([]);
  }, [input, attachments, references, isRunning, onSend, onReferencesChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const processFile = async (file: File): Promise<ChatAttachment | null> => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large: ${file.name} (max 10MB)`);
      return null;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}`);
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const content = reader.result as string;
        const isBinary = file.type.startsWith('image/') || file.type === 'application/pdf';
        const normalizedContent = isBinary
          ? content.replace(/^data:[^;]+;base64,/, '') // base64 only
          : content;

        resolve({
          id: Math.random().toString(36).substring(2, 15),
          name: file.name,
          type: file.type,
          size: file.size,
          content: normalizedContent,
        });
      };

      reader.onerror = () => {
        toast.error(`Failed to read file: ${file.name}`);
        resolve(null);
      };

      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newAttachments: ChatAttachment[] = [];
    
    for (const file of Array.from(files)) {
      const attachment = await processFile(file);
      if (attachment) {
        newAttachments.push(attachment);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const removeReference = (id: string) => {
    onReferencesChange?.(references.filter(r => r.id !== id));
  };

  const clearAllReferences = () => {
    onReferencesChange?.([]);
  };

  return (
    <div
      className={cn(
        "relative border-t border-border/20 bg-card/50",
        isDragging && "ring-2 ring-primary ring-inset"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* References preview */}
      {references.length > 0 && (
        <div className="px-4 pt-3">
          <ReferenceList
            references={references}
            onRemove={removeReference}
            onClearAll={clearAllReferences}
          />
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-xs group"
            >
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-sm font-medium text-primary">Drop files here</div>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all hover:bg-secondary/50 flex-shrink-0",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Text input */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={references.length > 0 ? 'Add a message with your references...' : placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[40px] sm:min-h-[44px] max-h-[160px] sm:max-h-[200px] resize-none rounded-lg sm:rounded-xl border-border/30 text-sm bg-secondary/30 focus:bg-secondary/50 transition-colors",
              disabled && "opacity-50"
            )}
            rows={1}
          />

          {/* Send/Stop button */}
          {isRunning ? (
            <button
              onClick={onStop}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all flex-shrink-0"
            >
              <Square className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={disabled || (!input.trim() && attachments.length === 0 && references.length === 0)}
              className={cn(
                "p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all flex-shrink-0",
                (disabled || (!input.trim() && attachments.length === 0 && references.length === 0)) && "opacity-50 cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

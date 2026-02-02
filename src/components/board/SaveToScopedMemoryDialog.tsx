import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Scale, AlertTriangle, StickyNote, Globe, Box, MessageSquare } from 'lucide-react';
import { useScopedMemoryActions, type MemoryScope } from '@/hooks/useScopedMemory';
import type { MemoryItemType } from '@/hooks/useBoardMemory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SaveToScopedMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  blockId?: string;
  messageId?: string;
  initialContent: string;
  sourceRole: 'user' | 'assistant';
}

const TYPE_OPTIONS: { value: MemoryItemType; label: string; icon: typeof Lightbulb; description: string }[] = [
  { value: 'fact', label: 'Fact', icon: Lightbulb, description: 'A verified piece of information' },
  { value: 'decision', label: 'Decision', icon: Scale, description: 'A choice that was made' },
  { value: 'constraint', label: 'Constraint', icon: AlertTriangle, description: 'A limitation or requirement' },
  { value: 'note', label: 'Note', icon: StickyNote, description: 'General context or observation' },
];

const SCOPE_OPTIONS: { value: MemoryScope; label: string; icon: typeof Globe; description: string }[] = [
  { value: 'board', label: 'Board', icon: Globe, description: 'Shared across all blocks' },
  { value: 'block', label: 'Block', icon: Box, description: 'Only for this block' },
  { value: 'chat', label: 'Chat', icon: MessageSquare, description: 'Temporary session context' },
];

export function SaveToScopedMemoryDialog({
  open,
  onOpenChange,
  boardId,
  blockId,
  messageId,
  initialContent,
  sourceRole,
}: SaveToScopedMemoryDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState<MemoryItemType>('note');
  const [scope, setScope] = useState<MemoryScope>('board');
  const { createMemory, isCreating } = useScopedMemoryActions(boardId);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    try {
      await createMemory({
        type,
        content: content.trim(),
        scope,
        sourceBlockId: blockId,
        sourceMessageId: messageId,
      });
      toast.success(`Saved to ${scope} memory`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save memory');
    }
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === type)!;
  const selectedScope = SCOPE_OPTIONS.find(s => s.value === scope)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Memory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>From {sourceRole === 'user' ? 'your message' : 'AI response'}</span>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edit the memory content..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = type === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setType(option.value)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-[10px] text-muted-foreground">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {SCOPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = scope === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setScope(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-xs font-medium">{option.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreating || !content.trim()}>
            {isCreating ? 'Saving...' : 'Save Memory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

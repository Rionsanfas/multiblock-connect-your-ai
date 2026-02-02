import { useState } from 'react';
import { Lightbulb, Scale, AlertTriangle, StickyNote, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMemoryActions, type MemoryItemType } from '@/hooks/useBoardMemory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SaveToMemoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  blockId: string;
  messageId: string;
  initialContent: string;
  messageRole: 'user' | 'assistant';
}

const TYPE_OPTIONS: { type: MemoryItemType; label: string; icon: typeof Lightbulb; description: string }[] = [
  { type: 'fact', label: 'Fact', icon: Lightbulb, description: 'Something true that should be remembered' },
  { type: 'decision', label: 'Decision', icon: Scale, description: 'A choice that was made' },
  { type: 'constraint', label: 'Constraint', icon: AlertTriangle, description: 'A limitation or requirement' },
  { type: 'note', label: 'Note', icon: StickyNote, description: 'General information' },
];

export function SaveToMemoryDialog({
  isOpen,
  onClose,
  boardId,
  blockId,
  messageId,
  initialContent,
  messageRole,
}: SaveToMemoryDialogProps) {
  const [selectedType, setSelectedType] = useState<MemoryItemType>('note');
  const [content, setContent] = useState(initialContent);
  const { createMemory, isCreating } = useMemoryActions(boardId);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    try {
      await createMemory({
        type: selectedType,
        content: content.trim(),
        source_block_id: blockId,
        source_message_id: messageId,
      });
      toast.success('Saved to board memory');
      onClose();
    } catch (error) {
      toast.error('Failed to save to memory');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Save to Board Memory
          </DialogTitle>
          <DialogDescription>
            This will be shared across all blocks on this board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "flex items-start gap-2 p-3 rounded-lg border text-left transition-all",
                    selectedType === type
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border hover:bg-secondary/30"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    selectedType === type ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div>
                    <div className={cn(
                      "text-sm font-medium",
                      selectedType === type ? "text-primary" : "text-foreground"
                    )}>
                      {label}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edit the memory content..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              You can edit the text before saving.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreating || !content.trim()}>
            {isCreating ? 'Saving...' : 'Save to Memory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

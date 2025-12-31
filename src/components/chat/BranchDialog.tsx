/**
 * BranchDialog - Dialog for creating a new block from selected text
 * 
 * Creates a branch with chat history and focuses on the selected text.
 */

import { useState } from 'react';
import { GitBranch, ArrowRight, Sparkles, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { BranchParams } from '@/types/chat-references';

interface BranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, includeHistory: boolean) => void;
  params: BranchParams | null;
  messageCount?: number;
}

export function BranchDialog({
  isOpen,
  onClose,
  onConfirm,
  params,
  messageCount = 0,
}: BranchDialogProps) {
  const [title, setTitle] = useState('');
  const [includeHistory, setIncludeHistory] = useState(true);

  if (!params) return null;

  // Truncate text for preview
  const previewText = params.selected_text.length > 200
    ? params.selected_text.substring(0, 197) + '...'
    : params.selected_text;

  const handleConfirm = () => {
    const finalTitle = title.trim() || `Branch from ${params.source_block_title}`;
    onConfirm(finalTitle, includeHistory);
    setTitle('');
    setIncludeHistory(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="px-5 py-4 border-b border-border/20">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <GitBranch className="h-4 w-4 text-[hsl(var(--accent))]" />
            Branch to New Block
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Source info */}
          <div className="p-3 rounded-lg bg-secondary/40 border border-border/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3" />
              <span>Selected text from "{params.source_block_title}"</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              "{previewText}"
            </p>
          </div>

          {/* Block title */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Block Title (optional)
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Branch from ${params.source_block_title}`}
              className="bg-secondary/50 rounded-lg border-border/30 h-9"
            />
          </div>

          {/* Include history toggle */}
          {messageCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Include chat history</p>
                  <p className="text-xs text-muted-foreground">
                    Copy {messageCount} message{messageCount > 1 ? 's' : ''} to the new block
                  </p>
                </div>
              </div>
              <Switch
                checked={includeHistory}
                onCheckedChange={setIncludeHistory}
              />
            </div>
          )}

          {/* Info about what will happen */}
          <p className="text-xs text-muted-foreground">
            The AI will focus on the selected text and continue the conversation from there.
            {includeHistory && messageCount > 0 && ' Full conversation context will be preserved.'}
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.9)] text-foreground rounded-lg"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Create Branch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * BranchDialog - Dialog for creating a new block from selected text
 * 
 * Allows user to configure the new block before creation.
 */

import { useState } from 'react';
import { GitBranch, ArrowRight, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODEL_CONFIGS, PROVIDERS, type Provider } from '@/types';
import type { BranchParams } from '@/types/chat-references';

interface BranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, modelId: string) => void;
  params: BranchParams | null;
  currentModelId?: string;
}

export function BranchDialog({
  isOpen,
  onClose,
  onConfirm,
  params,
  currentModelId,
}: BranchDialogProps) {
  const [title, setTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState(currentModelId || 'gpt-4o');

  if (!params) return null;

  // Truncate text for preview
  const previewText = params.selected_text.length > 200
    ? params.selected_text.substring(0, 197) + '...'
    : params.selected_text;

  // Group models by provider
  const modelsByProvider = MODEL_CONFIGS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<Provider, typeof MODEL_CONFIGS>);

  const handleConfirm = () => {
    const finalTitle = title.trim() || `Branch from ${params.source_block_title}`;
    onConfirm(finalTitle, selectedModel);
    setTitle('');
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
              <span>From "{params.source_block_title}"</span>
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

          {/* Model selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-secondary/40 rounded-lg border-border/20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-lg max-h-60">
                {Object.entries(modelsByProvider).map(([provider, models]) => (
                  <div key={provider}>
                    <div
                      className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                      style={{ color: PROVIDERS[provider as Provider].color }}
                    >
                      {PROVIDERS[provider as Provider].name}
                    </div>
                    {models.slice(0, 4).map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        className="rounded-md pl-4"
                      >
                        {model.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note about what will happen */}
          <p className="text-xs text-muted-foreground">
            A new block will be created with the selected text as initial context.
            The new chat will start with a system note linking back to this source.
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
              Create Block
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

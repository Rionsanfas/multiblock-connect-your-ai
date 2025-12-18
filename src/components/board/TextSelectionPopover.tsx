import { useState } from "react";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { MODEL_CONFIGS, PROVIDERS, type Provider } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TextSelectionPopoverProps {
  selectedText: string;
  messageId: string;
  blockId: string;
  boardId: string;
  selectionRect: DOMRect | null;
  containerRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}

export function TextSelectionPopover({
  selectedText,
  messageId,
  blockId,
  boardId,
  selectionRect,
  containerRef,
  onClose,
}: TextSelectionPopoverProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  
  const { createBlockFromSelection, closeBlockChat } = useAppStore();

  if (!selectionRect || !selectedText) return null;

  // Calculate position relative to the container
  const containerRect = containerRef.current?.getBoundingClientRect();
  if (!containerRect) return null;

  const handleCreateBlock = () => {
    try {
      const block = createBlockFromSelection({
        boardId,
        sourceBlockId: blockId,
        sourceMessageId: messageId,
        selectedText,
        modelId: selectedModel,
        title: title || undefined,
      });

      toast.success(`Created block: ${block.title}`);
      onClose();
      closeBlockChat(); // Close modal to show new block on canvas
    } catch (error) {
      toast.error("Failed to create block");
    }
  };

  // Group models by provider
  const modelsByProvider = MODEL_CONFIGS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<Provider, typeof MODEL_CONFIGS>);

  // Truncate display text
  const displayText = selectedText.length > 100 
    ? selectedText.substring(0, 100) + "..." 
    : selectedText;

  return (
    <Popover open={isOpen} onOpenChange={(open) => { if (!open) onClose(); setIsOpen(open); }}>
      <PopoverTrigger asChild>
        <div
          className="fixed z-50"
          style={{
            left: selectionRect.left + selectionRect.width / 2,
            top: selectionRect.bottom + 8,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
              "bg-[hsl(var(--accent))] text-foreground shadow-lg",
              "hover:bg-[hsl(var(--accent)/0.9)] transition-all",
              "animate-in fade-in-0 zoom-in-95 duration-200"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Block
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 space-y-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6)]"
        side="bottom"
        align="center"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
            Create Block from Selection
          </div>
          <p className="text-xs text-muted-foreground">
            The selected text will be stored as read-only context.
          </p>
        </div>

        {/* Selected Text Preview */}
        <div className="p-3 rounded-lg bg-secondary/40 border border-border/20">
          <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
          <p className="text-sm line-clamp-3">"{displayText}"</p>
        </div>

        {/* Block Title */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Block Title (optional)</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-generated from source"
            className="bg-secondary/50 rounded-lg border-border/30 h-9"
          />
        </div>

        {/* Model Selection */}
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
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="rounded-md pl-4">
                      <span className="flex items-center gap-2">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.speed === 'fast' ? '⚡' : model.speed === 'slow' ? '🐢' : ''}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleCreateBlock}
          className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.9)] text-foreground"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Create Block
        </Button>
      </PopoverContent>
    </Popover>
  );
}

import { useState } from "react";
import { X, Pencil, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { MODEL_PROVIDERS } from "@/types";

interface BlockSettingsProps {
  blockId: string;
}

export function BlockSettings({ blockId }: BlockSettingsProps) {
  const { blocks, updateBlock, selectBlock } = useAppStore();
  const block = blocks.find((b) => b.id === blockId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(block?.title || "");

  if (!block) return null;

  const allModels = Object.entries(MODEL_PROVIDERS).flatMap(([provider, info]) =>
    info.models.map((model) => ({ provider, model, name: info.name }))
  );

  const handleTitleSave = () => {
    if (title.trim()) {
      updateBlock(blockId, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  return (
    <aside className="w-80 border-l border-border/30 bg-card/20 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h3 className="font-semibold">Block Settings</h3>
        <IconButton variant="ghost" size="sm" onClick={() => selectBlock(null)}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label>Title</Label>
          {isEditingTitle ? (
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                className="bg-secondary/50"
                autoFocus
              />
              <IconButton size="sm" onClick={handleTitleSave}>
                <Check className="h-4 w-4" />
              </IconButton>
            </div>
          ) : (
            <button
              onClick={() => { setTitle(block.title); setIsEditingTitle(true); }}
              className="w-full text-left p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors flex items-center justify-between group"
            >
              <span>{block.title}</span>
              <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={block.model}
            onValueChange={(value) => updateBlock(blockId, { model: value })}
          >
            <SelectTrigger className="bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {allModels.map(({ provider, model, name }) => (
                <SelectItem key={model} value={model}>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{name}</span>
                    {model}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label>System Prompt</Label>
          <Textarea
            value={block.system_prompt}
            onChange={(e) => updateBlock(blockId, { system_prompt: e.target.value })}
            className="bg-secondary/50 min-h-[100px] resize-none"
            placeholder="You are a helpful assistant..."
          />
        </div>

        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-muted-foreground">{block.config.temperature}</span>
          </div>
          <Slider
            value={[block.config.temperature || 0.7]}
            onValueChange={([value]) => updateBlock(blockId, { config: { ...block.config, temperature: value } })}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        {/* Max Tokens */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Max Tokens</Label>
            <span className="text-sm text-muted-foreground">{block.config.max_tokens}</span>
          </div>
          <Slider
            value={[block.config.max_tokens || 2048]}
            onValueChange={([value]) => updateBlock(blockId, { config: { ...block.config, max_tokens: value } })}
            min={256}
            max={8192}
            step={256}
          />
        </div>

        {/* Position */}
        <GlassCard className="p-3">
          <Label className="text-xs text-muted-foreground">Position</Label>
          <div className="flex gap-4 mt-2 text-sm">
            <span>X: {Math.round(block.position.x)}</span>
            <span>Y: {Math.round(block.position.y)}</span>
          </div>
        </GlassCard>
      </div>
    </aside>
  );
}

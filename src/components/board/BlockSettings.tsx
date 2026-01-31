import { useState, useEffect } from "react";
import { X, Pencil, Check, Loader2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { useBlockActions } from "@/hooks/useBoardBlocks";
import { useBlock } from "@/hooks/useBlockData";
import { getChatModels, PROVIDERS, getModelConfig } from "@/config/models";
import { useConfiguredProviders } from "@/hooks/useApiKeys";
import { toast } from "sonner";

interface BlockSettingsProps {
  blockId: string;
  boardId: string;
}

export function BlockSettings({ blockId, boardId }: BlockSettingsProps) {
  const { selectBlock } = useAppStore();
  // Read block from React Query cache (Supabase is source of truth)
  const { data: blockData } = useBlock(blockId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  
  const { updateBlock } = useBlockActions(boardId);
  const configuredProviders = useConfiguredProviders();

  // Sync title state when block data changes
  useEffect(() => {
    if (blockData?.title) {
      setTitle(blockData.title);
    }
  }, [blockData?.title]);

  if (!blockData) return null;

  // Transform to legacy format for UI compatibility
  const block = {
    id: blockData.id,
    board_id: blockData.board_id,
    title: blockData.title || 'Untitled Block',
    type: 'chat' as const,
    model_id: blockData.model_id,
    system_prompt: blockData.system_prompt || '',
    config: { temperature: 0.7, max_tokens: 2048 },
    position: { x: blockData.position_x, y: blockData.position_y },
    created_at: blockData.created_at,
    updated_at: blockData.updated_at,
  };

  // Only show chat models for block settings
  const allModels = getChatModels().map((m) => ({
    provider: m.provider,
    model: m.id,
    providerName: PROVIDERS[m.provider].name,
    modelName: m.name,
    type: m.type,
    hasKey: configuredProviders.includes(m.provider),
  }));

  const handleTitleSave = async () => {
    if (title.trim()) {
      try {
        await updateBlock(blockId, { title: title.trim() });
        toast.success("Title updated");
      } catch {
        toast.error("Failed to update title");
      }
    }
    setIsEditingTitle(false);
  };

  const handleModelChange = async (newModelId: string) => {
    const newModel = getModelConfig(newModelId);
    if (!newModel) {
      toast.error("Invalid model selected");
      return;
    }
    
    // Check if user has API key for this provider
    if (!configuredProviders.includes(newModel.provider)) {
      toast.error(`Add an API key for ${PROVIDERS[newModel.provider].name} first`, {
        action: {
          label: "Add Key",
          onClick: () => window.open(PROVIDERS[newModel.provider].apiKeyUrl, '_blank'),
        },
      });
      return;
    }
    
    setIsSwitching(true);
    try {
      await updateBlock(blockId, { model_id: newModelId });
      toast.success(`Switched to ${newModel.name}`);
    } catch {
      toast.error("Failed to switch model");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSystemPromptChange = async (value: string) => {
    try {
      await updateBlock(blockId, { system_prompt: value });
    } catch {
      toast.error("Failed to update system prompt");
    }
  };

  return (
    <aside className="w-80 border-l border-border/20 bg-card/30 backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <h3 className="font-semibold">Block Settings</h3>
        <IconButton variant="soft" size="sm" onClick={() => selectBlock(null)}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
          {isEditingTitle ? (
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                className="bg-secondary/50 rounded-xl border-border/30"
                autoFocus
              />
              <IconButton variant="soft" size="sm" onClick={handleTitleSave}>
                <Check className="h-4 w-4" />
              </IconButton>
            </div>
          ) : (
            <button
              onClick={() => { setTitle(block.title); setIsEditingTitle(true); }}
              className="w-full text-left p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-between group"
            >
              <span className="font-medium">{block.title}</span>
              <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model</Label>
          <Select
            value={block.model_id}
            onValueChange={handleModelChange}
            disabled={isSwitching}
          >
            <SelectTrigger className="bg-secondary/40 rounded-xl border-border/20 h-11">
              {isSwitching ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Switching...</span>
                </div>
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl max-h-80">
              {allModels.map(({ provider, model, providerName, modelName, hasKey }) => (
                <SelectItem 
                  key={model} 
                  value={model} 
                  className="rounded-lg cursor-pointer"
                  disabled={!hasKey}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{providerName}</span>
                    <span className={!hasKey ? "opacity-50" : ""}>{modelName}</span>
                    {!hasKey && <span className="text-xs text-destructive">(No key)</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">System Prompt</Label>
          <Textarea
            value={block.system_prompt}
            onChange={(e) => handleSystemPromptChange(e.target.value)}
            className="bg-secondary/40 min-h-[100px] resize-none rounded-xl border-border/20"
            placeholder="You are a helpful assistant..."
          />
        </div>

        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temperature</Label>
            <span className="text-sm font-semibold tabular-nums">{block.config.temperature}</span>
          </div>
          <div className="px-1">
            <Slider
              value={[block.config.temperature || 0.7]}
              onValueChange={([value]) => updateBlock(blockId, { config: { ...block.config, temperature: value } })}
              min={0}
              max={2}
              step={0.1}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-full [&_[role=slider]]:bg-foreground [&_[role=slider]]:shadow-lg"
            />
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max Tokens</Label>
            <span className="text-sm font-semibold tabular-nums">{block.config.max_tokens}</span>
          </div>
          <div className="px-1">
            <Slider
              value={[block.config.max_tokens || 2048]}
              onValueChange={([value]) => updateBlock(blockId, { config: { ...block.config, max_tokens: value } })}
              min={256}
              max={8192}
              step={256}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:rounded-full [&_[role=slider]]:bg-foreground [&_[role=slider]]:shadow-lg"
            />
          </div>
        </div>

        {/* Position */}
        <div className="p-4 rounded-xl bg-secondary/30">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Position</Label>
          <div className="flex gap-6 mt-2 text-sm font-medium">
            <span>X: {Math.round(block.position.x)}</span>
            <span>Y: {Math.round(block.position.y)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  ZoomIn,
  ZoomOut,
  Check,
  Pencil,
  HelpCircle,
  Home,
  Loader2,
  Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { useBlockActions } from "@/hooks/useBoardBlocks";
import { useConfiguredProviders } from "@/hooks/useApiKeys";
import { getChatModels, PROVIDERS, getModelConfig } from "@/config/models";
import { BoardApiKeySettings } from "@/components/board/BoardApiKeySettings";
import { toast } from "sonner";

interface TopBarProps {
  boardId?: string;
  boardTitle?: string;
  showBoardControls?: boolean;
}

export function TopBar({ boardId, boardTitle, showBoardControls = false }: TopBarProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(boardTitle || "");
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockTitle, setBlockTitle] = useState("");
  const [switchingBlockId, setSwitchingBlockId] = useState<string | null>(null);
  
  const {
    updateBoard,
    zoom,
    setZoom,
    blocks,
  } = useAppStore();

  const { updateBlock } = useBlockActions(boardId || '');
  const configuredProviders = useConfiguredProviders();

  const boardBlocks = boardId ? blocks.filter((b) => b.board_id === boardId) : [];

  const allModels = getChatModels().map((m) => ({
    provider: m.provider,
    model: m.id,
    name: PROVIDERS[m.provider].name,
    modelName: m.name,
    hasKey: configuredProviders.includes(m.provider),
  }));

  const handleTitleSave = () => {
    if (boardId && title.trim()) {
      updateBoard(boardId, { title: title.trim() });
      toast.success("Board title updated");
    }
    setIsEditing(false);
  };

  const handleBlockTitleSave = async (blockId: string) => {
    if (blockTitle.trim()) {
      try {
        await updateBlock(blockId, { title: blockTitle.trim() });
        toast.success("Block title updated");
      } catch {
        toast.error("Failed to update title");
      }
    }
    setEditingBlockId(null);
  };

  const handleModelChange = async (blockId: string, newModelId: string) => {
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
    
    setSwitchingBlockId(blockId);
    try {
      await updateBlock(blockId, { model_id: newModelId });
      toast.success(`Switched to ${newModel.name}`);
    } catch {
      toast.error("Failed to switch model");
    } finally {
      setSwitchingBlockId(null);
    }
  };

  const handleSystemPromptChange = async (blockId: string, value: string) => {
    try {
      await updateBlock(blockId, { system_prompt: value });
    } catch {
      toast.error("Failed to update system prompt");
    }
  };

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-5 gap-2 sm:gap-4">
      {/* Left section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {showBoardControls && (
          <button
            onClick={() => navigate("/dashboard")}
            className="key-icon-3d p-2.5 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Home link */}
        <Link
          to="/"
          className="key-icon-3d p-2.5 rounded-xl"
        >
          <Home className="h-4 w-4" />
        </Link>

        {showBoardControls && boardTitle && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                  className="h-10 w-56 bg-secondary/50 rounded-xl border-border/20"
                  autoFocus
                />
                <button onClick={handleTitleSave} className="key-icon-3d p-2.5 rounded-xl">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-lg font-semibold hover:text-[hsl(var(--accent))] transition-colors group"
              >
                {boardTitle}
                <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center section - Zoom controls only */}
      {showBoardControls && (
        <div className="hidden sm:flex items-center gap-1">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="key-icon-3d p-1.5 rounded-lg"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-muted-foreground w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="key-icon-3d p-1.5 rounded-lg"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center gap-2">
        {showBoardControls && (
          <>
            {/* Instructions Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="key-icon-3d p-2.5 rounded-xl"
                  title="Board Instructions"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" side="bottom" align="end">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Board Instructions</p>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-muted-foreground">
                    <li>Double-click canvas to create a new block</li>
                    <li>Click a block to open chat</li>
                    <li>Drag blocks to reposition them</li>
                    <li>Drag block corners to resize</li>
                    <li>Connect blocks by dragging from connection nodes</li>
                    <li>Use zoom controls to zoom in/out</li>
                    <li>Click and drag on canvas to pan</li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>

            {/* Settings Popover - All Blocks with inline settings */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="key-icon-3d p-2.5 rounded-xl">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" side="bottom" align="end">
                <div className="space-y-4">
                  <p className="font-semibold text-sm">Board Settings</p>
                  
                  {/* Board API Key Selection */}
                  {boardId && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Key className="h-3 w-3" />
                        Board API Key
                      </Label>
                      <BoardApiKeySettings boardId={boardId} compact />
                      <p className="text-[10px] text-muted-foreground">
                        Select which API key this board uses for all chats
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-border/20 pt-3">
                    <p className="font-medium text-xs text-muted-foreground mb-2">Block Settings</p>
                  </div>
                  
                  {boardBlocks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No blocks yet. Double-click canvas to create one.</p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-auto">
                      {boardBlocks.map((block) => (
                        <Popover key={block.id}>
                          <PopoverTrigger>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors cursor-pointer">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{block.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{block.model_id || 'No model selected'}</p>
                              </div>
                              <span className="key-icon-3d p-1.5 rounded-lg ml-2">
                                <Settings className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 space-y-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" side="left" align="start">
                            <div className="font-semibold text-sm">{block.title} Settings</div>
                            
                            {/* Title */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Title</Label>
                              {editingBlockId === block.id ? (
                                <div className="flex gap-2">
                                  <Input
                                    value={blockTitle}
                                    onChange={(e) => setBlockTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleBlockTitleSave(block.id)}
                                    className="bg-secondary/50 rounded-lg border-border/30 h-9"
                                    autoFocus
                                  />
                                  <button className="key-icon-3d p-2 rounded-lg" onClick={() => handleBlockTitleSave(block.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setBlockTitle(block.title); setEditingBlockId(block.id); }}
                                  className="w-full text-left p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-between group text-sm"
                                >
                                  <span>{block.title}</span>
                                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              )}
                            </div>

                            {/* Model */}
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Model</Label>
                              <Select
                                value={block.model_id}
                                onValueChange={(value) => handleModelChange(block.id, value)}
                                disabled={switchingBlockId === block.id}
                              >
                                <SelectTrigger className="bg-secondary/40 rounded-lg border-border/20 h-9">
                                  {switchingBlockId === block.id ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span className="text-xs">Switching...</span>
                                    </div>
                                  ) : (
                                    <SelectValue placeholder="Select model" />
                                  )}
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-lg max-h-60">
                                  {allModels.map(({ model, name, modelName, hasKey }) => (
                                    <SelectItem 
                                      key={model} 
                                      value={model} 
                                      className="rounded-md"
                                      disabled={!hasKey}
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{name}</span>
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
                              <Label className="text-xs text-muted-foreground">System Prompt</Label>
                              <Textarea
                                value={block.system_prompt}
                                onChange={(e) => handleSystemPromptChange(block.id, e.target.value)}
                                className="bg-secondary/40 min-h-[80px] resize-none rounded-lg border-border/20 text-sm"
                                placeholder="You are a helpful assistant..."
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </header>
  );
}
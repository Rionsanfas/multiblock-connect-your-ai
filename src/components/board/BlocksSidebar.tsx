import { useState } from "react";
import { Plus, Box, FileCode, Focus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBoardBlocks, useBlockActions } from "@/hooks/useBoardBlocks";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelSelector } from "./ModelSelector";
import { useConfiguredProviders } from "@/hooks/useApiKeys";
import { MODEL_CONFIGS, type Provider } from "@/types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
interface BlocksSidebarProps {
  boardId: string;
  onCenterView?: () => void;
}

export function BlocksSidebar({ boardId, onCenterView }: BlocksSidebarProps) {
  const boardBlocks = useBoardBlocks(boardId);
  const { createBlock } = useBlockActions(boardId);
  const configuredProviders = useConfiguredProviders();
  const navigate = useNavigate();
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [pendingBlockTitle, setPendingBlockTitle] = useState<string | null>(null);

  const handleCreateWithModel = (title: string = "New Block") => {
    if (configuredProviders.length === 0) {
      toast.error("Please add an API key first", {
        action: {
          label: "Add Key",
          onClick: () => navigate("/api-keys"),
        },
      });
      return;
    }
    setPendingBlockTitle(title);
    setShowModelSelector(true);
  };

  const handleModelSelect = async (modelId: string) => {
    const model = MODEL_CONFIGS.find((m) => m.id === modelId);
    
    // Show toast IMMEDIATELY (optimistic) - don't wait for DB
    toast.success(`Created block with ${model?.name}`);
    setPendingBlockTitle(null);
    
    // Create block in background - UI already updated optimistically
    try {
      await createBlock({
        title: pendingBlockTitle || "New Block",
        model_id: modelId,
        system_prompt: `You are a helpful assistant powered by ${model?.name || "AI"}.`,
        position: { x: 100 + boardBlocks.length * 50, y: 100 + boardBlocks.length * 50 },
      });
    } catch (error) {
      // Rollback toast on failure
      toast.error('Failed to create block');
    }
  };

  const handleAddApiKey = (provider: Provider) => {
    setShowModelSelector(false);
    navigate("/api-keys");
  };

  return (
    <>
      <aside className="fixed left-2 sm:left-4 top-16 sm:top-20 z-50 flex flex-col gap-1.5 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="p-2.5 sm:p-3 rounded-xl btn-3d-shiny text-foreground h-9 w-9 sm:h-10 sm:w-10">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-44 sm:w-48 bg-card/95 backdrop-blur-xl border-border/20 rounded-xl p-1">
            <DropdownMenuItem onClick={() => handleCreateWithModel("New Block")} className="rounded-lg text-xs sm:text-sm">
              <Box className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              New Block
            </DropdownMenuItem>
            <div className="px-2 py-1 text-[10px] sm:text-xs text-muted-foreground font-medium">Quick Templates</div>
            <DropdownMenuItem onClick={() => handleCreateWithModel("Research Assistant")} className="rounded-lg text-xs sm:text-sm">
              <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Research Assistant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateWithModel("Code Reviewer")} className="rounded-lg text-xs sm:text-sm">
              <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Code Reviewer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onCenterView}
              className="p-2.5 sm:p-3 rounded-xl key-icon-3d text-foreground h-9 w-9 sm:h-10 sm:w-10"
            >
              <Focus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Center View</p>
          </TooltipContent>
        </Tooltip>
      </aside>

      <ModelSelector
        open={showModelSelector}
        onOpenChange={setShowModelSelector}
        onSelect={handleModelSelect}
        onAddApiKey={handleAddApiKey}
      />
    </>
  );
}
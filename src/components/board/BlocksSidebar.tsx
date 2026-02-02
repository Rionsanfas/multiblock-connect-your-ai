import { useState } from "react";
import { Plus, Focus } from "lucide-react";
import { useBoardBlocks, useBlockActions } from "@/hooks/useBoardBlocks";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelSelector } from "./ModelSelector";
import { ScopedMemoryPanel } from "./ScopedMemoryPanel";
import { useConfiguredProviders } from "@/hooks/useApiKeys";
import { getChatModels, type Provider } from "@/config/models";
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
          onClick: () => navigate("/settings/keys"),
        },
      });
      return;
    }
    setPendingBlockTitle(title);
    setShowModelSelector(true);
  };

  const handleModelSelect = async (modelId: string) => {
    const chatModels = getChatModels();
    const model = chatModels.find((m) => m.id === modelId);
    
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
    navigate("/settings/keys");
  };

  return (
    <>
      <aside className="fixed left-2 sm:left-4 top-16 sm:top-20 z-50 flex flex-col gap-1.5 sm:gap-2">
      <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleCreateWithModel("New Block")}
              className="p-2.5 sm:p-3 rounded-xl btn-3d-shiny text-foreground h-9 w-9 sm:h-10 sm:w-10"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add Block</p>
          </TooltipContent>
        </Tooltip>
        
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

        {/* Scoped Memory Panel */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ScopedMemoryPanel boardId={boardId} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Board Memory</p>
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
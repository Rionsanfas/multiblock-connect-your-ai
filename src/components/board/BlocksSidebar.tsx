import { useState } from "react";
import { Plus, Box, FileCode, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlocksSidebarProps {
  boardId: string;
}

const BLOCK_TEMPLATES = [
  { title: "Research Assistant", model: "gpt-4o", prompt: "You are a helpful research assistant." },
  { title: "Code Reviewer", model: "claude-3-sonnet", prompt: "You are an expert code reviewer." },
  { title: "Summarizer", model: "gpt-4o-mini", prompt: "Summarize the given content concisely." },
  { title: "Creative Writer", model: "claude-3-opus", prompt: "You are a creative writer." },
];

export function BlocksSidebar({ boardId }: BlocksSidebarProps) {
  const { blocks, createBlock } = useAppStore();
  const boardBlocks = blocks.filter((b) => b.board_id === boardId);

  const handleCreateEmpty = () => {
    const newBlock = createBlock(boardId, {
      title: "New Block",
      position: { x: 100 + boardBlocks.length * 50, y: 100 + boardBlocks.length * 50 },
    });
    toast.success("Block created");
  };

  const handleCreateFromTemplate = (template: typeof BLOCK_TEMPLATES[0]) => {
    createBlock(boardId, {
      title: template.title,
      model: template.model,
      system_prompt: template.prompt,
      position: { x: 100 + boardBlocks.length * 50, y: 100 + boardBlocks.length * 50 },
    });
    toast.success(`Created ${template.title} block`);
  };

  return (
    <aside className="w-64 border-r border-border/20 bg-card/30 backdrop-blur-xl flex flex-col">
      <div className="p-4 border-b border-border/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="soft-primary" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              New Block
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur-xl border-border/30 rounded-xl p-1">
            <DropdownMenuItem onClick={handleCreateEmpty} className="rounded-lg">
              <Box className="h-4 w-4 mr-2" />
              Empty Block
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="rounded-lg">
              <Upload className="h-4 w-4 mr-2" />
              Import Block
            </DropdownMenuItem>
            <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">Templates</div>
            {BLOCK_TEMPLATES.map((template) => (
              <DropdownMenuItem key={template.title} onClick={() => handleCreateFromTemplate(template)} className="rounded-lg">
                <FileCode className="h-4 w-4 mr-2" />
                {template.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-3">
          Blocks ({boardBlocks.length})
        </h3>
        {boardBlocks.map((block) => (
          <BlockListItem key={block.id} block={block} />
        ))}
      </div>
    </aside>
  );
}

function BlockListItem({ block }: { block: { id: string; title: string; model: string } }) {
  const { selectBlock, selectedBlockId, openBlockChat } = useAppStore();
  const isSelected = selectedBlockId === block.id;

  return (
    <div
      className={cn(
        "p-3 rounded-xl cursor-pointer transition-all duration-200",
        isSelected 
          ? "bg-foreground text-background shadow-[0_4px_12px_rgba(0,0,0,0.15)]" 
          : "bg-secondary/40 hover:bg-secondary/60"
      )}
      onClick={() => selectBlock(block.id)}
      onDoubleClick={() => openBlockChat(block.id)}
    >
      <h4 className={cn("font-medium text-sm truncate", isSelected && "text-background")}>{block.title}</h4>
      <p className={cn("text-xs mt-1", isSelected ? "text-background/70" : "text-muted-foreground")}>{block.model}</p>
    </div>
  );
}

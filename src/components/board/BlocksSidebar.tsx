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
    <aside className="w-64 border-r border-border/10 bg-card/50 backdrop-blur-xl flex flex-col">
      <div className="p-4 border-b border-border/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full gap-2 btn-3d-shiny text-foreground font-medium rounded-xl py-3">
              <Plus className="h-4 w-4" />
              New Block
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur-xl border-border/20 rounded-xl p-1">
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
        "sidebar-nav-item group relative p-3 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden",
        isSelected 
          ? "bg-secondary/60 text-foreground" 
          : "bg-secondary/30 hover:bg-secondary/50"
      )}
      onClick={() => selectBlock(block.id)}
      onDoubleClick={() => openBlockChat(block.id)}
    >
      {/* Gold highlight indicator */}
      <span
        className={cn(
          "sidebar-indicator absolute right-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-l-full transition-all duration-500 ease-out",
          isSelected
            ? "bg-gradient-to-b from-[hsl(var(--accent))] via-[hsl(var(--glow-warm))] to-[hsl(var(--accent))] opacity-100 shadow-[0_0_12px_hsl(var(--accent)/0.6)]"
            : "bg-transparent opacity-0 group-hover:opacity-40 group-hover:bg-[hsl(var(--accent)/0.5)]"
        )}
        style={{
          animation: isSelected ? "slideInFromLeft 0.5s ease-out forwards" : "none"
        }}
      />
      <h4 className={cn("font-medium text-sm truncate", isSelected && "text-[hsl(var(--accent))]")}>{block.title}</h4>
      <p className={cn("text-xs mt-1", isSelected ? "text-muted-foreground" : "text-muted-foreground/70")}>{block.model}</p>
    </div>
  );
}
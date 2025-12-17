import { useState } from "react";
import { Plus, Box, FileCode, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { blocks, createBlock } = useAppStore();
  const boardBlocks = blocks.filter((b) => b.board_id === boardId);

  const handleCreateEmpty = () => {
    createBlock(boardId, {
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
    <aside className={cn(
      "border-r border-border/10 bg-card/50 backdrop-blur-xl flex flex-col transition-all duration-300 relative",
      isCollapsed ? "w-14" : "w-52"
    )}>
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 z-10 p-2.5 rounded-full btn-3d-shiny border border-border/20 transition-all duration-200 hover:scale-110"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4 icon-3d" /> : <ChevronLeft className="h-4 w-4 icon-3d" />}
      </button>

      {!isCollapsed && (
        <>
          <div className="p-3 border-b border-border/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full gap-2 btn-3d-shiny text-foreground font-medium rounded-xl py-2.5 text-sm">
                  <Plus className="h-4 w-4" />
                  New Block
                  <ChevronDown className="h-3 w-3 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-card/95 backdrop-blur-xl border-border/20 rounded-xl p-1">
                <DropdownMenuItem onClick={handleCreateEmpty} className="rounded-lg text-sm">
                  <Box className="h-4 w-4 mr-2" />
                  Empty Block
                </DropdownMenuItem>
                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Templates</div>
                {BLOCK_TEMPLATES.map((template) => (
                  <DropdownMenuItem key={template.title} onClick={() => handleCreateFromTemplate(template)} className="rounded-lg text-sm">
                    <FileCode className="h-4 w-4 mr-2" />
                    {template.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
              Blocks ({boardBlocks.length})
            </h3>
            {boardBlocks.map((block) => (
              <BlockListItem key={block.id} block={block} />
            ))}
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center pt-12 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2.5 rounded-xl btn-3d-shiny text-foreground">
                <Plus className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-48 bg-card/95 backdrop-blur-xl border-border/20 rounded-xl p-1">
              <DropdownMenuItem onClick={handleCreateEmpty} className="rounded-lg text-sm">
                <Box className="h-4 w-4 mr-2" />
                Empty Block
              </DropdownMenuItem>
              <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Templates</div>
              {BLOCK_TEMPLATES.map((template) => (
                <DropdownMenuItem key={template.title} onClick={() => handleCreateFromTemplate(template)} className="rounded-lg text-sm">
                  <FileCode className="h-4 w-4 mr-2" />
                  {template.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-xs text-muted-foreground mt-1">{boardBlocks.length}</span>
        </div>
      )}
    </aside>
  );
}

function BlockListItem({ block }: { block: { id: string; title: string; model: string } }) {
  const { selectBlock, selectedBlockId, openBlockChat } = useAppStore();
  const isSelected = selectedBlockId === block.id;

  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-200 overflow-hidden",
        isSelected ? "btn-soft-active" : "btn-soft"
      )}
      style={{ padding: "0.75rem 1rem" }}
      onClick={() => selectBlock(block.id)}
      onDoubleClick={() => openBlockChat(block.id)}
    >
      <h4 className={cn(
        "font-medium text-sm truncate",
        isSelected ? "text-[hsl(var(--accent))]" : "text-foreground"
      )}>{block.title}</h4>
      <p className="text-xs mt-0.5 text-muted-foreground/70">{block.model}</p>
    </div>
  );
}
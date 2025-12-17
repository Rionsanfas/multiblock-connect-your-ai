import { Plus, Box, FileCode, Focus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BlocksSidebarProps {
  boardId: string;
  onCenterView?: () => void;
}

const BLOCK_TEMPLATES = [
  { title: "Research Assistant", model: "gpt-4o", prompt: "You are a helpful research assistant." },
  { title: "Code Reviewer", model: "claude-3-sonnet", prompt: "You are an expert code reviewer." },
  { title: "Summarizer", model: "gpt-4o-mini", prompt: "Summarize the given content concisely." },
  { title: "Creative Writer", model: "claude-3-opus", prompt: "You are a creative writer." },
];

export function BlocksSidebar({ boardId, onCenterView }: BlocksSidebarProps) {
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
    <aside className="absolute left-4 top-4 z-20 flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-3 rounded-xl btn-3d-shiny text-foreground">
            <Plus className="h-5 w-5" />
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
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onCenterView}
            className="p-2 rounded-xl key-icon-3d text-foreground"
          >
            <Focus className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Center View</p>
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}
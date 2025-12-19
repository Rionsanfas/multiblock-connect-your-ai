import { useState, useRef, useEffect } from "react";
import { Copy, Trash2, MoreHorizontal, MessageSquare, GripVertical, Move, Settings } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { BlockTransferDialog } from "./BlockTransferDialog";
import { useAppStore } from "@/store/useAppStore";
import { getModelConfig } from "@/types";
import { api } from "@/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Block } from "@/types";

interface BlockCardProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onStartConnection: () => void;
  onEndConnection: () => void;
  isConnecting: boolean;
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 120;
const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 160;

export function BlockCard({
  block,
  isSelected,
  onSelect,
  onStartConnection,
  onEndConnection,
  isConnecting,
}: BlockCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [isHoveringResize, setIsHoveringResize] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [size, setSize] = useState({ 
    width: block.config?.width || DEFAULT_WIDTH, 
    height: block.config?.height || DEFAULT_HEIGHT 
  });
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startBlockPos = useRef({ x: 0, y: 0 });

  const { updateBlockPosition, duplicateBlock, deleteBlock, openBlockChat, messages, zoom, updateBlock } = useAppStore();

  const blockMessages = messages.filter((m) => m.block_id === block.id);
  const lastMessage = blockMessages[blockMessages.length - 1];

  // Use canonical model config to get provider
  const modelConfig = block.model_id ? getModelConfig(block.model_id) : null;
  const provider = modelConfig?.provider || null;
  const needsModelSelection = !block.model_id || !modelConfig;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag")) return;
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false);
    startPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = {
      x: e.clientX / zoom - block.position.x,
      y: e.clientY / zoom - block.position.y,
    };
    onSelect();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isResizing) {
      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      if (dx > 3 || dy > 3) {
        setHasDragged(true);
      }
      
      const newX = e.clientX / zoom - dragOffset.current.x;
      const newY = e.clientY / zoom - dragOffset.current.y;
      
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        updateBlockPosition(block.id, { x: newX, y: newY });
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!hasDragged && !isResizing) {
      openBlockChat(block.id);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeCorner(corner);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height };
    startBlockPos.current = { x: block.position.x, y: block.position.y };
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeCorner) return;
    
    const deltaX = (e.clientX - startPos.current.x) / zoom;
    const deltaY = (e.clientY - startPos.current.y) / zoom;
    
    let newWidth = startSize.current.width;
    let newHeight = startSize.current.height;
    let newX = startBlockPos.current.x;
    let newY = startBlockPos.current.y;
    
    // All corners resize proportionally from opposite corner
    if (resizeCorner === 'se') {
      newWidth = Math.max(MIN_WIDTH, startSize.current.width + deltaX);
      newHeight = Math.max(MIN_HEIGHT, startSize.current.height + deltaY);
    } else if (resizeCorner === 'sw') {
      const widthDelta = Math.min(deltaX, startSize.current.width - MIN_WIDTH);
      newWidth = startSize.current.width - widthDelta;
      newX = startBlockPos.current.x + widthDelta;
      newHeight = Math.max(MIN_HEIGHT, startSize.current.height + deltaY);
    } else if (resizeCorner === 'ne') {
      newWidth = Math.max(MIN_WIDTH, startSize.current.width + deltaX);
      const heightDelta = Math.min(deltaY, startSize.current.height - MIN_HEIGHT);
      newHeight = startSize.current.height - heightDelta;
      newY = startBlockPos.current.y + heightDelta;
    } else if (resizeCorner === 'nw') {
      const widthDelta = Math.min(deltaX, startSize.current.width - MIN_WIDTH);
      newWidth = startSize.current.width - widthDelta;
      newX = startBlockPos.current.x + widthDelta;
      const heightDelta = Math.min(deltaY, startSize.current.height - MIN_HEIGHT);
      newHeight = startSize.current.height - heightDelta;
      newY = startBlockPos.current.y + heightDelta;
    } else if (resizeCorner === 'e') {
      newWidth = Math.max(MIN_WIDTH, startSize.current.width + deltaX);
    } else if (resizeCorner === 'w') {
      const widthDelta = Math.min(deltaX, startSize.current.width - MIN_WIDTH);
      newWidth = startSize.current.width - widthDelta;
      newX = startBlockPos.current.x + widthDelta;
    }
    
    requestAnimationFrame(() => {
      setSize({ width: newWidth, height: newHeight });
      updateBlockPosition(block.id, { x: newX, y: newY });
    });
  };

  const handleResizeEnd = () => {
    if (isResizing) {
      updateBlock(block.id, { config: { ...block.config, width: size.width, height: size.height } });
    }
    setIsResizing(false);
    setResizeCorner(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, zoom]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, resizeCorner, zoom]);

  const handleRun = async () => {
    setIsRunning(true);
    toast.info("Running block...");
    
    const result = await api.blocks.run(block.id, "Continue the conversation", (chunk) => {});
    
    if (result.success) {
      toast.success("Block completed");
    } else {
      toast.error(result.error || "Run failed");
    }
    setIsRunning(false);
  };

  const handleDeleteBlock = () => {
    deleteBlock(block.id);
    toast.success("Block deleted");
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "block-card absolute select-none transition-shadow duration-150",
            isDragging ? "cursor-grabbing z-50" : "cursor-move",
            isResizing && "z-50",
            isSelected ? "btn-soft-active" : "btn-soft"
          )}
          style={{
            left: block.position.x,
            top: block.position.y,
            width: size.width,
            padding: 0,
            boxShadow: isDragging 
              ? "0 20px 60px rgba(0,0,0,0.35), 0 0 24px hsl(var(--accent)/0.25)" 
              : isSelected 
                ? "0 8px 32px rgba(0,0,0,0.2), 0 0 16px hsl(var(--accent)/0.15)" 
                : undefined,
            willChange: isDragging ? "transform" : "auto",
          }}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onMouseEnter={() => setIsHoveringResize(true)}
          onMouseLeave={() => !isResizing && setIsHoveringResize(false)}
        >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/15">
        <div className="p-1 rounded-lg bg-secondary/40">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <h3 className={cn(
          "font-semibold flex-1 truncate text-sm",
          isSelected && "text-[hsl(var(--accent))]"
        )}>{block.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton variant="ghost" size="sm" className="no-drag h-8 w-8">
              <MoreHorizontal className="h-5 w-5" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl">
            <DropdownMenuItem onClick={() => openBlockChat(block.id)} className="rounded-lg text-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Open Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateBlock(block.id)} className="rounded-lg text-sm">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowTransferDialog(true)} className="rounded-lg text-sm">
              <Move className="h-4 w-4 mr-2" />
              Copy/Move to Board
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => deleteBlock(block.id)} className="text-destructive rounded-lg text-sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Preview */}
      <div className="px-3 py-3 flex-1 overflow-hidden" style={{ minHeight: size.height - 100 }}>
        {lastMessage ? (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {lastMessage.content}
          </p>
        ) : needsModelSelection ? (
          <p className="text-xs text-amber-500/80 italic">
            Select a model to start chatting
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">
            Click to chat
          </p>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/15 bg-secondary/10 rounded-b-2xl">
        {provider ? (
          <ProviderBadge provider={provider} model={modelConfig?.name || block.model_id} />
        ) : (
          <span className="text-xs text-amber-500">No model selected</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          disabled={isRunning}
          className={cn(
            "no-drag px-2.5 py-1 text-xs font-medium rounded-lg transition-all",
            isRunning 
              ? "bg-gradient-to-r from-[hsl(35,60%,55%)] via-[hsl(40,70%,60%)] to-[hsl(35,60%,55%)] text-foreground animate-pulse shadow-[0_0_8px_hsl(40,70%,50%/0.4)]"
              : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {isRunning ? "running..." : "rerun"}
        </button>
      </div>

      {/* Connection Nodes */}
      <div
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground border-2 border-background cursor-crosshair hover:scale-125 transition-transform no-drag shadow-lg"
        onMouseDown={(e) => { e.stopPropagation(); onStartConnection(); }}
        onMouseUp={(e) => { e.stopPropagation(); if (isConnecting) onEndConnection(); }}
      />
      <div
        className={cn(
          "absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-foreground bg-background transition-all no-drag shadow-lg",
          isConnecting && "scale-125 bg-foreground/20"
        )}
        onMouseUp={(e) => { e.stopPropagation(); if (isConnecting) onEndConnection(); }}
      />

      {/* Single floating resize handle - top right corner only */}
      {(isSelected || isHoveringResize) && (
        <div
          className={cn(
            "absolute w-5 h-5 rounded-full cursor-ne-resize no-drag transition-all duration-300",
            "bg-foreground/50 shadow-[0_4px_16px_rgba(0,0,0,0.6)]",
            "hover:bg-foreground/80 hover:scale-125 hover:shadow-[0_6px_20px_rgba(0,0,0,0.7)]"
          )}
          style={{ top: -14, right: -14 }}
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
      )}

      {/* Block Transfer Dialog */}
      <BlockTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        blockId={block.id}
        currentBoardId={block.board_id}
      />
        </div>
      </ContextMenuTrigger>
      
      {/* Right-click context menu */}
      <ContextMenuContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl min-w-[180px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <ContextMenuItem 
          onClick={() => openBlockChat(block.id)}
          className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
        >
          <MessageSquare className="h-4 w-4" />
          Open Chat
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => onSelect()}
          className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
        >
          <Settings className="h-4 w-4" />
          Block Settings
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => duplicateBlock(block.id)}
          className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={handleDeleteBlock}
          className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete Block
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

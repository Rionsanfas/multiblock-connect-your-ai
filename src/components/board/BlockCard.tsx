import { useState, useRef, useEffect } from "react";
import { Play, Copy, Trash2, MoreHorizontal, MessageSquare, GripVertical } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconButton } from "@/components/ui/icon-button";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
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

export function BlockCard({
  block,
  isSelected,
  onSelect,
  onStartConnection,
  onEndConnection,
  isConnecting,
}: BlockCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const { updateBlockPosition, duplicateBlock, deleteBlock, openBlockChat, messages } = useAppStore();

  const blockMessages = messages.filter((m) => m.block_id === block.id);
  const lastMessage = blockMessages[blockMessages.length - 1];

  const getProviderFromModel = (model: string) => {
    if (model.includes("gpt")) return "openai";
    if (model.includes("claude")) return "anthropic";
    if (model.includes("gemini")) return "google";
    if (model.includes("pplx")) return "perplexity";
    if (model.includes("grok")) return "xai";
    return "openai";
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag")) return;
    e.stopPropagation();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - block.position.x,
      y: e.clientY - block.position.y,
    };
    onSelect();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updateBlockPosition(block.id, {
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
  }, [isDragging]);

  const handleRun = async () => {
    setIsRunning(true);
    toast.info("Running block...");
    
    const result = await api.blocks.run(block.id, "Continue the conversation", (chunk) => {
      // Streaming handled by store
    });
    
    if (result.success) {
      toast.success("Block completed");
    } else {
      toast.error(result.error || "Run failed");
    }
    setIsRunning(false);
  };

  return (
    <div
      className={cn(
        "absolute w-[300px] cursor-move select-none transition-all duration-200",
        "bg-card/60 backdrop-blur-xl rounded-2xl border border-border/20",
        "shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
        isDragging && "shadow-[0_16px_48px_rgba(0,0,0,0.15)] z-50 scale-[1.02]",
        isSelected && "ring-2 ring-foreground/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      )}
      style={{
        left: block.position.x,
        top: block.position.y,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => openBlockChat(block.id)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border/20">
        <div className="p-1 rounded-lg bg-secondary/50">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="font-semibold flex-1 truncate">{block.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton variant="ghost" size="sm" className="no-drag h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl">
            <DropdownMenuItem onClick={() => openBlockChat(block.id)} className="rounded-lg">
              <MessageSquare className="h-4 w-4 mr-2" />
              Open Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateBlock(block.id)} className="rounded-lg">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteBlock(block.id)} className="text-destructive rounded-lg">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Preview */}
      <div className="p-4 min-h-[80px]">
        {lastMessage ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {lastMessage.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            Double-click to start chatting
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-border/20 bg-secondary/20 rounded-b-2xl">
        <ProviderBadge provider={getProviderFromModel(block.model)} model={block.model} />
        <button
          onClick={(e) => { e.stopPropagation(); handleRun(); }}
          disabled={isRunning}
          className={cn(
            "no-drag px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
            "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground",
            isRunning && "animate-pulse"
          )}
        >
          {isRunning ? "running..." : "rerun"}
        </button>
      </div>

      {/* Connection Nodes */}
      <div
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-foreground border-2 border-background cursor-crosshair hover:scale-125 transition-transform no-drag shadow-lg"
        onMouseDown={(e) => { e.stopPropagation(); onStartConnection(); }}
        onMouseUp={(e) => { e.stopPropagation(); if (isConnecting) onEndConnection(); }}
      />
      <div
        className={cn(
          "absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-foreground bg-background transition-all no-drag shadow-lg",
          isConnecting && "scale-125 bg-foreground/20"
        )}
        onMouseUp={(e) => { e.stopPropagation(); if (isConnecting) onEndConnection(); }}
      />
    </div>
  );
}

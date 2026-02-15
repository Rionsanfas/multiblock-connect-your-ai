import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Check,
  Pencil,
  HelpCircle,
  Home,
  Download,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { boardsDb, blocksDb, messagesDb } from "@/lib/database";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TopBarProps {
  boardId?: string;
  boardTitle?: string;
  showBoardControls?: boolean;
}

export function TopBar({ boardId, boardTitle, showBoardControls = false }: TopBarProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(boardTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();
  
  const {
    zoom,
    setZoom,
  } = useAppStore();

  const handleExportChats = async () => {
    if (!boardId) return;
    setIsExporting(true);
    try {
      const blocks = await blocksDb.getForBoard(boardId);
      const exportData = await Promise.all(
        blocks.map(async (block) => {
          const messages = await messagesDb.getForBlock(block.id);
          return {
            block_id: block.id,
            block_title: block.title || 'Untitled Block',
            model: block.model_id,
            provider: block.provider,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
              created_at: m.created_at,
              ...(m.meta && Object.keys(m.meta).length > 0 ? { meta: m.meta } : {}),
            })),
          };
        })
      );

      const payload = {
        board_title: boardTitle || 'Untitled Board',
        exported_at: new Date().toISOString(),
        blocks: exportData,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(boardTitle || 'board').replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Board chats exported');
    } catch (error) {
      toast.error('Failed to export chats');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTitleSave = async () => {
    if (boardId && title.trim() && !isSaving) {
      setIsSaving(true);
      try {
        // Save to Supabase
        await boardsDb.update(boardId, { name: title.trim() });
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['workspace-boards'] });
        queryClient.invalidateQueries({ queryKey: ['user-boards'] });
        toast.success("Board title updated");
      } catch (error) {
        toast.error("Failed to update board title");
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  return (
    <header className="h-12 sm:h-14 md:h-16 flex items-center justify-between px-2 sm:px-3 md:px-5 gap-1.5 sm:gap-2 md:gap-4">
      {/* Left section */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
        {showBoardControls && (
          <button
            onClick={() => navigate("/dashboard")}
            className="key-icon-3d p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}

        {/* Home link - hidden on very small screens when showing board controls */}
        <Link
          to="/"
          className={cn(
            "key-icon-3d p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0",
            showBoardControls && "hidden xs:flex"
          )}
        >
          <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Link>

        {showBoardControls && boardTitle && (
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                  className="h-8 sm:h-10 w-full max-w-[200px] sm:max-w-[300px] bg-secondary/50 rounded-lg sm:rounded-xl border-border/20 text-sm"
                  autoFocus
                />
                <button onClick={handleTitleSave} className="key-icon-3d p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg font-semibold hover:text-[hsl(var(--accent))] transition-colors group min-w-0"
              >
                <span className="truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[250px] md:max-w-none">{boardTitle}</span>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center section - Zoom controls - hidden on mobile (shown in floating controls instead) */}
      {showBoardControls && (
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
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
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {showBoardControls && (
          <>
            {/* Export Board Chats */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="key-icon-3d p-2 sm:p-2.5 rounded-lg sm:rounded-xl h-8 w-8 sm:h-auto sm:w-auto"
                  title="Export Board Chats"
                  onClick={handleExportChats}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Export all chats</p>
              </TooltipContent>
            </Tooltip>

            {/* Instructions Popover - shows board usage instructions */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="key-icon-3d p-2 sm:p-2.5 rounded-lg sm:rounded-xl h-8 w-8 sm:h-auto sm:w-auto"
                  title="Board Instructions"
                >
                  <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-80 p-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" side="bottom" align="end">
                <div className="space-y-4">
                  <p className="font-semibold text-sm">How to Use This Board</p>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Create Blocks</p>
                        <p className="text-xs text-muted-foreground">Double-tap the canvas to create a new AI block, or use the + button.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Select a Model</p>
                        <p className="text-xs text-muted-foreground">Click on a block and choose an AI model (GPT, Claude, Gemini, etc.)</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Start Chatting</p>
                        <p className="text-xs text-muted-foreground">Tap on a block to open the chat interface and start a conversation.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent">4</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Connect Blocks</p>
                        <p className="text-xs text-muted-foreground">Drag from a block's handle to another block to create a connection. Responses flow automatically.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-border/20 pt-3">
                    <p className="text-[10px] text-muted-foreground">
                      💡 Tip: Pinch to zoom, drag to pan around the canvas.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </header>
  );
}
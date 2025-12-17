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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store/useAppStore";
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
  const {
    updateBoard,
    zoom,
    setZoom,
    blocks,
    openBlockChat,
  } = useAppStore();

  const boardBlocks = boardId ? blocks.filter((b) => b.board_id === boardId) : [];

  const handleTitleSave = () => {
    if (boardId && title.trim()) {
      updateBoard(boardId, { title: title.trim() });
      toast.success("Board title updated");
    }
    setIsEditing(false);
  };

  return (
    <header className="h-16 flex items-center justify-between px-5 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {showBoardControls && (
          <button
            onClick={() => navigate("/dashboard")}
            className="icon-3d p-2.5 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Home link */}
        <Link
          to="/"
          className="icon-3d p-2.5 rounded-xl"
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
                <button onClick={handleTitleSave} className="icon-3d p-2.5 rounded-xl">
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
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="icon-3d p-1.5 rounded-lg"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-muted-foreground w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="icon-3d p-1.5 rounded-lg"
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
                <button
                  className="icon-3d p-2.5 rounded-xl"
                  title="Board Instructions"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" side="bottom" align="end">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Board Instructions</p>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-muted-foreground">
                    <li>Double-click canvas to create a new block</li>
                    <li>Click a block to open chat</li>
                    <li>Drag blocks to reposition them</li>
                    <li>Connect blocks by dragging from connection nodes</li>
                    <li>Use zoom controls to zoom in/out</li>
                    <li>Alt + drag to pan the canvas</li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>

            {/* Settings Popover - All Blocks */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="icon-3d p-2.5 rounded-xl">
                  <Settings className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" side="bottom" align="end">
                <div className="space-y-3">
                  <p className="font-semibold text-sm">All Blocks</p>
                  {boardBlocks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No blocks yet. Double-click canvas to create one.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {boardBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{block.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{block.model}</p>
                          </div>
                          <button
                            onClick={() => openBlockChat(block.id)}
                            className="icon-3d p-1.5 rounded-lg ml-2"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

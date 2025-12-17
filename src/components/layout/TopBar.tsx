import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  ZoomIn,
  ZoomOut,
  BarChart3,
  Check,
  Pencil,
  HelpCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

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
  } = useAppStore();

  const handleTitleSave = () => {
    if (boardId && title.trim()) {
      updateBoard(boardId, { title: title.trim() });
      toast.success("Board title updated");
    }
    setIsEditing(false);
  };

  const handleShowInstructions = () => {
    toast.info(
      <div className="space-y-2">
        <p className="font-semibold">Board Instructions</p>
        <ul className="text-sm space-y-1 list-disc pl-4">
          <li>Double-click canvas to create a new block</li>
          <li>Click a block to open chat</li>
          <li>Drag blocks to reposition them</li>
          <li>Connect blocks by dragging from connection nodes</li>
          <li>Use zoom controls to zoom in/out</li>
          <li>Alt + drag to pan the canvas</li>
        </ul>
      </div>,
      { duration: 10000 }
    );
  };

  return (
    <header className="h-16 flex items-center justify-between px-5 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {showBoardControls && (
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Home link */}
        <Link
          to="/"
          className="p-2.5 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
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
                <button onClick={handleTitleSave} className="p-2.5 rounded-xl hover:bg-secondary/50 text-foreground">
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
              className="p-1.5 rounded-lg hover:bg-secondary/30 text-muted-foreground hover:text-foreground transition-all"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-muted-foreground w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="p-1.5 rounded-lg hover:bg-secondary/30 text-muted-foreground hover:text-foreground transition-all"
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
            <button
              onClick={handleShowInstructions}
              className="p-2.5 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Board Instructions"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <BarChart3 className="h-4 w-4" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

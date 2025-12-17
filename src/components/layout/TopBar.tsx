import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  ZoomIn,
  ZoomOut,
  BarChart3,
  Check,
  Pencil,
  Link2,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
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
    autoChainEnabled,
    toggleAutoChain,
    snapToGrid,
    toggleSnapToGrid,
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

  const handleExport = async () => {
    if (!boardId) return;
    const data = await api.boards.export(boardId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${boardTitle || "board"}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Board exported successfully");
  };

  return (
    <header className="h-16 border-b border-border/10 bg-card/50 backdrop-blur-xl flex items-center justify-between px-5 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {showBoardControls && (
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2.5 rounded-xl btn-3d text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

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
                <button onClick={handleTitleSave} className="p-2.5 rounded-xl btn-3d text-foreground">
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

      {/* Center section - Board controls */}
      {showBoardControls && (
        <div className="flex items-center gap-1 p-1.5 rounded-xl btn-soft" style={{ padding: "6px" }}>
          {/* Auto-chain toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Auto-chain</span>
            <Switch
              checked={autoChainEnabled}
              onCheckedChange={toggleAutoChain}
            />
          </div>
          
          <div className="w-px h-5 bg-border/20" />
          
          {/* Snap toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Snap</span>
            <Switch
              checked={snapToGrid}
              onCheckedChange={toggleSnapToGrid}
            />
          </div>

          <div className="w-px h-5 bg-border/20" />

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
            <button className="p-2.5 rounded-xl btn-3d text-muted-foreground hover:text-foreground transition-colors">
              <BarChart3 className="h-4 w-4 icon-3d" />
            </button>
            <button className="p-2.5 rounded-xl btn-3d text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4 icon-3d" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

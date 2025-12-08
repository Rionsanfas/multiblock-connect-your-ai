import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Settings,
  Play,
  Link2,
  ZoomIn,
  ZoomOut,
  BarChart3,
  Grid3X3,
  Check,
  Pencil,
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
    <header className="h-14 border-b border-border/30 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {showBoardControls && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            tooltip="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </IconButton>
        )}

        {showBoardControls && boardTitle && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                  className="h-8 w-48 bg-secondary/50"
                  autoFocus
                />
                <IconButton size="sm" onClick={handleTitleSave}>
                  <Check className="h-4 w-4" />
                </IconButton>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors group"
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
        <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-1.5">
          <div className="flex items-center gap-2 pr-3 border-r border-border/30">
            <span className="text-xs text-muted-foreground">Auto-chain</span>
            <Switch
              checked={autoChainEnabled}
              onCheckedChange={toggleAutoChain}
              className="h-4 w-7"
            />
          </div>
          
          <div className="flex items-center gap-2 pr-3 border-r border-border/30">
            <span className="text-xs text-muted-foreground">Snap</span>
            <Switch
              checked={snapToGrid}
              onCheckedChange={toggleSnapToGrid}
              className="h-4 w-7"
            />
          </div>

          <div className="flex items-center gap-1">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setZoom(zoom - 0.25)}
              tooltip="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </IconButton>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setZoom(zoom + 0.25)}
              tooltip="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center gap-2">
        {showBoardControls && (
          <>
            <IconButton variant="ghost" tooltip="Analytics">
              <BarChart3 className="h-4 w-4" />
            </IconButton>
            <IconButton variant="ghost" tooltip="Settings">
              <Settings className="h-4 w-4" />
            </IconButton>
            <IconButton variant="ghost" onClick={handleExport} tooltip="Export">
              <Download className="h-4 w-4" />
            </IconButton>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Play className="h-4 w-4" />
              Run All
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

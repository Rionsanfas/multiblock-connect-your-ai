import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Settings,
  Play,
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
    <header className="h-16 border-b border-border/20 bg-card/30 backdrop-blur-xl flex items-center justify-between px-5 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {showBoardControls && (
          <IconButton
            variant="soft"
            size="md"
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
                  className="h-10 w-56 bg-secondary/50 rounded-xl border-border/30"
                  autoFocus
                />
                <IconButton variant="soft" size="md" onClick={handleTitleSave}>
                  <Check className="h-4 w-4" />
                </IconButton>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors group"
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
        <div className="flex items-center gap-1 bg-secondary/40 rounded-2xl p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Auto-chain toggle */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-secondary/60 transition-colors">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Auto-chain</span>
            <Switch
              checked={autoChainEnabled}
              onCheckedChange={toggleAutoChain}
              className="data-[state=checked]:bg-foreground"
            />
          </div>
          
          <div className="w-px h-6 bg-border/30" />
          
          {/* Snap toggle */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-secondary/60 transition-colors">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Snap</span>
            <Switch
              checked={snapToGrid}
              onCheckedChange={toggleSnapToGrid}
              className="data-[state=checked]:bg-foreground"
            />
          </div>

          <div className="w-px h-6 bg-border/30" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1 px-2">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              tooltip="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </IconButton>
            <span className="text-xs font-semibold text-muted-foreground w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
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
            <IconButton variant="soft" tooltip="Analytics">
              <BarChart3 className="h-4 w-4" />
            </IconButton>
            <IconButton variant="soft" tooltip="Settings">
              <Settings className="h-4 w-4" />
            </IconButton>
            <IconButton variant="soft" onClick={handleExport} tooltip="Export">
              <Download className="h-4 w-4" />
            </IconButton>
            <Button variant="soft-primary" size="default" className="gap-2 ml-2">
              <Play className="h-4 w-4" />
              Run All
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

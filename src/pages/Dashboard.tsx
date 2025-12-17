import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, List, MoreHorizontal, Copy, Trash2, FolderOpen } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
import { toast } from "sonner";
import type { Board } from "@/types";
import { StorageUsageCard } from "@/components/dashboard/StorageUsageCard";
import { PlanUsageCard } from "@/components/dashboard/PlanUsageCard";
import { mockUser } from "@/mocks/seed";

export default function Dashboard() {
  const navigate = useNavigate();
  const { boards, blocks, deleteBoard, isAuthenticated } = useAppStore();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const filteredBoards = useMemo(() => {
    return boards.filter((b) =>
      b.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [boards, search]);

  const handleCreateBoard = async () => {
    const board = await api.boards.create("Untitled Board");
    toast.success("Board created");
    navigate(`/board/${board.id}`);
  };

  const handleDuplicate = async (id: string) => {
    await api.boards.duplicate(id);
    toast.success("Board duplicated");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.boards.delete(deleteId);
    toast.success("Board deleted");
    setDeleteId(null);
  };

  const getBlockCount = (boardId: string) => blocks.filter((b) => b.board_id === boardId).length;

  // TODO: Replace mockUser with actual user from Supabase auth
  const user = mockUser;

  return (
    <DashboardLayout>
      <div className="flex h-full">
      {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Usage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <PlanUsageCard
              planId={user.plan}
              boardsUsed={user.boards_used}
              boardsLimit={user.boards_limit}
              seatsUsed={user.seats_used}
              seatsLimit={user.seats}
            />
            <StorageUsageCard
              usedMb={user.storage_used_mb}
              limitMb={user.storage_limit_mb}
            />
            <div className="flex flex-col justify-center items-center h-full">
              <Button onClick={handleCreateBoard} className="gap-2 btn-gold-edge text-foreground font-medium rounded-xl py-3 px-6">
                <Plus className="h-4 w-4" />
                New Board
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {user.boards_limit - user.boards_used} boards remaining
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Your Boards</h1>
              <p className="text-muted-foreground">{boards.length} boards</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4 mb-6">
            <SearchBar
              placeholder="Search boards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              className="flex-1 max-w-sm"
            />
            <div className="flex items-center gap-1 p-1 rounded-xl btn-soft" style={{ padding: "4px" }}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === "grid" ? "bg-gradient-to-r from-[hsl(35,60%,55%)] via-[hsl(40,70%,60%)] to-[hsl(35,60%,55%)] text-foreground shadow-[0_0_12px_hsl(40,70%,50%/0.5)] bg-[length:200%_100%] animate-[goldShimmer_2s_ease-in-out_infinite]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === "list" ? "bg-gradient-to-r from-[hsl(35,60%,55%)] via-[hsl(40,70%,60%)] to-[hsl(35,60%,55%)] text-foreground shadow-[0_0_12px_hsl(40,70%,50%/0.5)] bg-[length:200%_100%] animate-[goldShimmer_2s_ease-in-out_infinite]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Boards Grid/List */}
          {filteredBoards.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No boards yet"
              description="Create your first board to start building AI workflows"
              action={
                <Button onClick={handleCreateBoard} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl">
                  <Plus className="h-4 w-4" />
                  Create Board
                </Button>
              }
            />
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {filteredBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  blockCount={getBlockCount(board.id)}
                  viewMode={viewMode}
                  onOpen={() => navigate(`/board/${board.id}`)}
                  onDuplicate={() => handleDuplicate(board.id)}
                  onDelete={() => setDeleteId(board.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Board"
        description="Are you sure you want to delete this board? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

function BoardCard({
  board,
  blockCount,
  viewMode,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  board: Board;
  blockCount: number;
  viewMode: "grid" | "list";
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <GlassCard
      variant="hover"
      className={`cursor-pointer group ${viewMode === "list" ? "flex items-center justify-between p-4" : "p-5"}`}
      onClick={onOpen}
    >
      <div className={viewMode === "list" ? "flex items-center gap-4" : ""}>
        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
          {board.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span>{blockCount} blocks</span>
          <span>•</span>
          <span>{new Date(board.updated_at).toLocaleDateString()}</span>
        </div>
        {board.metadata.tags && viewMode === "grid" && (
          <div className="flex gap-2 mt-3">
            {board.metadata.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs bg-secondary rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="p-2 hover:bg-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </GlassCard>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, List, MoreHorizontal, Copy, Trash2, FolderOpen } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useCurrentUser, useUserBoards, useUserStats } from "@/hooks/useCurrentUser";
import { useBoardUsage, formatBytes } from "@/hooks/useBlockMessages";
import { usePlanEnforcement } from "@/hooks/usePlanLimits";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { toast } from "sonner";
import type { Board } from "@/types";
import { StorageUsageCard } from "@/components/dashboard/StorageUsageCard";
import { PlanUsageCard } from "@/components/dashboard/PlanUsageCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { blocks } = useAppStore();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const { user, isLoading: userLoading } = useCurrentUser();
  const userBoards = useUserBoards();
  const stats = useUserStats();
  const { enforceCreateBoard, canCreateBoard, boardsRemaining, isFree } = usePlanEnforcement();
  
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredBoards = useMemo(() => {
    return userBoards.filter((b) =>
      b.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [userBoards, search]);

  const handleCreateBoard = async () => {
    // Auth gating - absolute requirement
    if (!authUser?.id) {
      console.error('[Dashboard] Cannot create board: No authenticated user');
      toast.error('Please sign in to create a board');
      return;
    }

    // Enforce plan limits
    if (!enforceCreateBoard()) return;
    
    setIsCreating(true);
    
    try {
      console.log('[Dashboard] Creating board...');
      const board = await api.boards.create("Untitled Board");
      
      // Verify returned board has valid data
      if (!board?.id || !board?.user_id) {
        console.error('[Dashboard] Board creation returned invalid data:', board);
        throw new Error('Board creation failed: Invalid response');
      }
      
      console.log('[Dashboard] Board created successfully:', { 
        id: board.id, 
        user_id: board.user_id,
        title: board.title 
      });
      
      // Invalidate boards query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['user-boards'] });
      await queryClient.invalidateQueries({ queryKey: ['user-board-count'] });
      
      toast.success("Board created");
      
      // Navigate only after confirmed insert with valid ID
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error('[Dashboard] Board creation failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create board");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!authUser?.id) return;
    
    try {
      await api.boards.duplicate(id);
      await queryClient.invalidateQueries({ queryKey: ['user-boards'] });
      toast.success("Board duplicated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate board");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !authUser?.id) return;
    
    try {
      console.log('[Dashboard] Deleting board:', deleteId);
      await api.boards.delete(deleteId);
      await queryClient.invalidateQueries({ queryKey: ['user-boards'] });
      await queryClient.invalidateQueries({ queryKey: ['user-board-count'] });
      console.log('[Dashboard] Board deleted successfully');
      toast.success("Board deleted");
    } catch (error) {
      console.error('[Dashboard] Board deletion failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete board");
    } finally {
      setDeleteId(null);
    }
  };

  const getBlockCount = (boardId: string) => blocks.filter((b) => b.board_id === boardId).length;

  // Auth loading state
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  // Not authenticated - redirect
  if (!isAuthenticated || !authUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Please sign in to continue.</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // User data loading
  if (userLoading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-full">
      {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Usage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <PlanUsageCard
              planId={stats.plan}
              boardsUsed={stats.boardsUsed}
              boardsLimit={stats.boardsLimit}
              seatsUsed={stats.seatsUsed}
              seatsLimit={stats.seatsLimit}
            />
            <StorageUsageCard
              usedMb={stats.storageUsedMb}
              limitMb={stats.storageLimitMb}
            />
            <GlassCard className="flex flex-col justify-center items-center p-6">
              <Button 
                onClick={handleCreateBoard} 
                disabled={!canCreateBoard}
                className="gap-2 btn-glow-edge text-primary font-medium rounded-xl py-3 px-6 bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                New Board
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {boardsRemaining} {boardsRemaining === 1 ? 'board' : 'boards'} remaining
              </p>
              {isFree && !canCreateBoard && (
                <Button 
                  variant="link" 
                  className="text-xs text-primary mt-1 p-0 h-auto"
                  onClick={() => navigate("/pricing")}
                >
                  Upgrade for more
                </Button>
              )}
            </GlassCard>
          </div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Your Boards</h1>
              <p className="text-muted-foreground">{userBoards.length} boards</p>
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
                <LayoutGrid className="h-4 w-4 icon-3d" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === "list" ? "bg-gradient-to-r from-[hsl(35,60%,55%)] via-[hsl(40,70%,60%)] to-[hsl(35,60%,55%)] text-foreground shadow-[0_0_12px_hsl(40,70%,50%/0.5)] bg-[length:200%_100%] animate-[goldShimmer_2s_ease-in-out_infinite]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4 icon-3d" />
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
                <BoardCardWithUsage
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

// Wrapper component that includes usage data
function BoardCardWithUsage(props: {
  board: Board;
  blockCount: number;
  viewMode: "grid" | "list";
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const boardUsage = useBoardUsage(props.board.id);
  return <BoardCard {...props} usage={boardUsage} />;
}

function BoardCard({
  board,
  blockCount,
  viewMode,
  onOpen,
  onDuplicate,
  onDelete,
  usage,
}: {
  board: Board;
  blockCount: number;
  viewMode: "grid" | "list";
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  usage?: { message_count: number; total_bytes: number } | null;
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
          {usage && usage.message_count > 0 && (
            <>
              <span>•</span>
              <span>{usage.message_count} msgs</span>
              <span>•</span>
              <span>{formatBytes(usage.total_bytes)}</span>
            </>
          )}
          <span>•</span>
          <span>{new Date(board.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="p-2 hover:bg-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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

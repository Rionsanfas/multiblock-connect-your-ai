import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, LayoutGrid, List, MoreHorizontal, Copy, Trash2, FolderOpen, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useCurrentUser, useUserStats } from "@/hooks/useCurrentUser";
import { useWorkspaceBoards } from "@/hooks/useWorkspaceBoards";
import { useBoardUsage, formatBytes } from "@/hooks/useBlockMessages";
import { usePlanEnforcement } from "@/hooks/usePlanLimits";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useQueryClient } from "@tanstack/react-query";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useEntitlements } from "@/hooks/useEntitlements";
import { boardsDb } from "@/lib/database";
import { toast } from "sonner";
import type { Board } from "@/types";
import { StorageUsageCard } from "@/components/dashboard/StorageUsageCard";
import { PlanUsageCard } from "@/components/dashboard/PlanUsageCard";
import { BoardTransferDialog } from "@/components/board/BoardTransferDialog";
import { WorkspaceSwitcher } from "@/components/teams/WorkspaceSwitcher";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { blocks } = useAppStore();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { isPersonalWorkspace, currentWorkspace } = useTeamContext();
  const userBoards = useWorkspaceBoards();
  const stats = useUserStats();
  const { enforceCreateBoard, canCreateBoard, boardsRemaining, isFree } = usePlanEnforcement();
  const { refreshSubscription } = useUserSubscription();
  const { refreshEntitlements } = useEntitlements();
  
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [transferBoard, setTransferBoard] = useState<{ id: string; title: string } | null>(null);

  // Handle checkout success redirect from Polar
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      // Refetch subscription and entitlements data
      refreshSubscription();
      refreshEntitlements();
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-entitlements'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['user-boards'] });
      queryClient.invalidateQueries({ queryKey: ['user-board-count'] });
      
      // Show success toast
      toast.success('Plan activated!', {
        description: 'Your subscription has been updated successfully.',
      });
      
      // Remove the query param from URL (clean up)
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription, refreshEntitlements, queryClient]);

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
      // Determine team context - CRITICAL: propagate team_id correctly
      const teamId = currentWorkspace.type === 'team' ? currentWorkspace.teamId : null;
      
      console.log('[Dashboard] Creating board...', { 
        isTeam: currentWorkspace.type === 'team',
        teamId,
        teamName: currentWorkspace.teamName 
      });
      
      // Create board first, THEN navigate (avoids broken optimistic ID)
      const board = await boardsDb.create({ name: "Untitled Board" }, teamId);
      
      // Verify returned board has valid data
      if (!board?.id || !board?.user_id) {
        console.error('[Dashboard] Board creation returned invalid data:', board);
        toast.error('Board creation failed');
        return;
      }
      
      console.log('[Dashboard] Board created successfully:', { 
        id: board.id, 
        user_id: board.user_id,
        team_id: board.team_id,
        name: board.name 
      });
      
      // Optimistic cache update - add to list immediately
      queryClient.setQueryData(['workspace-boards', currentWorkspace.type, currentWorkspace.teamId, authUser.id], (old: unknown) => {
        const arr = Array.isArray(old) ? old : [];
        return [board, ...arr];
      });
      
      // Navigate to actual board
      navigate(`/board/${board.id}`);
      
      toast.success(teamId ? `Board created in ${currentWorkspace.teamName}` : "Board created");
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
      // Get original board
      const original = await boardsDb.getById(id);
      if (!original) throw new Error('Board not found');
      
      // Create duplicate
      await boardsDb.create({ name: `${original.name} (copy)` });
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
      const result = await boardsDb.delete(deleteId);
      
      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }
      
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

  // Auth loading state - show skeleton
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full">
          <div className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <SkeletonCard variant="usage" />
              <SkeletonCard variant="usage" />
              <SkeletonCard variant="usage" />
            </div>
            <SkeletonGrid count={6} variant="board" />
          </div>
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

  // User data loading - show skeleton
  if (userLoading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex h-full">
          <div className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <SkeletonCard variant="usage" />
              <SkeletonCard variant="usage" />
              <SkeletonCard variant="usage" />
            </div>
            <SkeletonGrid count={6} variant="board" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-full">
      {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {/* Header with Workspace Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {isPersonalWorkspace ? "Your Boards" : `${currentWorkspace.teamName} Boards`}
              </h1>
              <p className="text-sm text-muted-foreground">{userBoards.length} boards</p>
            </div>
            <WorkspaceSwitcher />
          </div>

          {/* Usage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <PlanUsageCard boardsUsed={stats.boardsUsed} />
            <StorageUsageCard
              usedMb={stats.storageUsedMb}
              limitMb={stats.storageLimitMb}
            />
            <GlassCard className="flex flex-col justify-center items-center p-4 sm:p-6">
              <Button 
                onClick={handleCreateBoard} 
                disabled={!canCreateBoard}
                className="gap-2 btn-glow-edge text-primary font-medium rounded-xl py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                New Board
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 sm:mt-3">
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

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
            <SearchBar
              placeholder="Search boards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              className="flex-1 sm:max-w-sm"
            />
            <div className="flex items-center gap-1 p-1 rounded-xl btn-soft self-start" style={{ padding: "4px" }}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${viewMode === "grid" ? "bg-gradient-to-r from-[hsl(35,60%,55%)] via-[hsl(40,70%,60%)] to-[hsl(35,60%,55%)] text-foreground shadow-[0_0_12px_hsl(40,70%,50%/0.5)] bg-[length:200%_100%] animate-[goldShimmer_2s_ease-in-out_infinite]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-4 w-4 icon-3d" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${viewMode === "list" ? "bg-gradient-to-r from-[hsl(35,60%,55%)] via-[hsl(40,70%,60%)] to-[hsl(35,60%,55%)] text-foreground shadow-[0_0_12px_hsl(40,70%,50%/0.5)] bg-[length:200%_100%] animate-[goldShimmer_2s_ease-in-out_infinite]" : "text-muted-foreground hover:text-foreground"}`}
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
                <Button onClick={handleCreateBoard} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl text-sm">
                  <Plus className="h-4 w-4" />
                  Create Board
                </Button>
              }
            />
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" : "space-y-2 sm:space-y-3"}>
              {filteredBoards.map((board) => (
                <BoardCardWithUsage
                  key={board.id}
                  board={board}
                  blockCount={getBlockCount(board.id)}
                  viewMode={viewMode}
                  onOpen={() => navigate(`/board/${board.id}`)}
                  onDuplicate={() => handleDuplicate(board.id)}
                  onDelete={() => setDeleteId(board.id)}
                  onTransfer={isPersonalWorkspace ? () => setTransferBoard({ id: board.id, title: board.title }) : undefined}
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

      {transferBoard && (
        <BoardTransferDialog
          boardId={transferBoard.id}
          boardTitle={transferBoard.title}
          open={!!transferBoard}
          onOpenChange={(open) => !open && setTransferBoard(null)}
        />
      )}
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
  onTransfer?: () => void;
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
  onTransfer,
  usage,
}: {
  board: Board;
  blockCount: number;
  viewMode: "grid" | "list";
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTransfer?: () => void;
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
          {onTransfer && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTransfer(); }}>
                <Users className="h-4 w-4 mr-2" />
                Transfer to Team
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
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

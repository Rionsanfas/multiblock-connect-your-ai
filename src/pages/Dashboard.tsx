import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, LayoutGrid, List, MoreHorizontal, Copy, Trash2, FolderOpen, Users, Lock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useWorkspaceBoards } from "@/hooks/useWorkspaceBoards";
import { useWorkspaceStats } from "@/hooks/useWorkspaceStats";
import { useBoardUsage, formatBytes } from "@/hooks/useBlockMessages";
import { usePlanEnforcement } from "@/hooks/usePlanLimits";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useTeamAccess } from "@/hooks/useTeamAccess";
import { useQueryClient } from "@tanstack/react-query";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useDashboardRefresh } from "@/hooks/usePageRefresh";
import { useBoardBlockCounts } from "@/hooks/useBoardBlockCounts";
import { boardsDb, blocksDb } from "@/lib/database";
import { toast } from "sonner";
import type { Board } from "@/types";
import { StorageUsageCard } from "@/components/dashboard/StorageUsageCard";
import { PlanUsageCard } from "@/components/dashboard/PlanUsageCard";
import { BoardTransferDialog } from "@/components/board/BoardTransferDialog";
import { WorkspaceSwitcher } from "@/components/teams/WorkspaceSwitcher";
import { DemoFloatingCard } from "@/components/DemoFloatingCard";
import { OpenClawStatusBar } from "@/components/dashboard/OpenClawStatusBar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { isPersonalWorkspace, currentWorkspace, isTeamWorkspace } = useTeamContext();
  const { hasTeamAccess, isLoading: teamAccessLoading } = useTeamAccess();
  const userBoards = useWorkspaceBoards();
  const workspaceStats = useWorkspaceStats();
  const { enforceCreateBoard, canCreateBoard, boardsRemaining, isFree } = usePlanEnforcement();
  const { refreshSubscription } = useUserSubscription();
  const { refreshEntitlements } = useEntitlements();
  const { getBlockCount } = useBoardBlockCounts();
  
  // Refresh data on page mount
  useDashboardRefresh();
  
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
    
    // Generate optimistic ID for instant navigation
    const optimisticId = crypto.randomUUID();
    const now = new Date().toISOString();
    const teamId = currentWorkspace.type === 'team' ? currentWorkspace.teamId : null;
    
    // Create optimistic board for instant UI
    const optimisticBoard = {
      id: optimisticId,
      name: "Untitled Board",
      user_id: authUser.id,
      team_id: teamId,
      description: null,
      is_archived: false,
      is_public: false,
      canvas_position_x: 0,
      canvas_position_y: 0,
      canvas_zoom: 1,
      created_at: now,
      updated_at: now,
    };
    
    // OPTIMISTIC: Add to cache immediately
    queryClient.setQueryData(['workspace-boards', currentWorkspace.type, currentWorkspace.teamId, authUser.id], (old: unknown) => {
      const arr = Array.isArray(old) ? old : [];
      return [optimisticBoard, ...arr];
    });
    
    // Show success toast IMMEDIATELY (optimistic)
    toast.success(teamId ? `Board created in ${currentWorkspace.teamName}` : "Board created");
    
    // Navigate IMMEDIATELY with optimistic ID
    navigate(`/board/${optimisticId}`);
    setIsCreating(false);
    
    // Create in background and update cache with real ID
    try {
      const board = await boardsDb.create({ name: "Untitled Board" }, teamId);
      
      if (!board?.id || !board?.user_id) {
        throw new Error('Board creation returned invalid data');
      }
      
      console.log('[Dashboard] Board created in DB:', board.id);
      
      // Replace optimistic board with real board in cache
      queryClient.setQueryData(['workspace-boards', currentWorkspace.type, currentWorkspace.teamId, authUser.id], (old: unknown) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.map((b: any) => b.id === optimisticId ? board : b);
      });
      
      // Also cache the board directly for BoardCanvas
      queryClient.setQueryData(['board', board.id], board);
      
      // If user is still on optimistic board, redirect to real board
      if (window.location.pathname === `/board/${optimisticId}`) {
        navigate(`/board/${board.id}`, { replace: true });
      }
    } catch (error) {
      console.error('[Dashboard] Board creation failed:', error);
      
      // Rollback optimistic update
      queryClient.setQueryData(['workspace-boards', currentWorkspace.type, currentWorkspace.teamId, authUser.id], (old: unknown) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.filter((b: any) => b.id !== optimisticId);
      });
      
      toast.error(error instanceof Error ? error.message : "Failed to create board");
      navigate('/dashboard');
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

  // Block counts now come from useBoardBlockCounts hook (fetches from DB)

  // Combine loading states - only show skeleton on initial load, not on refetch
  const isInitialLoading = authLoading || (!user && userLoading);
  
  // Auth loading state - show skeleton only on first load
  if (isInitialLoading) {
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

  // Render immediately with data - don't wait for stats loading
  // Stats will populate as they load (progressive enhancement)

  return (
    <DashboardLayout>
      <div className="flex h-full">
      {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {/* Header with Workspace Switcher - only show switcher if user has team access */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {isPersonalWorkspace ? "Your Boards" : `${currentWorkspace.teamName} Boards`}
              </h1>
              <p className="text-sm text-muted-foreground">{userBoards.length} boards</p>
            </div>
            {/* WorkspaceSwitcher handles its own visibility based on hasTeamAccess */}
            <WorkspaceSwitcher />
          </div>

          {/* OpenClaw Status */}
          <OpenClawStatusBar />

          {/* Usage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <PlanUsageCard 
              boardsUsed={workspaceStats.boardsUsed}
              boardsLimit={workspaceStats.boardsLimit}
              isUnlimitedBoards={workspaceStats.isUnlimitedBoards}
              seatsUsed={workspaceStats.seatsUsed}
              seatsLimit={workspaceStats.seatsLimit}
              workspaceName={workspaceStats.workspaceName}
              isTeamWorkspace={isTeamWorkspace}
            />
            <StorageUsageCard
              usedMb={workspaceStats.storageUsedMb}
              limitMb={workspaceStats.storageLimitMb}
              isUnlimited={workspaceStats.isUnlimitedStorage}
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

      <DemoFloatingCard />
    </DashboardLayout>
  );
}

// Wrapper component that includes usage data and prefetching
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
  const queryClient = useQueryClient();
  
  // Prefetch board data on hover for instant navigation
  const handleMouseEnter = () => {
    // Prefetch the board data
    queryClient.prefetchQuery({
      queryKey: ['board', props.board.id],
      queryFn: () => boardsDb.getById(props.board.id),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
    // Prefetch block data
    queryClient.prefetchQuery({
      queryKey: ['board-blocks', props.board.id],
      queryFn: () => blocksDb.getForBoard(props.board.id),
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  };
  
  return <BoardCard {...props} usage={boardUsage} onMouseEnter={handleMouseEnter} />;
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
  onMouseEnter,
}: {
  board: Board;
  blockCount: number;
  viewMode: "grid" | "list";
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTransfer?: () => void;
  usage?: { message_count: number; total_bytes: number } | null;
  onMouseEnter?: () => void;
}) {
  return (
    <GlassCard
      variant="hover"
      className={`cursor-pointer group ${viewMode === "list" ? "flex items-center justify-between p-3 sm:p-4" : "p-4 sm:p-5"}`}
      onClick={onOpen}
      onMouseEnter={onMouseEnter}
    >
      <div className={viewMode === "list" ? "flex items-center gap-3 sm:gap-4 flex-1 min-w-0" : ""}>
        <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors truncate flex items-center gap-2">
          {board.is_locked && <Lock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
          {board.title}
        </h3>
        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
          <span>{blockCount} blocks</span>
          {usage && usage.message_count > 0 && (
            <>
              <span className="hidden xs:inline">•</span>
              <span className="hidden xs:inline">{usage.message_count} msgs</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{formatBytes(usage.total_bytes)}</span>
            </>
          )}
          <span>•</span>
          <span>{new Date(board.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="p-1.5 sm:p-2 hover:bg-secondary rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 touch-target">
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

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BlockCard } from "@/components/board/BlockCard";
import { ConnectionLine } from "@/components/board/ConnectionLine";
import { BlocksSidebar } from "@/components/board/BlocksSidebar";
import { BlockChatModal } from "@/components/board/BlockChatModal";
import { ConnectionContextMenu } from "@/components/board/ConnectionContextMenu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { useAppStore } from "@/store/useAppStore";
import { useUserBoard } from "@/hooks/useCurrentUser";
import { useBoardBlocks, useBlockActions } from "@/hooks/useBoardBlocks";
import { useBoardConnections, useConnectionActions } from "@/hooks/useBlockConnections";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_BLOCK_WIDTH = 280;
const DEFAULT_BLOCK_HEIGHT = 160;

export default function BoardCanvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [connectionContextMenu, setConnectionContextMenu] = useState<{ connectionId: string; x: number; y: number } | null>(null);

  // Auth gating - ABSOLUTE: no operations until auth resolved
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // Board fetch - only enabled when auth is resolved and user exists
  const { board, isLoading: boardLoading, error: boardError, isForbidden } = useUserBoard(
    // Only pass boardId when auth is fully resolved
    !authLoading && isAuthenticated && user?.id ? id : undefined
  );
  
  // Blocks - only fetch when we have a valid board
  const boardBlocks = useBoardBlocks(board?.id);
  const { createBlock } = useBlockActions(board?.id || '');

  // Connections from Supabase - NOT Zustand
  const { connections: boardConnections } = useBoardConnections(board?.id);
  const { create: createConnection } = useConnectionActions(board?.id || '');

  const {
    selectedBlockId,
    selectBlock,
    setCurrentBoard,
    zoom,
    isBlockChatOpen,
    chatBlockId,
  } = useAppStore();

  const handleCenterView = useCallback(() => {
    if (boardBlocks.length === 0) {
      toast.info("No blocks to center on");
      return;
    }
    
    // Calculate bounding box of all blocks
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    boardBlocks.forEach(block => {
      const width = DEFAULT_BLOCK_WIDTH;
      const height = DEFAULT_BLOCK_HEIGHT;
      minX = Math.min(minX, block.position.x);
      minY = Math.min(minY, block.position.y);
      maxX = Math.max(maxX, block.position.x + width);
      maxY = Math.max(maxY, block.position.y + height);
    });
    
    // Calculate center of all blocks
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Get canvas dimensions
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Calculate pan offset to center the blocks
    const newPanX = (rect.width / 2) - (centerX * zoom);
    const newPanY = (rect.height / 2) - (centerY * zoom);
    
    setPanOffset({ x: newPanX, y: newPanY });
  }, [boardBlocks, zoom]);

  // Sync board to Zustand store only when board ID changes
  const boardIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Only update store when we have a valid board with a different ID
    if (board && board.id !== boardIdRef.current) {
      boardIdRef.current = board.id;
      setCurrentBoard(board);
    }
    
    // Cleanup on unmount
    return () => {
      boardIdRef.current = null;
      setCurrentBoard(null);
    };
  }, [board?.id, setCurrentBoard]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only enable panning on canvas background, not on blocks
    if (target === canvasRef.current || target.classList.contains('board-canvas-bg') || target.closest('.canvas-inner')) {
      if (e.button === 0 && !target.closest('.block-card')) {
        setIsPanning(true);
        setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        selectBlock(null);
      }
    }
  };

  const handleCanvasDoubleClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.classList.contains('board-canvas-bg') || (target.closest('.canvas-inner') && !target.closest('.block-card'))) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        try {
          const newBlock = await createBlock({
            title: "New Block",
            position: { x, y },
            model_id: '', // Empty - requires model selection
          });
          if (newBlock) {
            toast.success("Block created - select a model to start chatting");
          }
        } catch (error) {
          console.error('[BoardCanvas] Failed to create block:', error);
          toast.error(error instanceof Error ? error.message : "Failed to create block");
        }
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only show context menu on empty canvas space
    if (target === canvasRef.current || target.classList.contains('board-canvas-bg') || (target.closest('.canvas-inner') && !target.closest('.block-card'))) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenuPos({
          x: (e.clientX - rect.left - panOffset.x) / zoom,
          y: (e.clientY - rect.top - panOffset.y) / zoom,
        });
      }
    }
  };

  const handleCreateBlockAtContext = async () => {
    try {
      const newBlock = await createBlock({
        title: "New Block",
        position: contextMenuPos,
        model_id: '', // Empty - requires model selection
      });
      if (newBlock) {
        toast.success("Block created - select a model to start chatting");
      }
    } catch (error) {
      console.error('[BoardCanvas] Failed to create block:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create block");
    }
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: (e.clientX - rect.left - panOffset.x) / zoom,
          y: (e.clientY - rect.top - panOffset.y) / zoom,
        });
      }
    }
  }, [isPanning, dragStart, connectingFrom, panOffset, zoom]);

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  };

  const handleStartConnection = (blockId: string) => {
    setConnectingFrom(blockId);
  };

  const handleEndConnection = (toBlockId: string) => {
    if (connectingFrom && connectingFrom !== toBlockId) {
      const exists = boardConnections.some(
        (c) => c.from_block === connectingFrom && c.to_block === toBlockId
      );
      if (!exists) {
        // Use Supabase-backed connection creation
        createConnection(connectingFrom, toBlockId);
        toast.success("Connection created");
      }
    }
    setConnectingFrom(null);
  };

  const handleConnectionContextMenu = (connectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setConnectionContextMenu({ connectionId, x: e.clientX, y: e.clientY });
  };

  const getBlockCenter = (blockId: string) => {
    const block = boardBlocks.find((b) => b.id === blockId);
    if (!block) return { x: 0, y: 0 };
    const width = DEFAULT_BLOCK_WIDTH;
    const height = DEFAULT_BLOCK_HEIGHT;
    return {
      x: block.position.x + width / 2,
      y: block.position.y + height / 2,
    };
  };

  // === STATE HANDLING ===

  // 1. Auth loading - show skeleton
  if (authLoading) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex h-full">
          <div className="w-64 border-r border-border/20 p-4 space-y-3">
            <div className="h-8 w-32 rounded bg-muted/50 animate-pulse" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
          </div>
          <div className="flex-1 p-8">
            <div className="grid grid-cols-3 gap-6">
              <SkeletonCard variant="block" className="h-40" />
              <SkeletonCard variant="block" className="h-40" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. Not authenticated - redirect to auth
  if (!isAuthenticated || !user) {
    // Use effect for navigation to avoid render-phase side effects
    return (
      <DashboardLayout hideSidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access this board.</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 3. Board loading - show skeleton
  if (boardLoading) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex h-full">
          <div className="w-64 border-r border-border/20 p-4 space-y-3">
            <div className="h-8 w-32 rounded bg-muted/50 animate-pulse" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
          </div>
          <div className="flex-1 p-8">
            <div className="grid grid-cols-3 gap-6">
              <SkeletonCard variant="block" className="h-40" />
              <SkeletonCard variant="block" className="h-40" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 4. Forbidden (RLS) - show access denied
  if (isForbidden) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view this board.</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 5. Error state
  if (boardError) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Error Loading Board</h2>
            <p className="text-muted-foreground">{boardError.message || 'An unexpected error occurred.'}</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 6. Board not found
  if (!board) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Board Not Found</h2>
            <p className="text-muted-foreground">This board doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 7. Board loaded - render canvas
  return (
    <DashboardLayout boardId={board.id} boardTitle={board.title} showBoardControls hideSidebar>
      <div className="flex h-full relative">
        <BlocksSidebar boardId={board.id} onCenterView={handleCenterView} />

        <ContextMenu>
          <ContextMenuTrigger>
            <div
              ref={canvasRef}
              className={cn(
                "flex-1 relative overflow-hidden board-canvas-bg",
                isPanning ? "cursor-grabbing" : "cursor-grab"
              )}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
              onContextMenu={handleContextMenu}
            >
              <div
                className="canvas-inner origin-top-left"
                style={{
                  width: "5000px",
                  height: "5000px",
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  willChange: "transform",
                }}
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
                  {boardConnections.map((conn) => {
                    const from = getBlockCenter(conn.from_block);
                    const to = getBlockCenter(conn.to_block);
                    return (
                      <g key={conn.id} style={{ pointerEvents: 'auto' }}>
                        <ConnectionLine
                          from={from}
                          to={to}
                          connectionId={conn.id}
                          boardId={board.id}
                          onContextMenu={handleConnectionContextMenu(conn.id)}
                        />
                      </g>
                    );
                  })}
                  {connectingFrom && (
                    <ConnectionLine
                      from={getBlockCenter(connectingFrom)}
                      to={mousePos}
                      isDrawing
                    />
                  )}
                </svg>

                {boardBlocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => selectBlock(block.id)}
                    onStartConnection={() => handleStartConnection(block.id)}
                    onEndConnection={() => handleEndConnection(block.id)}
                    isConnecting={!!connectingFrom}
                  />
                ))}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-card/90 backdrop-blur-2xl border border-border/40 rounded-2xl min-w-[180px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <ContextMenuItem 
              onClick={handleCreateBlockAtContext}
              className="rounded-xl gap-3 cursor-pointer px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-accent/20 focus:bg-accent/20 data-[highlighted]:bg-accent/20"
            >
              <div className="p-2 rounded-xl bg-secondary/60 border border-border/30 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Plus className="h-4 w-4" />
              </div>
              Create Block
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      {isBlockChatOpen && chatBlockId && <BlockChatModal blockId={chatBlockId} />}
      
      {/* Connection Context Menu */}
      {connectionContextMenu && (
        <div 
          className="fixed inset-0 z-50"
          onClick={() => setConnectionContextMenu(null)}
        >
          <div
            className="absolute"
            style={{ left: connectionContextMenu.x, top: connectionContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <ConnectionContextMenu 
              connectionId={connectionContextMenu.connectionId}
              boardId={board.id}
              onClose={() => setConnectionContextMenu(null)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
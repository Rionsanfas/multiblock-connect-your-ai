import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BlockCard } from "@/components/board/BlockCard";
import { ConnectionLine } from "@/components/board/ConnectionLine";
import { BlocksSidebar } from "@/components/board/BlocksSidebar";
import { BlockChatModal } from "@/components/board/BlockChatModal";
import { ConnectionContextMenu } from "@/components/board/ConnectionContextMenu";
import { ZoomControls } from "@/components/board/ZoomControls";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { useAppStore } from "@/store/useAppStore";
import { useDragStore } from "@/store/useDragStore";
import { useBlockPositions } from "@/store/useBlockPositions";
import { useUserBoard } from "@/hooks/useCurrentUser";
import { useBoardBlocks, useBlockActions } from "@/hooks/useBoardBlocks";
import { useBoardConnections, useConnectionActions } from "@/hooks/useBlockConnections";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Responsive defaults - match BlockCard.tsx
const DEFAULT_BLOCK_WIDTH = 260;
const DEFAULT_BLOCK_HEIGHT = 140;

// Zoom constraints
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_SENSITIVITY = 0.001;

export default function BoardCanvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [connectionContextMenu, setConnectionContextMenu] = useState<{ connectionId: string; x: number; y: number } | null>(null);

  // Global drag store for connection line dragging
  const startDrag = useDragStore((s) => s.startDrag);
  const endDrag = useDragStore((s) => s.endDrag);

  // Keep latest pan/zoom in refs so window listeners never depend on React render.
  const panOffsetRef = useRef(panOffset);
  const zoomRef = useRef(1);
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

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

  // Responsive hooks - MUST be called unconditionally at top level
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const showMobileZoomControls = isMobile || isTablet;

  const {
    selectedBlockId,
    selectBlock,
    setCurrentBoard,
    zoom,
    setZoom,
    isBlockChatOpen,
    chatBlockId,
  } = useAppStore();

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Mouse wheel zoom handler - cursor-centered zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get cursor position relative to canvas
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Calculate the point in canvas space that the cursor is over
      const canvasX = (cursorX - panOffset.x) / zoom;
      const canvasY = (cursorY - panOffset.y) / zoom;

      // Calculate new zoom level
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 + delta)));

      // Skip if zoom didn't change (at limits)
      if (newZoom === zoom) return;

      // Calculate new pan offset to keep the cursor position fixed
      const newPanX = cursorX - canvasX * newZoom;
      const newPanY = cursorY - canvasY * newZoom;

      // Apply both changes
      setPanOffset({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    },
    [zoom, panOffset, setZoom]
  );

  // CRITICAL: connection dragging must be window-scoped, never canvas-scoped.
  // Otherwise leaving the canvas ends the drag mid-mouse-down.
  useEffect(() => {
    if (!connectingFrom) return;

    let raf = 0;
    let latest: { x: number; y: number } | null = null;

    const updateMousePos = () => {
      raf = 0;
      if (!latest) return;
      setMousePos(latest);
      latest = null;
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      latest = {
        x: (e.clientX - rect.left - panOffsetRef.current.x) / zoomRef.current,
        y: (e.clientY - rect.top - panOffsetRef.current.y) / zoomRef.current,
      };

      if (!raf) raf = window.requestAnimationFrame(updateMousePos);
    };

    const onUp = () => {
      // If a block handled the drop, it will already have cleared connectingFrom.
      endDrag();
      setConnectingFrom(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [connectingFrom, endDrag]);

  const handleCenterView = useCallback(() => {
    if (boardBlocks.length === 0) {
      toast.info("No blocks to center on");
      return;
    }

    // Calculate bounding box of all blocks
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    boardBlocks.forEach((block) => {
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
    const newPanX = rect.width / 2 - centerX * zoom;
    const newPanY = rect.height / 2 - centerY * zoom;

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

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only enable panning on canvas background, not on blocks
      if (target === canvasRef.current || target.classList.contains('board-canvas-bg') || target.closest('.canvas-inner')) {
        if (e.button === 0 && !target.closest('.block-card')) {
          // Cancel any in-flight queries before starting an interaction
          if (board?.id) {
            queryClient.cancelQueries({ queryKey: ['board-blocks', board.id] });
            queryClient.cancelQueries({ queryKey: ['board-connections', board.id] });
          }

          // Set global drag lock for panning
          startDrag('pan');
          setIsPanning(true);
          setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
          selectBlock(null);
        }
      }
    },
    [board?.id, panOffset.x, panOffset.y, queryClient, selectBlock, startDrag]
  );

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

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        // Direct state update for panning - no React interference
        setPanOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isPanning, dragStart]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (isPanning) {
      endDrag();
      setIsPanning(false);
    }
  }, [isPanning, endDrag]);

  const handleStartConnection = useCallback(
    (blockId: string) => {
      // Cancel any in-flight queries so they can't replace the connection list mid-drag.
      if (board?.id) {
        queryClient.cancelQueries({ queryKey: ['board-connections', board.id] });
      }

      // Set global drag lock for connection drawing
      startDrag('connection', blockId);
      setConnectingFrom(blockId);
    },
    [board?.id, queryClient, startDrag]
  );

  const handleEndConnection = useCallback(
    (toBlockId: string) => {
      if (connectingFrom && connectingFrom !== toBlockId) {
        // Create is fully optimistic; it will keep the line mounted and later swap IDs.
        createConnection(connectingFrom, toBlockId);
        toast.success("Connection created");
      }

      endDrag();
      setConnectingFrom(null);
    },
    [connectingFrom, createConnection, endDrag]
  );

  const handleConnectionContextMenu = (connectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setConnectionContextMenu({ connectionId, x: e.clientX, y: e.clientY });
  };

  // Real-time position store for smooth connection line updates during drag
  const blockPositions = useBlockPositions((s) => s.positions);

  // Initialize position store when blocks load or change
  useEffect(() => {
    if (boardBlocks.length > 0) {
      useBlockPositions.getState().initializePositions(boardBlocks);
    }
  }, [boardBlocks]);

  // CRITICAL INVARIANT: do not render any connection whose endpoints don't exist.
  // This prevents "ghost" lines after delete or during optimistic transitions.
  const visibleConnections = useMemo(() => {
    const ids = new Set(boardBlocks.map((b) => b.id));
    return boardConnections.filter((c) => ids.has(c.from_block) && ids.has(c.to_block));
  }, [boardBlocks, boardConnections]);

  // Get block center - uses position store for real-time drag sync
  const getBlockCenter = useCallback((blockId: string) => {
    // First check position store (updated during drag)
    const storePos = blockPositions[blockId];
    if (storePos) {
      return {
        x: storePos.x + DEFAULT_BLOCK_WIDTH / 2,
        y: storePos.y + DEFAULT_BLOCK_HEIGHT / 2,
      };
    }

    // Fallback to block from query cache
    const block = boardBlocks.find((b) => b.id === blockId);
    if (!block) return { x: 0, y: 0 };
    return {
      x: block.position.x + DEFAULT_BLOCK_WIDTH / 2,
      y: block.position.y + DEFAULT_BLOCK_HEIGHT / 2,
    };
  }, [blockPositions, boardBlocks]);

  // === STATE HANDLING - Optimized for perceived speed ===

  // 1. Auth loading - show skeleton only on initial load
  if (authLoading) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex h-full">
          <div className="hidden sm:block w-48 md:w-56 lg:w-64 border-r border-border/20 p-3 sm:p-4 space-y-2 sm:space-y-3 shrink-0">
            <div className="h-6 sm:h-8 w-24 sm:w-32 rounded bg-muted/50 animate-pulse" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
          </div>
          <div className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <SkeletonCard variant="block" className="h-32 sm:h-40" />
              <SkeletonCard variant="block" className="h-32 sm:h-40" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. Not authenticated - redirect to auth
  if (!isAuthenticated || !user) {
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

  // 3. Board loading - show skeleton ONLY if we don't have cached data
  // If we have a board from cache, render it immediately (stale-while-revalidate)
  if (boardLoading && !board) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex h-full">
          <div className="hidden sm:block w-48 md:w-56 lg:w-64 border-r border-border/20 p-3 sm:p-4 space-y-2 sm:space-y-3 shrink-0">
            <div className="h-6 sm:h-8 w-24 sm:w-32 rounded bg-muted/50 animate-pulse" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
            <SkeletonCard variant="block" />
          </div>
          <div className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <SkeletonCard variant="block" className="h-32 sm:h-40" />
              <SkeletonCard variant="block" className="h-32 sm:h-40" />
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

  // 7. Board loaded - render canvas
  return (
    <DashboardLayout boardId={board.id} boardTitle={board.title} showBoardControls hideSidebar>
      <div className="flex h-full relative">
        {/* Fixed sidebar - outside of the canvas transform */}
        <BlocksSidebar boardId={board.id} onCenterView={handleCenterView} />

        <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                ref={canvasRef}
                className={cn(
                  "flex-1 relative board-canvas-bg rounded-xl sm:rounded-2xl",
                  "overflow-hidden",
                  isPanning ? "cursor-grabbing" : "cursor-grab"
                )}
                style={{
                  // Ensure the canvas container fills available space
                  minHeight: "100%",
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                // IMPORTANT: do NOT end connection-drag on mouse-leave; connection drag is window-scoped.
                onMouseLeave={handleCanvasMouseUp}
                onDoubleClick={handleCanvasDoubleClick}
                onContextMenu={handleContextMenu}
                onWheel={handleWheel}
              >
                {/* Canvas viewport - clips content but allows internal scrolling via pan */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    // Safe padding to ensure edge elements are reachable
                    padding: "0",
                  }}
                >
                  <div
                    className="canvas-inner origin-top-left relative"
                    style={{
                      // Large virtual canvas for block placement
                      width: "10000px",
                      height: "10000px",
                      // Center the origin point with some padding
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                      willChange: "transform",
                    }}
                  >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
                      {visibleConnections.map((conn) => {
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

                {/* Mobile/Tablet zoom controls - positioned for touch accessibility */}
                {showMobileZoomControls && (
                  <ZoomControls 
                    onCenterView={handleCenterView}
                    className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50"
                    compact={isMobile}
                  />
                )}
              </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-card/90 backdrop-blur-2xl border border-border/40 rounded-xl sm:rounded-2xl min-w-[160px] sm:min-w-[180px] p-1 sm:p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <ContextMenuItem 
              onClick={handleCreateBlockAtContext}
              className="rounded-lg sm:rounded-xl gap-2 sm:gap-3 cursor-pointer px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-accent/20 focus:bg-accent/20 data-[highlighted]:bg-accent/20"
            >
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-secondary/60 border border-border/30 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
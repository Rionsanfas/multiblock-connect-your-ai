import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Trash2, MoreHorizontal, MessageSquare, GripVertical, Settings } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BlockTransferDialog } from "./BlockTransferDialog";
import { useAppStore } from "@/store/useAppStore";
import { useDragStore } from "@/store/useDragStore";
import { setBlockPosition } from "@/store/useBlockPositions";
import { useBlockActions } from "@/hooks/useBoardBlocks";
import { getModelConfig } from "@/config/models";
import { api } from "@/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsTablet, useIsTouchDevice } from "@/hooks/use-mobile";
import type { Block } from "@/types";

interface BlockCardProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onStartConnection: (clientX?: number, clientY?: number) => void;
  onEndConnection: () => void;
  isConnecting: boolean;
  isConnectionTarget?: boolean; // For mobile touch highlight
}

// Responsive default sizes - smaller on mobile
const MIN_WIDTH = 180;
const MIN_HEIGHT = 100;
const DEFAULT_WIDTH = 260;
const DEFAULT_HEIGHT = 140;

export function BlockCard({
  block,
  isSelected,
  onSelect,
  onStartConnection,
  onEndConnection,
  isConnecting,
  isConnectionTarget = false,
}: BlockCardProps) {
  // CRITICAL: Use refs for drag state to prevent re-renders during drag
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false); // Only for visual updates
  const hasDraggedRef = useRef(false);
  const dragEndTimeRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const dragElementRef = useRef<HTMLElement | null>(null);
  const didFinalizeDragRef = useRef(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isConnectionZoneHovered, setIsConnectionZoneHovered] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [size, setSize] = useState({
    width: block.config?.width || DEFAULT_WIDTH,
    height: block.config?.height || DEFAULT_HEIGHT,
  });
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startBlockPos = useRef({ x: 0, y: 0 });
  const blockPositionRef = useRef({ x: block.position.x, y: block.position.y });

  // Touch/mobile detection for always-visible handles
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isTouchDevice = useIsTouchDevice();
  const showHandlesAlways = isMobile || isTablet || isTouchDevice;
  const isMobileOrTablet = isMobile || isTablet;

  // Global drag store for cross-component drag lock
  const startDrag = useDragStore((s) => s.startDrag);
  const endDrag = useDragStore((s) => s.endDrag);

  const { openBlockChat, messages, zoom } = useAppStore();
  const {
    updateBlockPosition,
    persistBlockPosition,
    duplicateBlock,
    deleteBlock,
    updateBlock,
  } = useBlockActions(block.board_id);

  const blockMessages = messages.filter((m) => m.block_id === block.id);
  const lastMessage = blockMessages[blockMessages.length - 1];

  // Use canonical model config to get provider
  const modelConfig = block.model_id ? getModelConfig(block.model_id) : null;
  const provider = modelConfig?.provider || null;
  const needsModelSelection = !block.model_id || !modelConfig;

  // Keep position ref in sync
  useEffect(() => {
    blockPositionRef.current = { x: block.position.x, y: block.position.y };
  }, [block.position.x, block.position.y]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // CRITICAL: Ignore clicks on dropdown menus, buttons, and other interactive elements
    const target = e.target as HTMLElement;
    if (target.closest(".no-drag")) return;
    if (target.closest('[role="menu"]')) return;
    if (target.closest('[role="menuitem"]')) return;
    if (target.closest('[data-radix-popper-content-wrapper]')) return;
    if (target.closest('[data-state="open"]')) return;
    if (target.tagName === 'BUTTON') return;
    
    if (isResizing) return;
    // Ignore right-click and middle-click
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    activePointerIdRef.current = e.pointerId;
    dragElementRef.current = e.currentTarget;
    didFinalizeDragRef.current = false;

    hasDraggedRef.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };

    const currentPos = blockPositionRef.current;
    dragOffset.current = {
      x: e.clientX / zoom - currentPos.x,
      y: e.clientY / zoom - currentPos.y,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // CRITICAL: Set global drag lock FIRST to prevent any state updates
    startDrag('block', block.id);
    isDraggingRef.current = true;
    
    // Set visual dragging state
    setIsDragging(true);
    // Select after drag state is set to ensure visual order
    onSelect();
  };

  // Separate click handler - only fires if no drag occurred
  const handleClick = useCallback((e: React.MouseEvent) => {
    // CRITICAL: Block click if any dragging occurred recently (within 300ms)
    // This handles the race condition where click fires after pointer up
    const timeSinceDragEnd = Date.now() - dragEndTimeRef.current;
    if (timeSinceDragEnd < 300 || isDraggingRef.current || isResizing || hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    openBlockChat(block.id);
  }, [isResizing, openBlockChat, block.id]);

  // Unified pointer-based resize start (works with mouse + touch)
  const handleResizePointerDown = useCallback((e: React.PointerEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    // Set global drag lock for resize
    startDrag('resize', block.id);
    setIsResizing(true);
    setResizeCorner(corner);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height };
    startBlockPos.current = { x: block.position.x, y: block.position.y };
    
    // Capture pointer for reliable tracking across boundaries
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, [startDrag, block.id, size.width, size.height, block.position.x, block.position.y]);

  const handleResizeMove = useCallback((e: PointerEvent) => {
    if (!isResizing || !resizeCorner) return;

    const deltaX = (e.clientX - startPos.current.x) / zoom;
    const deltaY = (e.clientY - startPos.current.y) / zoom;

    let newWidth = startSize.current.width;
    let newHeight = startSize.current.height;
    let newX = startBlockPos.current.x;
    let newY = startBlockPos.current.y;

    // All corners resize proportionally from opposite corner
    if (resizeCorner === 'se') {
      newWidth = Math.max(MIN_WIDTH, startSize.current.width + deltaX);
      newHeight = Math.max(MIN_HEIGHT, startSize.current.height + deltaY);
    } else if (resizeCorner === 'sw') {
      const widthDelta = Math.min(deltaX, startSize.current.width - MIN_WIDTH);
      newWidth = startSize.current.width - widthDelta;
      newX = startBlockPos.current.x + widthDelta;
      newHeight = Math.max(MIN_HEIGHT, startSize.current.height + deltaY);
    } else if (resizeCorner === 'ne') {
      newWidth = Math.max(MIN_WIDTH, startSize.current.width + deltaX);
      const heightDelta = Math.min(deltaY, startSize.current.height - MIN_HEIGHT);
      newHeight = startSize.current.height - heightDelta;
      newY = startBlockPos.current.y + heightDelta;
    } else if (resizeCorner === 'nw') {
      const widthDelta = Math.min(deltaX, startSize.current.width - MIN_WIDTH);
      newWidth = startSize.current.width - widthDelta;
      newX = startBlockPos.current.x + widthDelta;
      const heightDelta = Math.min(deltaY, startSize.current.height - MIN_HEIGHT);
      newHeight = startSize.current.height - heightDelta;
      newY = startBlockPos.current.y + heightDelta;
    } else if (resizeCorner === 'e') {
      newWidth = Math.max(MIN_WIDTH, startSize.current.width + deltaX);
    } else if (resizeCorner === 'w') {
      const widthDelta = Math.min(deltaX, startSize.current.width - MIN_WIDTH);
      newWidth = startSize.current.width - widthDelta;
      newX = startBlockPos.current.x + widthDelta;
    }

    requestAnimationFrame(() => {
      setSize({ width: newWidth, height: newHeight });
      updateBlockPosition(block.id, { x: newX, y: newY });
    });
  }, [isResizing, resizeCorner, zoom, block.id, updateBlockPosition]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      // Release global drag lock
      endDrag();
      updateBlock(block.id, { config: { ...block.config, width: size.width, height: size.height } });
    }
    setIsResizing(false);
    setResizeCorner(null);
  }, [isResizing, endDrag, updateBlock, block.id, block.config, size.width, size.height]);

  // Pointer-driven drag listeners - attached only while dragging
  useEffect(() => {
    if (!isDragging) return;

    const pointerId = activePointerIdRef.current;
    const dragEl = dragElementRef.current;

    const finalize = () => {
      if (didFinalizeDragRef.current) return;
      didFinalizeDragRef.current = true;

      // Record drag end time BEFORE resetting hasDraggedRef
      // This prevents click from firing after drag
      if (hasDraggedRef.current) {
        dragEndTimeRef.current = Date.now();
        persistBlockPosition(block.id, blockPositionRef.current);
      }

      hasDraggedRef.current = false;
      activePointerIdRef.current = null;
      isDraggingRef.current = false;
      
      // CRITICAL: Release global drag lock AFTER persisting
      endDrag();
      setIsDragging(false);

      if (dragEl && pointerId != null) {
        try {
          dragEl.releasePointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId == null || e.pointerId !== pointerId) return;
      if (isResizing) return;
      if (didFinalizeDragRef.current) return;
      if (!isDraggingRef.current) return; // Check ref, not state

      // Prevent page scroll on touch/trackpad while dragging
      e.preventDefault();

      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      // Use a 3px threshold for more responsive drag initiation
      if (dx > 3 || dy > 3) {
        hasDraggedRef.current = true;
      }

      // Only move if we've exceeded the drag threshold
      if (!hasDraggedRef.current) return;

      const newX = e.clientX / zoom - dragOffset.current.x;
      const newY = e.clientY / zoom - dragOffset.current.y;
      blockPositionRef.current = { x: newX, y: newY };

      // CRITICAL: Update both the position store (for connection lines) and cache
      // Both happen in same RAF loop for perfect sync
      requestAnimationFrame(() => {
        if (isDraggingRef.current) {
          // Update position store FIRST - connection lines subscribe to this
          setBlockPosition(block.id, { x: newX, y: newY });
          // Then update cache for block rendering
          updateBlockPosition(block.id, { x: newX, y: newY });
        }
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId == null || e.pointerId !== pointerId) return;
      finalize();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (pointerId == null || e.pointerId !== pointerId) return;
      finalize();
    };

    const onBlur = () => finalize();
    const onVisibilityChange = () => {
      if (document.hidden) finalize();
    };

    // Mouse fallbacks (some environments miss pointerup)
    const onMouseUp = () => finalize();
    const onMouseLeaveWindow = () => finalize();

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseLeaveWindow);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (dragEl) {
      dragEl.addEventListener('lostpointercapture', finalize);
    }

    return () => {
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerup', onPointerUp as any);
      window.removeEventListener('pointercancel', onPointerCancel as any);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseleave', onMouseLeaveWindow);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (dragEl) {
        dragEl.removeEventListener('lostpointercapture', finalize);
      }

      // Safety: if we unmount mid-drag, finalize once
      finalize();
    };
  }, [isDragging, isResizing, zoom, block.id, updateBlockPosition, persistBlockPosition, endDrag]);

  // Pointer-driven resize listeners - use pointer events for unified mouse + touch
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", handleResizeMove);
      window.addEventListener("pointerup", handleResizeEnd);
      window.addEventListener("pointercancel", handleResizeEnd);
      return () => {
        window.removeEventListener("pointermove", handleResizeMove);
        window.removeEventListener("pointerup", handleResizeEnd);
        window.removeEventListener("pointercancel", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleRun = async () => {
    setIsRunning(true);
    toast.info("Running block...");

    const result = await api.blocks.run(block.id, "Continue the conversation", (chunk) => {});

    if (result.success) {
      toast.success("Block completed");
    } else {
      toast.error(result.error || "Run failed");
    }
    setIsRunning(false);
  };

  const handleRequestDeleteBlock = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteBlock = () => {
    // Instant UX: user action is the source of truth.
    setConfirmDeleteOpen(false);
    toast.success("Block deleted", {
      description: "All connected links were deleted too.",
    });

    deleteBlock(block.id).catch((e) => {
      toast.error(e instanceof Error ? e.message : "Failed to delete block");
    });
  };

  // Bracket configuration - symmetric spacing
  const bracketOffset = 12; // Symmetric offset from block edge for connection bracket
  const cornerOffset = 20; // Larger offset for corner resize brackets
  const cornerBracketSize = 20; // Size of corner resize brackets
  const borderRadius = 16; // Matches rounded-2xl

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "block-card absolute select-none",
            isDragging ? "cursor-grabbing z-50" : "cursor-grab",
            isResizing && "z-50",
            // Mobile connection target highlight - glow effect when finger is over this block
            isConnectionTarget && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          data-block-id={block.id}
          style={{
            left: block.position.x,
            top: block.position.y,
            width: size.width,
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            if (!isResizing) setIsHovered(false);
            setIsConnectionZoneHovered(false);
          }}
        >
          {/* Layer 1: Full outline bracket for connections - always visible, symmetric offset */}
          {/* Enhanced glow when this block is a mobile connection target */}
          <div 
            className={cn(
              "absolute pointer-events-none transition-all duration-150",
              (isConnectionZoneHovered || isConnectionTarget) && "drop-shadow-[0_0_16px_hsl(var(--primary))]"
            )}
            style={{
              top: -bracketOffset,
              left: -bracketOffset,
              width: size.width + bracketOffset * 2,
              height: size.height + bracketOffset * 2,
            }}
          >
            <svg 
              width={size.width + bracketOffset * 2}
              height={size.height + bracketOffset * 2}
              className="overflow-visible"
            >
              <rect
                x="2"
                y="2"
                width={size.width + bracketOffset * 2 - 4}
                height={size.height + bracketOffset * 2 - 4}
                rx={borderRadius + 8}
                ry={borderRadius + 8}
                fill="none"
                stroke={isConnectionTarget ? "hsl(var(--primary))" : isConnectionZoneHovered ? "hsl(0, 0%, 60%)" : "hsl(0, 0%, 35%)"}
                strokeWidth={isConnectionTarget ? "3" : isConnectionZoneHovered ? "2.5" : "1.5"}
                strokeOpacity={isConnectionTarget || isConnectionZoneHovered ? "1" : "0.7"}
              />
            </svg>
          </div>
          
          {/* Connection click zone - invisible but clickable overlay for starting/ending connections */}
          {/* Unified pointer events for mouse + touch */}
          <div 
            className="absolute cursor-crosshair no-drag pointer-events-auto"
            style={{
              top: -bracketOffset - 8,
              left: -bracketOffset - 8,
              width: `calc(100% + ${(bracketOffset + 8) * 2}px)`,
              height: `calc(100% + ${(bracketOffset + 8) * 2}px)`,
              borderRadius: borderRadius + bracketOffset + 4,
              touchAction: 'none', // Prevent browser gestures during connection drag
            }}
            onMouseEnter={() => setIsConnectionZoneHovered(true)}
            onMouseLeave={() => setIsConnectionZoneHovered(false)}
            onPointerDown={(e) => {
              // Start connection on pointer down (works for mouse + touch)
              // Pass pointer coordinates for accurate line positioning
              const target = e.target as HTMLElement;
              if (!target.closest('.block-main-card')) {
                e.stopPropagation();
                e.preventDefault();
                onStartConnection(e.clientX, e.clientY);
              }
            }}
            onPointerUp={(e) => {
              // Desktop only: end connection on pointer up.
              // Mobile/Tablet uses window-scoped pointerup hit-test to decide connect vs cancel.
              e.stopPropagation();
              if (!isMobileOrTablet && isConnecting) onEndConnection();
            }}
          />

          {/* Layer 2: Corner resize brackets - visible on hover OR always on touch devices */}
          {/* Top-left corner bracket */}
          <div 
            className={cn(
              "absolute pointer-events-auto cursor-nw-resize no-drag transition-opacity duration-150",
              (isHovered || showHandlesAlways) ? "opacity-100" : "opacity-0"
            )}
            style={{ top: -cornerOffset, left: -cornerOffset, touchAction: 'none' }}
            onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
          >
            <svg width={cornerBracketSize} height={cornerBracketSize} className="overflow-visible">
              <path
                d={`M ${cornerBracketSize - 2} 2 Q 2 2 2 ${cornerBracketSize - 2}`}
                fill="none"
                stroke="hsl(0, 0%, 50%)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Top-right corner bracket */}

          <div 
            className={cn(
              "absolute pointer-events-auto cursor-ne-resize no-drag transition-opacity duration-150",
              (isHovered || showHandlesAlways) ? "opacity-100" : "opacity-0"
            )}
            style={{ top: -cornerOffset, right: -cornerOffset, touchAction: 'none' }}
            onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
          >
            <svg width={cornerBracketSize} height={cornerBracketSize} className="overflow-visible">
              <path
                d={`M 2 2 Q ${cornerBracketSize - 2} 2 ${cornerBracketSize - 2} ${cornerBracketSize - 2}`}
                fill="none"
                stroke="hsl(0, 0%, 50%)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div 
            className={cn(
              "absolute pointer-events-auto cursor-sw-resize no-drag transition-opacity duration-150",
              (isHovered || showHandlesAlways) ? "opacity-100" : "opacity-0"
            )}
            style={{ bottom: -cornerOffset, left: -cornerOffset, touchAction: 'none' }}
            onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
          >
            <svg width={cornerBracketSize} height={cornerBracketSize} className="overflow-visible">
              <path
                d={`M 2 2 Q 2 ${cornerBracketSize - 2} ${cornerBracketSize - 2} ${cornerBracketSize - 2}`}
                fill="none"
                stroke="hsl(0, 0%, 50%)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div 
            className={cn(
              "absolute pointer-events-auto cursor-se-resize no-drag transition-opacity duration-150",
              (isHovered || showHandlesAlways) ? "opacity-100" : "opacity-0"
            )}
            style={{ bottom: -cornerOffset, right: -cornerOffset, touchAction: 'none' }}
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
          >
            <svg width={cornerBracketSize} height={cornerBracketSize} className="overflow-visible">
              <path
                d={`M ${cornerBracketSize - 2} 2 Q ${cornerBracketSize - 2} ${cornerBracketSize - 2} 2 ${cornerBracketSize - 2}`}
                fill="none"
                stroke="hsl(0, 0%, 50%)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Main card container */}
          <div
            className={cn(
              "block-main-card relative rounded-2xl",
              "bg-[hsl(0_0%_8%/0.95)] backdrop-blur-xl",
              "border border-[hsl(0_0%_20%/0.6)]",
              isSelected
                ? "shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                : "shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
              isDragging && "shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            )}
            onPointerUp={(e) => {
              // Allow dropping connections anywhere on the main card (works for touch + mouse)
              e.stopPropagation();
              if (isConnecting) onEndConnection();
            }}
          >

            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-border/20">
              <div className="p-1 rounded-lg bg-secondary/30">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
              </div>
              <h3
                className="font-medium flex-1 truncate text-sm text-foreground/90"
              >
                {block.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton 
                    variant="ghost" 
                    size="sm" 
                    className="no-drag h-7 w-7 opacity-60 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onPointerDown={(e) => { e.stopPropagation(); }}
                    onMouseDown={(e) => { e.stopPropagation(); }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl min-w-[180px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[100]"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem 
                    onSelect={(e) => { e.preventDefault(); openBlockChat(block.id); }} 
                    className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Open Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => { e.preventDefault(); onSelect(); }} 
                    className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Block Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => { e.preventDefault(); duplicateBlock(block.id); }} 
                    className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={(e) => { e.preventDefault(); handleRequestDeleteBlock(); }} 
                    className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content Preview */}
            <div className="px-3 py-3 flex-1 overflow-hidden" style={{ minHeight: size.height - 100 }}>
              {lastMessage ? (
                <p className="text-xs text-muted-foreground/80 line-clamp-3 leading-relaxed">
                  {lastMessage.content}
                </p>
              ) : needsModelSelection ? (
                <p className="text-xs text-amber-500/70 italic">Select a model to start chatting</p>
              ) : (
                <p className="text-xs text-muted-foreground/40 italic">Click to chat</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/20 bg-secondary/5 rounded-b-2xl">
              {provider ? (
                <ProviderBadge provider={provider} model={modelConfig?.name || block.model_id} />
              ) : (
                <span className="text-xs text-amber-500/70">No model selected</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRun();
                }}
                disabled={isRunning}
                className={cn(
                  "no-drag px-2.5 py-1 text-xs font-medium rounded-lg transition-all",
                  isRunning
                    ? "bg-gradient-to-r from-[hsl(35,60%,55%)] via-[hsl(40,70%,60%)] to-[hsl(35,60%,55%)] text-foreground animate-pulse shadow-[0_0_8px_hsl(40,70%,50%/0.4)]"
                    : "bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {isRunning ? "running..." : "rerun"}
              </button>
            </div>

          </div>
        </div>
      </ContextMenuTrigger>

      {/* Right-click context menu - MUST match 3-dots menu exactly */}
      <ContextMenuContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl min-w-[180px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <ContextMenuItem
          onClick={() => openBlockChat(block.id)}
          className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
        >
          <MessageSquare className="h-4 w-4" />
          Open Chat
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onSelect()} className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm">
          <Settings className="h-4 w-4" />
          Block Settings
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => duplicateBlock(block.id)}
          className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={handleRequestDeleteBlock}
          className="rounded-lg gap-2 cursor-pointer px-3 py-2 text-sm text-red-400 focus:text-red-400 focus:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete Block
        </ContextMenuItem>
      </ContextMenuContent>

      <BlockTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        blockId={block.id}
        currentBoardId={block.board_id}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete block?"
        description="This will permanently delete this block and ALL connected links (incoming and outgoing)."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDeleteBlock}
      />
    </ContextMenu>
  );
}

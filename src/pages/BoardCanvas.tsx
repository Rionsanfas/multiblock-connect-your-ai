import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BlockCard } from "@/components/board/BlockCard";
import { ConnectionLine } from "@/components/board/ConnectionLine";
import { BlocksSidebar } from "@/components/board/BlocksSidebar";
import { BlockChatModal } from "@/components/board/BlockChatModal";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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

  const {
    boards,
    blocks,
    connections,
    selectedBlockId,
    selectBlock,
    setCurrentBoard,
    zoom,
    isBlockChatOpen,
    chatBlockId,
    createBlock,
    createConnection,
  } = useAppStore();

  const board = boards.find((b) => b.id === id);
  const boardBlocks = blocks.filter((b) => b.board_id === id);
  const boardConnections = connections.filter((c) =>
    boardBlocks.some((b) => b.id === c.from_block || b.id === c.to_block)
  );

  useEffect(() => {
    if (board) {
      setCurrentBoard(board);
    } else if (id) {
      navigate("/dashboard");
    }
    return () => setCurrentBoard(null);
  }, [board, id, navigate, setCurrentBoard]);

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

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.classList.contains('board-canvas-bg') || (target.closest('.canvas-inner') && !target.closest('.block-card'))) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        createBlock(id!, {
          title: "New Block",
          position: { x, y },
        });
        toast.success("Block created");
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

  const handleCreateBlockAtContext = () => {
    createBlock(id!, {
      title: "New Block",
      position: contextMenuPos,
    });
    toast.success("Block created");
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
      const exists = connections.some(
        (c) => c.from_block === connectingFrom && c.to_block === toBlockId
      );
      if (!exists) {
        createConnection({
          from_block: connectingFrom,
          to_block: toBlockId,
          mode: "append",
        });
      }
    }
    setConnectingFrom(null);
  };

  const getBlockCenter = (blockId: string) => {
    const block = boardBlocks.find((b) => b.id === blockId);
    if (!block) return { x: 0, y: 0 };
    const width = block.config?.width || 280;
    const height = block.config?.height || 160;
    return {
      x: block.position.x + width / 2,
      y: block.position.y + height / 2,
    };
  };

  if (!board) return null;

  return (
    <DashboardLayout boardId={board.id} boardTitle={board.title} showBoardControls hideSidebar>
      <div className="flex h-full relative">
        <BlocksSidebar boardId={board.id} />

        <ContextMenu>
          <ContextMenuTrigger asChild>
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
                      <ConnectionLine
                        key={conn.id}
                        from={from}
                        to={to}
                        connectionId={conn.id}
                      />
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
          <ContextMenuContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl min-w-[160px]">
            <ContextMenuItem 
              onClick={handleCreateBlockAtContext}
              className="rounded-lg gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Block
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      {isBlockChatOpen && chatBlockId && <BlockChatModal blockId={chatBlockId} />}
    </DashboardLayout>
  );
}

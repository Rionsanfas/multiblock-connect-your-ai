import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BlockCard } from "@/components/board/BlockCard";
import { ConnectionLine } from "@/components/board/ConnectionLine";
import { BlocksSidebar } from "@/components/board/BlocksSidebar";
import { BlockSettings } from "@/components/board/BlockSettings";
import { BlockChatModal } from "@/components/board/BlockChatModal";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BoardCanvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    } else if (e.target === canvasRef.current) {
      selectBlock(null);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    // Only create block if double-clicking on the canvas itself, not on a block
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('board-canvas-bg')) {
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

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
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
  };

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
    return {
      x: block.position.x + 150,
      y: block.position.y + 80,
    };
  };

  if (!board) return null;

  return (
    <DashboardLayout boardId={board.id} boardTitle={board.title} showBoardControls hideSidebar>
      <div className="flex h-full relative">
        {/* Left Sidebar - Add Button */}
        <BlocksSidebar boardId={board.id} />

        {/* Canvas Area - Much larger with panning */}
        <div
          ref={canvasRef}
          className={cn(
            "flex-1 relative overflow-auto board-canvas-bg cursor-grab",
            isPanning && "cursor-grabbing"
          )}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
        >
          {/* Large virtual canvas for free movement */}
          <div
            className="origin-top-left"
            style={{
              width: "5000px",
              height: "5000px",
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            }}
          >
            {/* Connection Lines */}
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
              {/* Drawing connection */}
              {connectingFrom && (
                <ConnectionLine
                  from={getBlockCenter(connectingFrom)}
                  to={mousePos}
                  isDrawing
                />
              )}
            </svg>

            {/* Blocks */}
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

        {/* Right Sidebar - Block Settings */}
        {selectedBlockId && <BlockSettings blockId={selectedBlockId} />}
      </div>

      {/* Block Chat Modal */}
      {isBlockChatOpen && chatBlockId && <BlockChatModal blockId={chatBlockId} />}
    </DashboardLayout>
  );
}

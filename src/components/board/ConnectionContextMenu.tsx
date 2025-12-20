/**
 * ConnectionContextMenu - Dropdown menu for connection actions
 */

import { ArrowLeftRight, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useConnectionActions, useBidirectionalConnectionExists } from "@/hooks/useBlockConnections";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConnectionContextMenuProps {
  connectionId: string;
  boardId: string;
  onClose: () => void;
}

export function ConnectionContextMenu({ 
  connectionId, 
  boardId,
  onClose,
}: ConnectionContextMenuProps) {
  const { connections } = useAppStore();
  const connection = connections.find(c => c.id === connectionId);
  const { remove, toggle, makeBidirectional } = useConnectionActions(boardId);
  
  const isBidirectional = connection ? useBidirectionalConnectionExists(
    connection.from_block, 
    connection.to_block
  ) : false;

  if (!connection) return null;

  const handleDisconnect = () => {
    remove(connectionId);
    toast.success("Connection removed");
    onClose();
  };

  const handleToggle = () => {
    toggle(connectionId);
    toast.success(connection.enabled ? "Connection disabled" : "Connection enabled");
    onClose();
  };

  const handleMakeBidirectional = () => {
    const result = makeBidirectional(connectionId);
    if (result) {
      toast.success("Connection is now bidirectional");
    } else {
      toast.info("Connection is already bidirectional");
    }
    onClose();
  };

  return (
    <div className="w-56 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl p-1 shadow-xl">
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg",
          "hover:bg-secondary/60 transition-colors text-left"
        )}
      >
        {connection.enabled ? (
          <>
            <ToggleRight className="h-4 w-4 text-muted-foreground" />
            <span>Disable Connection</span>
          </>
        ) : (
          <>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            <span>Enable Connection</span>
          </>
        )}
      </button>
      
      {!isBidirectional && (
        <button
          onClick={handleMakeBidirectional}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg",
            "hover:bg-secondary/60 transition-colors text-left"
          )}
        >
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <span>Make Bidirectional</span>
        </button>
      )}
      
      <div className="h-px bg-border/30 my-1" />
      
      <button
        onClick={handleDisconnect}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg",
          "hover:bg-destructive/10 transition-colors text-left text-destructive"
        )}
      >
        <Trash2 className="h-4 w-4" />
        <span>Disconnect</span>
      </button>
    </div>
  );
}

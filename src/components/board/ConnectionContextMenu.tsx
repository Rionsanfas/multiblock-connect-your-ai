/**
 * ConnectionContextMenu - Dropdown menu for connection actions
 * Uses Supabase-backed connections
 */

import { Trash2 } from "lucide-react";
import { useConnectionActions, useBoardConnections } from "@/hooks/useBlockConnections";
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
  const { connections } = useBoardConnections(boardId);
  const connection = connections.find(c => c.id === connectionId);
  const { remove, isDeleting } = useConnectionActions(boardId);

  if (!connection) return null;

  const handleDisconnect = () => {
    remove(connectionId);
    toast.success("Connection removed");
    onClose();
  };

  return (
    <div className="w-56 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl p-1 shadow-xl">
      <button
        onClick={handleDisconnect}
        disabled={isDeleting}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg",
          "hover:bg-destructive/10 transition-colors text-left text-destructive",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Trash2 className="h-4 w-4" />
        <span>{isDeleting ? "Removing..." : "Disconnect"}</span>
      </button>
    </div>
  );
}

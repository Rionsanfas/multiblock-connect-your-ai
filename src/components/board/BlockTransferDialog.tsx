import { useState } from "react";
import { Copy, Move, FolderOpen, MessageSquare, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore } from "@/store/useAppStore";
import { useUserBoards } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlockTransferDialogProps {
  blockId: string;
  currentBoardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TransferMode = 'duplicate' | 'move';

export function BlockTransferDialog({ 
  blockId, 
  currentBoardId, 
  open, 
  onOpenChange 
}: BlockTransferDialogProps) {
  const [mode, setMode] = useState<TransferMode>('duplicate');
  const [targetBoardId, setTargetBoardId] = useState<string>('');
  const [withMessages, setWithMessages] = useState(false);
  
  const { blocks, duplicateBlock, duplicateBlockToBoard, moveBlockToBoard } = useAppStore();
  const userBoards = useUserBoards();
  
  const block = blocks.find((b) => b.id === blockId);
  const otherBoards = userBoards.filter((b) => b.id !== currentBoardId);
  const isSameBoard = !targetBoardId || targetBoardId === currentBoardId;

  if (!block) return null;

  const handleTransfer = () => {
    try {
      if (mode === 'duplicate') {
        if (isSameBoard) {
          // Duplicate within same board
          const newBlock = duplicateBlock(blockId, { withMessages });
          toast.success(`Duplicated: ${newBlock.title}`);
        } else {
          // Duplicate to another board
          const newBlock = duplicateBlockToBoard(blockId, targetBoardId, { withMessages });
          toast.success(`Copied to board: ${newBlock.title}`);
        }
      } else {
        // Move to another board
        if (isSameBoard) {
          toast.error("Select a different board to move");
          return;
        }
        const movedBlock = moveBlockToBoard(blockId, targetBoardId);
        toast.success(`Moved to board`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-card/95 backdrop-blur-xl border-border/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'duplicate' ? (
              <Copy className="h-5 w-5 text-[hsl(var(--accent))]" />
            ) : (
              <Move className="h-5 w-5 text-[hsl(var(--accent))]" />
            )}
            {mode === 'duplicate' ? 'Duplicate Block' : 'Move Block'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'duplicate' 
              ? 'Create a copy of this block, optionally on a different board.'
              : 'Move this block to a different board. Connections will be removed.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transfer Mode */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Action
            </Label>
            <RadioGroup 
              value={mode} 
              onValueChange={(v) => setMode(v as TransferMode)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="duplicate"
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  mode === 'duplicate' 
                    ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)]" 
                    : "border-border/30 bg-secondary/30 hover:bg-secondary/50"
                )}
              >
                <RadioGroupItem value="duplicate" id="duplicate" />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-sm">
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </div>
                  <p className="text-xs text-muted-foreground">Keep original</p>
                </div>
              </Label>
              <Label
                htmlFor="move"
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  mode === 'move' 
                    ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)]" 
                    : "border-border/30 bg-secondary/30 hover:bg-secondary/50"
                )}
              >
                <RadioGroupItem value="move" id="move" />
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-sm">
                    <Move className="h-4 w-4" />
                    Move
                  </div>
                  <p className="text-xs text-muted-foreground">Remove original</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Target Board */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target Board
            </Label>
            <RadioGroup 
              value={targetBoardId || currentBoardId} 
              onValueChange={setTargetBoardId}
              className="space-y-2"
            >
              {/* Current board option (only for duplicate) */}
              {mode === 'duplicate' && (
                <Label
                  htmlFor={currentBoardId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    (targetBoardId === currentBoardId || !targetBoardId)
                      ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)]" 
                      : "border-border/30 bg-secondary/30 hover:bg-secondary/50"
                  )}
                >
                  <RadioGroupItem value={currentBoardId} id={currentBoardId} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-medium text-sm">
                      <FolderOpen className="h-4 w-4" />
                      Current Board
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Duplicate in this board
                    </p>
                  </div>
                  {(targetBoardId === currentBoardId || !targetBoardId) && (
                    <Check className="h-4 w-4 text-[hsl(var(--accent))]" />
                  )}
                </Label>
              )}

              {/* Other boards */}
              {otherBoards.length > 0 ? (
                otherBoards.map((board) => (
                  <Label
                    key={board.id}
                    htmlFor={board.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      targetBoardId === board.id 
                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)]" 
                        : "border-border/30 bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    <RadioGroupItem value={board.id} id={board.id} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{board.title}</div>
                      <p className="text-xs text-muted-foreground">
                        {board.metadata.description || 'No description'}
                      </p>
                    </div>
                    {targetBoardId === board.id && (
                      <Check className="h-4 w-4 text-[hsl(var(--accent))]" />
                    )}
                  </Label>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No other boards available
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Copy Messages Option (only for duplicate) */}
          {mode === 'duplicate' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/20">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium text-sm">Copy messages</Label>
                  <p className="text-xs text-muted-foreground">
                    Include conversation history
                  </p>
                </div>
              </div>
              <Switch checked={withMessages} onCheckedChange={setWithMessages} />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer}
            className="flex-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.9)] text-foreground"
            disabled={mode === 'move' && isSameBoard}
          >
            {mode === 'duplicate' ? 'Duplicate' : 'Move'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

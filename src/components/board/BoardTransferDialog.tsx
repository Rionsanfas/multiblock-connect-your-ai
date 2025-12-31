import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUserTeams } from "@/hooks/useTeamsData";
import { useBoardTransfer } from "@/hooks/useWorkspaceBoards";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardTransferDialogProps {
  boardId: string;
  boardTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardTransferDialog({
  boardId,
  boardTitle,
  open,
  onOpenChange,
}: BoardTransferDialogProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const { data: teams, isLoading } = useUserTeams();
  const { transferBoard, isTransferring } = useBoardTransfer();

  const handleTransfer = async () => {
    if (!selectedTeamId) return;

    try {
      await transferBoard({ boardId, teamId: selectedTeamId });
      onOpenChange(false);
      setSelectedTeamId("");
    } catch (error) {
      // Error handled in hook
    }
  };

  const availableTeams = teams || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Board to Team</DialogTitle>
          <DialogDescription>
            Transfer "{boardTitle}" to a team workspace. This will make the board accessible to all team members.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : availableTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You're not a member of any teams yet.</p>
              <p className="text-sm mt-1">Create a team first to transfer boards.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>Select Team</Label>
              <RadioGroup
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                className="space-y-2"
              >
                {availableTeams.map((team) => (
                  <div
                    key={team.team_id}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      selectedTeamId === team.team_id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedTeamId(team.team_id)}
                  >
                    <RadioGroupItem value={team.team_id} id={team.team_id} />
                    <div className="flex-1">
                      <Label
                        htmlFor={team.team_id}
                        className="font-medium cursor-pointer"
                      >
                        {team.team_name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {team.member_count} member{team.member_count !== 1 ? 's' : ''} · {team.board_count} board{team.board_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedTeamId || isTransferring || availableTeams.length === 0}
          >
            {isTransferring ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

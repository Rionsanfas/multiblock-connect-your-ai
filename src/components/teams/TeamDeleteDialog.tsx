import { useState } from 'react';
import { Trash2, ArrowRight, AlertTriangle, FolderUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TeamDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onConfirm: (transferBoards: boolean) => void;
  isPending?: boolean;
}

export function TeamDeleteDialog({
  open,
  onOpenChange,
  teamName,
  onConfirm,
  isPending = false,
}: TeamDeleteDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [boardAction, setBoardAction] = useState<'transfer' | 'delete'>('transfer');
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setStep(1);
    setBoardAction('transfer');
    setConfirmText('');
    onOpenChange(false);
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleConfirm = () => {
    if (confirmText === teamName) {
      onConfirm(boardAction === 'transfer');
      handleClose();
    }
  };

  const canConfirm = confirmText === teamName;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/30 max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Trash2 className="h-4 w-4" />
                </div>
                Delete Team
              </DialogTitle>
              <DialogDescription>
                Choose what happens to the team's boards before deleting.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RadioGroup
                value={boardAction}
                onValueChange={(v) => setBoardAction(v as 'transfer' | 'delete')}
                className="space-y-3"
              >
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    boardAction === 'transfer'
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/30 bg-secondary/20 hover:border-border/50'
                  }`}
                  onClick={() => setBoardAction('transfer')}
                >
                  <RadioGroupItem value="transfer" id="transfer" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="transfer" className="cursor-pointer font-medium flex items-center gap-2">
                      <FolderUp className="h-4 w-4 text-primary" />
                      Transfer boards to personal
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Move all team boards to the owner's personal dashboard before deleting.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    boardAction === 'delete'
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-border/30 bg-secondary/20 hover:border-border/50'
                  }`}
                  onClick={() => setBoardAction('delete')}
                >
                  <RadioGroupItem value="delete" id="delete-boards" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="delete-boards" className="cursor-pointer font-medium flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-400" />
                      Delete all boards
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete all team boards and their data. This cannot be undone.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-300">
                  {boardAction === 'transfer' ? (
                    <>All boards will be transferred to the owner's personal dashboard, then the team will be permanently deleted.</>
                  ) : (
                    <>All team boards and data will be permanently deleted along with the team.</>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-name" className="text-sm text-muted-foreground">
                  Type <span className="font-mono text-foreground">{teamName}</span> to confirm:
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={teamName}
                  className="bg-secondary/40 border-border/40"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!canConfirm || isPending}
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete Team Permanently'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
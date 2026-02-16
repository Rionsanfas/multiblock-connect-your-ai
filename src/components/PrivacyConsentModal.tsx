import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PrivacyConsentModalProps {
  userId: string;
  open: boolean;
  onAccepted: () => void;
}

export function PrivacyConsentModal({ userId, open, onAccepted }: PrivacyConsentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        privacy_policy_accepted_at: now,
        terms_accepted_at: now,
      } as any)
      .eq("id", userId);

    if (error) {
      toast.error("Failed to record consent. Please try again.");
      setLoading(false);
      return;
    }
    toast.success("Terms accepted!");
    setLoading(false);
    onAccepted();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Privacy Policy Update</DialogTitle>
          <DialogDescription>
            We've updated our Privacy Policy. Please review and accept to continue using Multiblock.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button variant="outline" asChild>
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              View Privacy Policy
            </a>
          </Button>
          <Button onClick={handleAccept} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            I Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

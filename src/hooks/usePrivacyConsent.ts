import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePrivacyConsent(userId: string | null) {
  const [needsConsent, setNeedsConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNeedsConsent(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("profiles")
      .select("privacy_policy_accepted_at, terms_accepted_at")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setLoading(false);
          return;
        }
        const accepted = (data as any).privacy_policy_accepted_at && (data as any).terms_accepted_at;
        setNeedsConsent(!accepted);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  const markAccepted = () => setNeedsConsent(false);

  return { needsConsent, loading, markAccepted };
}

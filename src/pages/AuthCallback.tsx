import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dedicated OAuth / email-verification callback route.
 *
 * Handles the PKCE code exchange for both OAuth and email verification flows.
 *
 * IMPORTANT: PKCE stores the code_verifier in localStorage, which is origin-specific.
 * If the user signed up on multiblock.space but the email link opens on www.multiblock.space,
 * the verifier will be missing. We fix this by canonicalizing to the non-www domain.
 */

const CANONICAL_ORIGIN = "https://multiblock.space";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    // Step 1: Canonicalize domain — redirect www → non-www to preserve PKCE verifier
    const currentOrigin = window.location.origin;
    if (currentOrigin === "https://www.multiblock.space") {
      // Redirect to non-www, keeping all query params & hash intact
      const canonical = new URL(window.location.href);
      canonical.hostname = "multiblock.space";
      window.location.replace(canonical.toString());
      return; // Stop — browser will navigate away
    }

    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          console.log("[AuthCallback] Exchanging code for session...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[AuthCallback] Code exchange failed:", error.message);

            // If verifier is missing, the user likely opened in a different browser/device
            if (error.message.includes("code verifier")) {
              setStatus("Please open this link in the same browser where you signed up.");
              return; // Don't auto-redirect — let them read the message
            }

            setStatus("Verification failed. Redirecting...");
            setTimeout(() => navigate("/", { replace: true }), 2000);
            return;
          }

          console.log("[AuthCallback] Session established successfully");
        }

        // Success — redirect to dashboard
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setStatus("Something went wrong. Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}

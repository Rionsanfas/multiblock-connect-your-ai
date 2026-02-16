import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dedicated OAuth / email-verification callback route.
 *
 * Handles the PKCE code exchange for both OAuth and email verification flows.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[AuthCallback] Code exchange failed:", error.message);
            setStatus("Verification failed. Redirecting...");
            setTimeout(() => navigate("/", { replace: true }), 1500);
            return;
          }
        }

        // Success (or session already hydrated via onAuthStateChange)
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setStatus("Something went wrong. Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 1500);
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

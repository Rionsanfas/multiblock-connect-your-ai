import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalLoader } from "@/components/GlobalLoader";
import { useAuth } from "@/contexts/AuthContext";

/**
 * OAuth Callback Route (Google Sign-In Only)
 * 
 * This route handles ONLY OAuth provider callbacks (e.g., Google).
 * 
 * For email verification, use /auth/verify instead.
 * This separation ensures deterministic auth flows.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Not authenticated after OAuth callback = something went wrong
    navigate("/auth", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return <GlobalLoader />;
}

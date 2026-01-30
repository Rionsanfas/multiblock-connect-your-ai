import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalLoader } from "@/components/GlobalLoader";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Dedicated OAuth callback route.
 * 
 * Why this exists:
 * - Keeps the UI stable during PKCE code exchange.
 * - Avoids redirect races between routes and auth hydration.
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

    navigate("/auth", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return <GlobalLoader />;
}

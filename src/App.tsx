import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TeamProvider } from "@/contexts/TeamContext";
import { GlobalLoader } from "@/components/GlobalLoader";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BoardCanvas from "./pages/BoardCanvas";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import ApiKeys from "./pages/ApiKeys";
import Settings from "./pages/Settings";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import InboxPage from "./pages/Inbox";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - cache retention
      refetchOnWindowFocus: false, // Disable auto-refetch on focus
      refetchOnMount: false, // Use cached data on mount
      retry: 1, // Reduce retry attempts
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoader />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/board/:id"
        element={
          <ProtectedRoute>
            <BoardCanvas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/keys"
        element={
          <ProtectedRoute>
            <ApiKeys />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/settings"
        element={
          <ProtectedRoute>
            <TeamSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/settings/:teamId"
        element={
          <ProtectedRoute>
            <TeamSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute>
            <InboxPage />
          </ProtectedRoute>
        }
      />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TeamProvider>
            <AppRoutes />
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

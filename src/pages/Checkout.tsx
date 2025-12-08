import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Loader2, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
import { toast } from "sonner";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ltdOffers, isAuthenticated } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const sku = searchParams.get("sku");
  const sessionId = searchParams.get("session_id");
  const offer = ltdOffers.find((o) => o.sku === sku);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (sessionId && sku) {
      // Complete checkout
      completeCheckout();
    } else if (sku && offer) {
      // Start checkout
      startCheckout();
    }
  }, [sessionId, sku, isAuthenticated]);

  const startCheckout = async () => {
    if (!sku) return;
    setIsProcessing(true);
    
    try {
      const { checkout_url } = await api.checkout.createSession(sku);
      // In real app, redirect to Stripe. Here we simulate by navigating to success
      setTimeout(() => {
        navigate(checkout_url);
      }, 1500);
    } catch (error) {
      toast.error("Failed to start checkout");
      setIsProcessing(false);
    }
  };

  const completeCheckout = async () => {
    if (!sessionId || !sku) return;
    setIsProcessing(true);
    
    try {
      await api.checkout.complete(sessionId, sku);
      setIsComplete(true);
      toast.success("Purchase successful!");
    } catch (error) {
      toast.error("Failed to complete purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!offer && !isComplete) {
    return (
      <div className="min-h-screen noise-bg flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-4">Invalid offer</h1>
          <p className="text-muted-foreground mb-6">This offer doesn't exist or has expired.</p>
          <Button asChild>
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen noise-bg flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="gradient-blur w-96 h-96 bg-green-500/20 top-1/4 left-1/4" />
          <div className="gradient-blur w-96 h-96 bg-primary/20 bottom-1/4 right-1/4" />
        </div>

        <GlassCard className="p-8 text-center max-w-md relative z-10" glow>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Purchase Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Welcome to MultiBlock {offer?.title}! Your lifetime access is now active.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full gap-2">
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center p-4">
      <GlassCard className="p-8 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Processing Your Order</h1>
        <p className="text-muted-foreground mb-6">
          {offer?.title} - ${(offer?.price_cents || 0) / 100}
        </p>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Redirecting to checkout...</span>
        </div>
      </GlassCard>
    </div>
  );
}

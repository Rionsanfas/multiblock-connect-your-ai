import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
import { toast } from "sonner";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await api.auth.sendMagicLink(email);
      setEmailSent(true);
      // For demo, auto-login after short delay
      setTimeout(() => {
        login(email);
        toast.success("Welcome to MultiBlock!");
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      toast.error("Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="gradient-blur w-96 h-96 bg-primary/20 top-1/4 -left-48" />
        <div className="gradient-blur w-96 h-96 bg-accent/20 bottom-1/4 -right-48" />
      </div>

      <GlassCard className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">MultiBlock</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">
            {emailSent ? "Check your email" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground">
            {emailSent
              ? "We sent you a magic link to sign in"
              : "Sign in with your email to continue"}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary/50"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue with Email
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/pricing" className="text-primary hover:underline">
            View pricing
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}

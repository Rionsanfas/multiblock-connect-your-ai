import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('signup') ? 'signup' : 'signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  
  // Intro animation state
  const [phase, setPhase] = useState(0);
  
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useAuth();

  // Intro animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 100);
    const timer2 = setTimeout(() => setPhase(2), 400);
    const timer3 = setTimeout(() => setPhase(3), 700);
    const timer4 = setTimeout(() => setPhase(4), 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (mode === 'signup' && !fullName.trim()) {
      newErrors.fullName = "Please enter your name";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error("This email is already registered. Please sign in instead.");
            setMode('signin');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Please check your email to confirm your account.");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Animation styles for card reveal (CardRevealIntro animation)
  const cardStyle = {
    opacity: phase >= 1 ? 1 : 0,
    transform: phase >= 1 
      ? 'scale(1) translateY(0)' 
      : 'scale(0.85) translateY(30px)',
    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const headerStyle = {
    opacity: phase >= 2 ? 1 : 0,
    transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const formFieldStyle = (delay: number) => ({
    opacity: phase >= 3 ? 1 : 0,
    transform: phase >= 3 ? 'translateX(0)' : 'translateX(-20px)',
    transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
  });

  const buttonStyle = {
    opacity: phase >= 4 ? 1 : 0,
    transform: phase >= 4 ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.95)',
    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const footerStyle = {
    opacity: phase >= 4 ? 1 : 0,
    transform: phase >= 4 ? 'translateY(0)' : 'translateY(10px)',
    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-[hsl(220_20%_4%)] dot-grid-bg">
      {/* Ambient lighting effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top light */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--accent) / 0.3), transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Left accent */}
        <div 
          className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[600px] opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(180 50% 40% / 0.4), transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Right accent */}
        <div 
          className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[600px] opacity-15"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--accent) / 0.3), transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glass Card */}
      <div 
        className="relative z-10 w-full max-w-md"
        style={cardStyle}
      >
        {/* Card border glow */}
        <div 
          className="absolute -inset-[1px] rounded-3xl opacity-60"
          style={{
            background: 'linear-gradient(145deg, hsl(0 0% 100% / 0.1), hsl(0 0% 100% / 0.02), hsl(0 0% 100% / 0.08))',
          }}
        />
        
        {/* Lightning effects on edges */}
        <div 
          className="absolute -inset-1 rounded-3xl opacity-40 blur-sm"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--accent) / 0.3) 0%, transparent 30%, transparent 70%, hsl(180 50% 50% / 0.2) 100%)',
          }}
        />

        {/* Main card */}
        <div 
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, hsl(0 0% 10% / 0.85), hsl(0 0% 6% / 0.95))',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 25px 50px -12px hsl(0 0% 0% / 0.5), inset 0 1px 0 0 hsl(0 0% 100% / 0.05)',
          }}
        >
          {/* Inner light reflection */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 opacity-30 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.08), transparent)',
            }}
          />

          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-8" style={headerStyle}>
              <Link 
                to="/" 
                className="inline-block text-xl font-bold text-foreground hover:text-accent transition-colors mb-6"
              >
                MultiBlock
              </Link>
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {mode === 'signup' 
                  ? 'Start building with AI-powered blocks' 
                  : 'Sign in to continue to your workspace'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2" style={formFieldStyle(0)}>
                  <Label htmlFor="fullName" className="text-xs text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-11 h-12 bg-secondary/30 border-border/50 rounded-xl focus:border-accent/50 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2" style={formFieldStyle(mode === 'signup' ? 50 : 0)}>
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-secondary/30 border-border/50 rounded-xl focus:border-accent/50 focus:ring-accent/20 transition-all"
                  />
                  {/* Submit arrow inside email field */}
                  {mode === 'signin' && email && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-accent-foreground" />
                      )}
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2" style={formFieldStyle(mode === 'signup' ? 100 : 50)}>
                <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 bg-secondary/30 border-border/50 rounded-xl focus:border-accent/50 focus:ring-accent/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Divider for signup */}
              {mode === 'signup' && (
                <div className="relative py-2" style={formFieldStyle(150)}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/30" />
                  </div>
                </div>
              )}
              
              <div style={buttonStyle}>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signup' ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center" style={footerStyle}>
              {mode === 'signin' ? (
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setMode('signup')} 
                    className="text-foreground hover:text-accent font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button 
                    onClick={() => setMode('signin')} 
                    className="text-foreground hover:text-accent font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6" style={footerStyle}>
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

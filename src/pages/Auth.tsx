import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

// Google icon SVG component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get('reset') === 'true';
  
  const [mode, setMode] = useState<AuthMode>(() => {
    if (isReset) return 'reset-password';
    if (searchParams.get('signup')) return 'signup';
    return 'signin';
  });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  
  // Intro animation state
  const [phase, setPhase] = useState(0);
  
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();

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
    
    if (mode !== 'forgot-password') {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
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
      if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password reset email sent! Check your inbox.");
          setMode('signin');
        }
      } else if (mode === 'signup') {
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

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isLoading) return;
    
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
        setIsGoogleLoading(false);
      }
      // Don't set loading to false on success - the redirect will handle cleanup
    } catch (error) {
      toast.error("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
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

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create your account';
      case 'forgot-password': return 'Reset your password';
      case 'reset-password': return 'Set new password';
      default: return 'Welcome back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Start building with AI-powered blocks';
      case 'forgot-password': return 'Enter your email to receive a reset link';
      case 'reset-password': return 'Enter your new password below';
      default: return 'Sign in to continue to your workspace';
    }
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
        className="relative z-10 w-full max-w-md px-4 sm:px-0"
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

          <div className="relative p-5 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8" style={headerStyle}>
              <Link 
                to="/" 
                className="inline-block text-lg sm:text-xl font-bold text-foreground hover:text-accent transition-colors mb-4 sm:mb-6"
              >
                MultiBlock
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                {getTitle()}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {getSubtitle()}
              </p>
            </div>

            {/* Google Sign In Button - only show for signin/signup modes */}
            {(mode === 'signin' || mode === 'signup') && (
              <div style={formFieldStyle(0)}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full h-10 sm:h-12 rounded-xl gap-3 bg-white hover:bg-gray-50 text-gray-700 border-border/50 font-medium text-sm transition-all"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon />
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Divider */}
            {(mode === 'signin' || mode === 'signup') && (
              <div className="relative py-2" style={formFieldStyle(50)}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-transparent text-muted-foreground">or continue with email</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5 sm:space-y-2" style={formFieldStyle(0)}>
                  <Label htmlFor="fullName" className="text-xs text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 sm:h-12 text-sm sm:text-base bg-secondary/30 border-border/50 rounded-xl focus:border-foreground/50 focus:ring-foreground/20 transition-all"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-1.5 sm:space-y-2" style={formFieldStyle(mode === 'signup' ? 50 : 0)}>
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-12 text-sm sm:text-base bg-secondary/30 border-border/50 rounded-xl focus:border-foreground/50 focus:ring-foreground/20 transition-all"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              {mode !== 'forgot-password' && (
                <div className="space-y-1.5 sm:space-y-2" style={formFieldStyle(mode === 'signup' ? 100 : 50)}>
                  <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-11 h-10 sm:h-12 text-sm sm:text-base bg-secondary/30 border-border/50 rounded-xl focus:border-foreground/50 focus:ring-foreground/20 transition-all"
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
              )}

              {/* Forgot password link and Keep logged in - only show on signin */}
              {mode === 'signin' && (
                <div className="flex items-center justify-between" style={formFieldStyle(100)}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox 
                      checked={keepLoggedIn}
                      onCheckedChange={(checked) => setKeepLoggedIn(checked === true)}
                      className="h-4 w-4 border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      Keep me logged in
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              
              <div style={buttonStyle}>
                <Button 
                  type="submit" 
                  className="w-full h-10 sm:h-12 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'forgot-password' && 'Send Reset Link'}
                      {mode === 'reset-password' && 'Update Password'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center" style={footerStyle}>
              {mode === 'signin' && (
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setMode('signup')} 
                    className="text-foreground hover:text-accent font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === 'signup' && (
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
              {mode === 'forgot-password' && (
                <button 
                  onClick={() => setMode('signin')} 
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to sign in
                </button>
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

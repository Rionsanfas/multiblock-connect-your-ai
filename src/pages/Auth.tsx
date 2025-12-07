import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').optional();

type AuthMode = 'signin' | 'signup' | 'magic-link' | 'forgot-password';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, signInWithMagicLink, signInWithOAuth, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode === 'signin' || mode === 'signup') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === 'signup' && fullName) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast({ title: 'Invalid credentials', description: 'Please check your email and password.', variant: 'destructive' });
          } else {
            toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
          }
        } else {
          toast({ title: 'Welcome back!' });
          navigate('/');
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({ title: 'Account exists', description: 'This email is already registered. Try signing in.', variant: 'destructive' });
          } else {
            toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
          }
        } else {
          toast({ title: 'Check your email', description: 'We sent you a confirmation link.' });
        }
      } else if (mode === 'magic-link') {
        const { error } = await signInWithMagicLink(email);
        if (error) {
          toast({ title: 'Failed to send link', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Check your email', description: 'We sent you a magic link to sign in.' });
        }
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({ title: 'Failed to send reset email', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Check your email', description: 'We sent you a password reset link.' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast({ title: 'OAuth failed', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'magic-link' && 'Sign in with magic link'}
              {mode === 'forgot-password' && 'Reset your password'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'signin' && 'Sign in to access your workspace'}
              {mode === 'signup' && 'Start building with multiple AI models'}
              {mode === 'magic-link' && 'We\'ll send you a link to sign in'}
              {mode === 'forgot-password' && 'We\'ll send you a reset link'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full name (optional)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50"
                  />
                </div>
                {errors.fullName && <p className="text-sm text-red-400 mt-1">{errors.fullName}</p>}
              </div>
            )}

            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50"
                  required
                />
              </div>
              {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email}</p>}
            </div>

            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50"
                    required
                  />
                </div>
                {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password}</p>}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'signin' && 'Sign in'}
              {mode === 'signup' && 'Create account'}
              {mode === 'magic-link' && 'Send magic link'}
              {mode === 'forgot-password' && 'Send reset link'}
            </Button>
          </form>

          {(mode === 'signin' || mode === 'signup') && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="bg-background/50"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuth('github')}
                  disabled={loading}
                  className="bg-background/50"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 text-center text-sm">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
                <span className="mx-2 text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setMode('magic-link')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Use magic link
                </button>
                <div className="mt-4">
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <div>
                <span className="text-muted-foreground">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </div>
            )}
            {(mode === 'magic-link' || mode === 'forgot-password') && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

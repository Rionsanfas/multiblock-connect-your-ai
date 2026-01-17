/**
 * ErrorBoundary - Global error boundary to catch runtime errors
 * 
 * This ensures all runtime errors show our custom error page,
 * not Lovable's default error handling.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { ArrowLeft, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.handleGoHome();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-[hsl(220_20%_4%)] dot-grid-bg">
          {/* Ambient lighting effects - matching auth page style */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(0 70% 50% / 0.3), transparent 70%)',
                filter: 'blur(80px)',
              }}
            />
            <div 
              className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[600px] opacity-20"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(180 50% 40% / 0.4), transparent 70%)',
                filter: 'blur(100px)',
              }}
            />
            <div 
              className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[600px] opacity-15"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(0 70% 50% / 0.2), transparent 70%)',
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
          <div className="relative z-10 w-full max-w-md px-4 sm:px-0">
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
                background: 'linear-gradient(135deg, hsl(0 70% 50% / 0.3) 0%, transparent 30%, transparent 70%, hsl(180 50% 50% / 0.2) 100%)',
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

              <div className="relative p-8 sm:p-12 text-center">
                {/* Error icon */}
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </div>

                {/* Error indicator */}
                <div className="mb-4">
                  <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
                    Runtime Error
                  </span>
                </div>

                {/* Main headline */}
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                  Something broke
                </h1>

                {/* Subtext */}
                <p className="text-muted-foreground text-base sm:text-lg mb-6 max-w-xs mx-auto">
                  We encountered an unexpected error. Try refreshing the page or go back.
                </p>

                {/* Error details (collapsed by default in production) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-left">
                    <p className="text-sm font-mono text-destructive break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={this.handleReload}
                    className="h-12 px-6 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Page
                  </Button>
                  
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="h-12 px-6 rounded-xl gap-2 border-border/50 hover:bg-secondary/50 font-medium"
                  >
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>

                <div className="mt-4">
                  <Button 
                    onClick={this.handleGoBack}
                    variant="ghost"
                    className="h-10 px-4 gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

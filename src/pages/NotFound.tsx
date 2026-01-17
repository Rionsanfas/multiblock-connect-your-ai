import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Compass } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-[hsl(220_20%_4%)] dot-grid-bg">
      {/* Ambient lighting effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top light */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--accent) / 0.4), transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Bottom accent */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(180 50% 40% / 0.4), transparent 70%)',
            filter: 'blur(80px)',
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

      {/* Content */}
      <div className="relative z-10 text-center max-w-md mx-auto px-4">
        {/* Glass Card */}
        <div 
          className="relative rounded-3xl overflow-hidden p-8 sm:p-12"
          style={{
            background: 'linear-gradient(145deg, hsl(0 0% 10% / 0.85), hsl(0 0% 6% / 0.95))',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 25px 50px -12px hsl(0 0% 0% / 0.5), inset 0 1px 0 0 hsl(0 0% 100% / 0.05)',
            border: '1px solid hsl(0 0% 100% / 0.08)',
          }}
        >
          {/* Inner light reflection */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 opacity-30 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.08), transparent)',
            }}
          />

          {/* Compass icon with glow */}
          <div className="relative mb-6">
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                filter: 'blur(20px)',
                opacity: 0.4,
              }}
            >
              <Compass className="w-20 h-20 text-accent" />
            </div>
            <div className="relative flex items-center justify-center">
              <Compass className="w-16 h-16 text-muted-foreground animate-pulse" />
            </div>
          </div>

          {/* Main text */}
          <h1 
            className="text-6xl sm:text-7xl font-bold mb-4 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent"
          >
            Lost
          </h1>
          
          <p className="text-muted-foreground text-base sm:text-lg mb-2">
            The page you're looking for doesn't exist.
          </p>
          
          <p className="text-muted-foreground/70 text-sm mb-8">
            Go here to find your way →
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="h-11 px-6 rounded-xl gap-2 border-border/50 hover:border-foreground/30 hover:bg-secondary/50 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button
              onClick={() => navigate("/dashboard")}
              className="h-11 px-6 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* 404 code - subtle at bottom */}
        <p className="mt-6 text-muted-foreground/40 text-xs font-mono">
          Error 404
        </p>
      </div>
    </div>
  );
};

export default NotFound;

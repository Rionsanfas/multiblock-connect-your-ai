import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const typingPhrases = [
  "How does AI work?",
  "Explain quantum computing",
  "What is machine learning?",
  "Tell me about neural networks",
];

export function HeroBlocks() {
  const [typingText, setTypingText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = typingPhrases[phraseIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (typingText.length < currentPhrase.length) {
          setTypingText(currentPhrase.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (typingText.length > 0) {
          setTypingText(typingText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, phraseIndex]);

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[500px]">
      {/* SVG Connection Lines - Behind blocks */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 300 500"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter for dots */}
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Animated flowing gradient for line 1 */}
          <linearGradient id="flowLine1" gradientUnits="userSpaceOnUse" x1="80" y1="120" x2="180" y2="220">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="-0.3;1.7" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="1">
              <animate attributeName="offset" values="-0.1;1.9" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="0.1;2.1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="80%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="0.3;2.3" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          
          {/* Animated flowing gradient for line 2 */}
          <linearGradient id="flowLine2" gradientUnits="userSpaceOnUse" x1="180" y1="320" x2="100" y2="420">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.5;1.5" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="-0.3;1.7" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="1">
              <animate attributeName="offset" values="-0.1;1.9" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
              <animate attributeName="offset" values="0.1;2.1" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
            <stop offset="80%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="0.3;2.3" dur="2s" begin="1s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        
        {/* Base dashed lines */}
        <path
          d="M 80 120 C 80 170, 180 180, 180 220"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <path
          d="M 180 320 C 180 370, 100 380, 100 420"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        
        {/* Animated flowing lines */}
        <path
          d="M 80 120 C 80 170, 180 180, 180 220"
          fill="none"
          stroke="url(#flowLine1)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#dotGlow)"
          className="motion-reduce:hidden"
        />
        <path
          d="M 180 320 C 180 370, 100 380, 100 420"
          fill="none"
          stroke="url(#flowLine2)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#dotGlow)"
          className="motion-reduce:hidden"
        />
        
        {/* Glowing connection dots */}
        <circle cx="80" cy="120" r="7" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
        <circle cx="180" cy="220" r="7" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
        <circle cx="180" cy="320" r="7" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
        <circle cx="100" cy="420" r="7" fill="hsl(var(--primary))" filter="url(#dotGlow)" />
      </svg>
      
      {/* Chat Blocks Container */}
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8">
        {/* Block 1 - With typing animation */}
        <div
          style={{ transform: "translateX(-40px)" }}
          className={cn(
            "relative",
            "w-48 md:w-64 lg:w-72",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
            "p-4 md:p-5"
          )}
        >
          <p className="text-xs text-muted-foreground mb-2">You</p>
          <p className="text-sm md:text-base text-foreground font-medium min-h-[24px]">
            {typingText}
            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
          </p>
        </div>
        
        {/* Block 2 - AI Response */}
        <div
          style={{ transform: "translateX(50px)" }}
          className={cn(
            "relative",
            "w-52 md:w-72 lg:w-80",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
            "p-4 md:p-5"
          )}
        >
          <p className="text-xs text-muted-foreground mb-2">AI Assistant</p>
          <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
            AI uses neural networks to process data and learn patterns, enabling intelligent responses.
          </p>
          <div className="flex gap-2 mt-3">
            <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full">GPT-4</span>
            <span className="text-[10px] px-2 py-1 bg-muted text-muted-foreground rounded-full">Copy</span>
          </div>
        </div>
        
        {/* Block 3 - Follow-up */}
        <div
          style={{ transform: "translateX(-20px)" }}
          className={cn(
            "relative",
            "w-44 md:w-56 lg:w-64",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
            "p-4 md:p-5"
          )}
        >
          <p className="text-xs text-muted-foreground mb-2">Follow-up</p>
          <p className="text-sm md:text-base text-foreground/80">
            Can you give me an example?
          </p>
        </div>
      </div>
    </div>
  );
}

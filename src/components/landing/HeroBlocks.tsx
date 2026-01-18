import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { MoreHorizontal, Copy, Paperclip, X, ArrowUp } from "lucide-react";

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

    const timeout = setTimeout(
      () => {
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
      },
      isDeleting ? 50 : 100,
    );

    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, phraseIndex]);

  // Attachment UI component
  const AttachmentUI = ({ fileName = "document.pdf", showAttachment = false }: { fileName?: string; showAttachment?: boolean }) => (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <button className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted transition-colors">
        <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {showAttachment && (
        <div className="flex items-center gap-2 px-2.5 py-1 bg-muted/40 rounded-lg border border-border/30">
          <span className="text-[10px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">.PDF</span>
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{fileName}</span>
          <button className="p-0.5 hover:bg-muted rounded transition-colors">
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    /* 
      Responsive container that scales with viewport.
      Uses CSS scale transform for proportional sizing across breakpoints.
      Now visible on all screens with proper mobile scaling.
    */
    <div 
      className={cn(
        "relative w-full h-full flex items-center justify-center",
        "origin-center",
        "motion-reduce:!transform-none",
        /* Responsive scaling - smaller on mobile to fit all blocks */
        "scale-[0.38] xs:scale-[0.42] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.8] xl:scale-[0.95]"
      )}
    >
      {/* SVG Connection Lines - Softer glow with smoother animation */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 responsive-media"
        viewBox="0 0 500 700"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Softer glow filter */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="flowLine1" gradientUnits="userSpaceOnUse" x1="100" y1="170" x2="200" y2="280">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.8;1.8" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="15%" stopColor="hsl(var(--primary))" stopOpacity="0.3">
              <animate attributeName="offset" values="-0.65;1.95" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6">
              <animate attributeName="offset" values="-0.3;2.3" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="85%" stopColor="hsl(var(--primary))" stopOpacity="0.3">
              <animate attributeName="offset" values="0.05;2.65" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="0.2;2.8" dur="3.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
          </linearGradient>

          <linearGradient id="flowLine2" gradientUnits="userSpaceOnUse" x1="200" y1="430" x2="120" y2="530">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="-0.8;1.8" dur="3.5s" begin="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="15%" stopColor="hsl(var(--primary))" stopOpacity="0.3">
              <animate attributeName="offset" values="-0.65;1.95" dur="3.5s" begin="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6">
              <animate attributeName="offset" values="-0.3;2.3" dur="3.5s" begin="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="85%" stopColor="hsl(var(--primary))" stopOpacity="0.3">
              <animate attributeName="offset" values="0.05;2.65" dur="3.5s" begin="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="offset" values="0.2;2.8" dur="3.5s" begin="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </stop>
          </linearGradient>
        </defs>

        {/* Base dashed lines */}
        <path
          d="M 100 170 C 100 220, 200 240, 200 280"
          fill="none"
          stroke="hsl(var(--primary) / 0.1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <path
          d="M 200 430 C 200 480, 120 500, 120 530"
          fill="none"
          stroke="hsl(var(--primary) / 0.1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />

        {/* Animated flowing lines with soft glow - hidden for reduced motion */}
        <path
          d="M 100 170 C 100 220, 200 240, 200 280"
          fill="none"
          stroke="url(#flowLine1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#softGlow)"
          className="motion-reduce:hidden"
        />
        <path
          d="M 200 430 C 200 480, 120 500, 120 530"
          fill="none"
          stroke="url(#flowLine2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#softGlow)"
          className="motion-reduce:hidden"
        />

        {/* Static fallback for reduced motion */}
        <path
          d="M 100 170 C 100 220, 200 240, 200 280"
          fill="none"
          stroke="hsl(var(--primary) / 0.2)"
          strokeWidth="2"
          strokeLinecap="round"
          className="hidden motion-reduce:block"
        />
        <path
          d="M 200 430 C 200 480, 120 500, 120 530"
          fill="none"
          stroke="hsl(var(--primary) / 0.2)"
          strokeWidth="2"
          strokeLinecap="round"
          className="hidden motion-reduce:block"
        />
      </svg>

      {/* Chat Blocks Container - uses flex with gap for consistent spacing, tighter on mobile */}
      <div className="relative z-10 flex flex-col items-center gap-8 sm:gap-12 md:gap-14 lg:gap-16">
        {/* Block 1 - User input with typing animation */}
        <div
          style={{ 
            transform: "translateX(-20px)",
            animation: "heroFloat1 8s ease-in-out infinite"
          }}
          className={cn(
            "relative motion-reduce:!transform-none",
            "w-[20rem] sm:w-[22rem]",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.15)]",
            "backdrop-blur-xl",
          )}
        >
          {/* Header with dots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <p className="text-sm text-muted-foreground">You</p>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground/60" />
          </div>
          
          {/* Content */}
          <div className="px-6 pb-3">
            <p className="text-lg text-foreground font-medium min-h-[32px] text-break">
              {typingText}
              <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
            </p>
          </div>
          
          {/* Footer with attachment and send button */}
          <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-2 border-t border-border/20">
            <AttachmentUI showAttachment={true} fileName="notes.pdf" />
            <button 
              aria-label="Send"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground hover:bg-foreground/90 text-background transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Block 2 - AI Response */}
        <div
          style={{ 
            transform: "translateX(40px)",
            animation: "heroFloat2 7s ease-in-out infinite"
          }}
          className={cn(
            "relative motion-reduce:!transform-none",
            "w-[22rem] sm:w-[24rem] md:w-[26rem]",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.15)]",
            "backdrop-blur-xl",
          )}
        >
          {/* Header with dots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <p className="text-sm text-muted-foreground">AI Assistant</p>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground/60" />
          </div>
          
          {/* Content */}
          <div className="px-6 pb-3">
            <p className="text-base text-foreground/90 leading-relaxed text-break">
              AI uses neural networks to process data and learn patterns, enabling intelligent responses.
            </p>
          </div>
          
          {/* Footer with attachment, model badge and copy */}
          <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-2 border-t border-border/20 flex-wrap">
            <div className="flex items-center gap-2">
              <AttachmentUI />
              <span className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium">ChatGPT 5</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-colors">
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>

        {/* Block 3 - Follow-up */}
        <div
          style={{ 
            transform: "translateX(-10px)",
            animation: "heroFloat3 9s ease-in-out infinite"
          }}
          className={cn(
            "relative motion-reduce:!transform-none",
            "w-[18rem] sm:w-[20rem]",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.15)]",
            "backdrop-blur-xl",
          )}
        >
          {/* Header with dots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <p className="text-sm text-muted-foreground">AI Assistant</p>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground/60" />
          </div>
          
          {/* Content */}
          <div className="px-6 pb-3">
            <p className="text-base text-foreground/80 text-break">Can you give me an example?</p>
          </div>
          
          {/* Footer with attachment, model badge and copy */}
          <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-2 border-t border-border/20 flex-wrap">
            <div className="flex items-center gap-2">
              <AttachmentUI />
              <span className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full font-medium">
                Claude 4
              </span>
            </div>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-colors">
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Floating animation styles with reduced motion support */}
      <style>{`
        @keyframes heroFloat1 {
          0%, 100% { transform: translateX(-20px) translateY(0); }
          50% { transform: translateX(-20px) translateY(-6px); }
        }
        @keyframes heroFloat2 {
          0%, 100% { transform: translateX(40px) translateY(0); }
          50% { transform: translateX(40px) translateY(-8px); }
        }
        @keyframes heroFloat3 {
          0%, 100% { transform: translateX(-10px) translateY(0); }
          50% { transform: translateX(-10px) translateY(-5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes heroFloat1 { 0%, 100% { transform: translateX(-20px) translateY(0); } }
          @keyframes heroFloat2 { 0%, 100% { transform: translateX(40px) translateY(0); } }
          @keyframes heroFloat3 { 0%, 100% { transform: translateX(-10px) translateY(0); } }
        }
      `}</style>
    </div>
  );
}
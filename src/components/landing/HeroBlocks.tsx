import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Send, MoreHorizontal, Copy } from "lucide-react";

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

  return (
    <div className="relative w-full h-full flex items-center justify-start min-h-[700px] pl-4">
      {/* SVG Connection Lines - Behind blocks */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 500 700"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="flowLine1" gradientUnits="userSpaceOnUse" x1="100" y1="170" x2="200" y2="280">
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

          <linearGradient id="flowLine2" gradientUnits="userSpaceOnUse" x1="200" y1="430" x2="120" y2="530">
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
          d="M 100 170 C 100 220, 200 240, 200 280"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <path
          d="M 200 430 C 200 480, 120 500, 120 530"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />

        {/* Animated flowing lines */}
        <path
          d="M 100 170 C 100 220, 200 240, 200 280"
          fill="none"
          stroke="url(#flowLine1)"
          strokeWidth="3"
          strokeLinecap="round"
          className="motion-reduce:hidden"
        />
        <path
          d="M 200 430 C 200 480, 120 500, 120 530"
          fill="none"
          stroke="url(#flowLine2)"
          strokeWidth="3"
          strokeLinecap="round"
          className="motion-reduce:hidden"
        />
      </svg>

      {/* Chat Blocks Container - Shifted left */}
      <div className="relative z-10 flex flex-col items-start gap-16 md:gap-20 ml-0">
        {/* Block 1 - User input with typing animation */}
        <div
          style={{ transform: "translateX(-20px)" }}
          className={cn(
            "relative",
            "w-72 md:w-96 lg:w-[28rem]",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
          )}
        >
          {/* Header with dots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <p className="text-sm text-muted-foreground">You</p>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground/60" />
          </div>
          
          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-lg md:text-xl text-foreground font-medium min-h-[32px]">
              {typingText}
              <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
            </p>
          </div>
          
          {/* Footer with send button */}
          <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-2 border-t border-border/20">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm font-medium">
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>

        {/* Block 2 - AI Response */}
        <div
          style={{ transform: "translateX(40px)" }}
          className={cn(
            "relative",
            "w-80 md:w-[26rem] lg:w-[32rem]",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
          )}
        >
          {/* Header with dots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <p className="text-sm text-muted-foreground">AI Assistant</p>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground/60" />
          </div>
          
          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
              AI uses neural networks to process data and learn patterns, enabling intelligent responses.
            </p>
          </div>
          
          {/* Footer with model badge and copy */}
          <div className="flex items-center gap-3 px-6 pb-5 pt-2 border-t border-border/20">
            <span className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium">ChatGPT 5</span>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-colors">
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>

        {/* Block 3 - Follow-up */}
        <div
          style={{ transform: "translateX(-10px)" }}
          className={cn(
            "relative",
            "w-72 md:w-80 lg:w-96",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
          )}
        >
          {/* Header with dots */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <p className="text-sm text-muted-foreground">AI Assistant</p>
            <MoreHorizontal className="w-5 h-5 text-muted-foreground/60" />
          </div>
          
          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-base md:text-lg text-foreground/80">Can you give me an example?</p>
          </div>
          
          {/* Footer with model badge and copy */}
          <div className="flex items-center gap-3 px-6 pb-5 pt-2 border-t border-border/20">
            <span className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full font-medium">
              Claude 4
            </span>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-colors">
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

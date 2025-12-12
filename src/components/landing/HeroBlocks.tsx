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
    <div className="relative w-full h-full flex items-center justify-center min-h-[700px]">
      {/* SVG Connection Lines - Behind blocks */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 400 700"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Animated flowing gradient for line 1 */}
          <linearGradient id="flowLine1" gradientUnits="userSpaceOnUse" x1="120" y1="130" x2="260" y2="270">
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
          <linearGradient id="flowLine2" gradientUnits="userSpaceOnUse" x1="260" y1="430" x2="140" y2="570">
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
          d="M 120 130 C 120 200, 260 210, 260 270"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <path
          d="M 260 430 C 260 500, 140 510, 140 570"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />

        {/* Animated flowing lines */}
        <path
          d="M 120 130 C 120 200, 260 210, 260 270"
          fill="none"
          stroke="url(#flowLine1)"
          strokeWidth="3"
          strokeLinecap="round"
          className="motion-reduce:hidden"
        />
        <path
          d="M 260 430 C 260 500, 140 510, 140 570"
          fill="none"
          stroke="url(#flowLine2)"
          strokeWidth="3"
          strokeLinecap="round"
          className="motion-reduce:hidden"
        />
      </svg>

      {/* Chat Blocks Container */}
      <div className="relative z-10 flex flex-col items-center gap-12 md:gap-16">
        {/* Block 1 - With typing animation */}
        <div
          style={{ transform: "translateX(-60px)" }}
          className={cn(
            "relative",
            "w-64 md:w-80 lg:w-96",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
            "p-6 md:p-8",
          )}
        >
          <p className="text-sm text-muted-foreground mb-3">You</p>
          <p className="text-lg md:text-xl text-foreground font-medium min-h-[32px]">
            {typingText}
            <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
          </p>
        </div>

        {/* Block 2 - AI Response */}
        <div
          style={{ transform: "translateX(70px)" }}
          className={cn(
            "relative",
            "w-60 md:w-96 lg:w-[28rem]",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
            "p-6 md:p-8",
          )}
        >
          <p className="text-sm text-muted-foreground mb-3">AI Assistant</p>
          <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
            AI uses neural networks to process data and learn patterns, enabling intelligent responses.
          </p>
          <div className="flex gap-3 mt-4">
            <span className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium">ChatGPT 5</span>
            <span className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full">Copy</span>
          </div>
        </div>

        {/* Block 3 - Follow-up */}
        <div
          style={{ transform: "translateX(-30px)" }}
          className={cn(
            "relative",
            "w-60 md:w-72 lg:w-80",
            "rounded-2xl",
            "bg-gradient-to-br from-secondary/90 via-secondary/60 to-secondary/30",
            "border border-border/40",
            "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.2)]",
            "backdrop-blur-xl",
            "p-6 md:p-8",
          )}
        >
          <p className="text-sm text-muted-foreground mb-3">AI Assistant</p>
          <p className="text-base md:text-lg text-foreground/80">Can you give me an example?</p>
          <div className="flex gap-3 mt-4">
            <span className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full font-medium">
              Claude 4
            </span>
            <span className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full">Copy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

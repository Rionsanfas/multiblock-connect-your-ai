import { useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";

/**
 * MemoryFeatureCard — Animated card showing cursor interacting with
 * the "Save to Board Memory" icon on a blurred chat message.
 */
const MemoryFeatureCard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="glass-card-hover group h-full flex flex-col overflow-hidden"
    >
      {/* Animation area */}
      <div className="relative w-full overflow-hidden rounded-t-[1rem] bg-card/60 flex items-center justify-center"
        style={{ minHeight: 220 }}
      >
        {/* Fake blurred message bubble */}
        <div className="relative flex flex-col items-start gap-2 w-[85%] max-w-[320px] py-8">
          {/* Blurry "assistant" message */}
          <div className="w-full rounded-xl bg-secondary/40 border border-border/20 px-4 py-3 space-y-2">
            {/* Blurred text lines */}
            <div className="h-3 w-[90%] rounded-full bg-muted-foreground/20 blur-[5px]" />
            <div className="h-3 w-[75%] rounded-full bg-muted-foreground/15 blur-[5px]" />
            <div className="h-3 w-[60%] rounded-full bg-muted-foreground/18 blur-[5px]" />
          </div>

          {/* Action row — the save icon lives here */}
          <div className="flex items-center gap-1.5 ml-1">
            {/* The Bookmark / Save icon */}
            <div
              className={`
                relative p-1.5 rounded-md transition-all duration-500
                ${isVisible ? "memory-icon-glow" : ""}
              `}
            >
              <Bookmark
                className={`
                  h-4 w-4 transition-all duration-500
                  ${isVisible
                    ? "text-accent scale-125 drop-shadow-[0_0_8px_hsl(var(--accent)/0.7)]"
                    : "text-muted-foreground scale-100"
                  }
                `}
              />
            </div>
          </div>

          {/* Animated cursor */}
          <div
            className={`
              absolute pointer-events-none transition-all
              ${isVisible ? "memory-cursor-animate" : "opacity-0"}
            `}
            style={{
              /* start position: bottom-right of the card */
              bottom: 0,
              left: "50%",
              width: 20,
              height: 20,
            }}
          >
            {/* Cursor SVG — classic pointer */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 drop-shadow-lg"
            >
              <path
                d="M5 3l14 8.5-6.5 1.5L9 19.5 5 3z"
                fill="hsl(var(--foreground))"
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        {/* Subtle radial glow behind icon when active */}
        <div
          className={`
            absolute left-[10%] bottom-[25%] w-24 h-24 rounded-full
            bg-accent/10 blur-2xl pointer-events-none transition-opacity duration-700
            ${isVisible ? "opacity-100" : "opacity-0"}
          `}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6">
        <h3 className="font-semibold text-foreground text-base sm:text-lg lg:text-xl mb-2">
          Save Context to Board Memory
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          One click saves key insights to memory — every block on your board stays informed without repeating yourself.
        </p>
      </div>
    </div>
  );
};

export default MemoryFeatureCard;

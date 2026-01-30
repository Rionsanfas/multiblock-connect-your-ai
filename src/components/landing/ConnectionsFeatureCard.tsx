import { useEffect, useRef, useState } from "react";
import connectionsDemoVideo from "@/assets/connections-demo.mov";

/**
 * ConnectionsFeatureCard - Premium product demo card with looping video
 *
 * To swap the video/poster:
 * 1. Replace src/assets/connections-demo.mov with your new video
 * 2. Replace src/assets/connections-poster.jpg with your new poster (optional)
 */
const ConnectionsFeatureCard = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // IntersectionObserver: pause when off-screen, play when visible
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Autoplay blocked - video will show poster
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="glass-card-hover group h-full flex flex-col overflow-hidden">
      {/* Video Container - maintains aspect ratio */}
      <div className="relative w-full overflow-hidden rounded-t-[1rem]">
        {/* Aspect ratio wrapper - supports 4:5 mobile video */}
        <div className="relative w-full" style={{ aspectRatio: "4/5" }}>
          {/* Loading skeleton */}
          {!isLoaded && <div className="absolute inset-0 bg-card animate-pulse rounded-t-[1rem]" />}

          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => setIsLoaded(true)}
          >
            <source src={connectionsDemoVideo} type="video/mp4" />
          </video>

          {/* Subtle gradient overlay at bottom for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6">
        {/* Title */}
        <h3 className="font-semibold text-foreground text-base sm:text-lg lg:text-xl mb-2">Link Thoughts Instantly</h3>

        {/* Description - customer-focused copy */}
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Drag the line from the block's cover to connect AI blocks in seconds—watch context flow seamlessly between
          your ideas.
        </p>
      </div>
    </div>
  );
};

export default ConnectionsFeatureCard;

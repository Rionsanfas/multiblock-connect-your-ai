import { useEffect, useState } from 'react';

interface HeroHandsAnimationProps {
  show: boolean;
}

export function HeroHandsAnimation({ show }: HeroHandsAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (show) {
      // Phase 1: Hands start entering
      setTimeout(() => setAnimationPhase(1), 100);
      // Phase 2: Hands reach center, AI text grows
      setTimeout(() => setAnimationPhase(2), 800);
      // Phase 3: Full animation complete
      setTimeout(() => setAnimationPhase(3), 1400);
    }
  }, [show]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Ambient glow behind the scene */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 50%, hsl(0 0% 20% / 0.15) 0%, transparent 70%)',
          opacity: animationPhase >= 2 ? 1 : 0,
        }}
      />

      {/* ============================================
          ROBOT HAND - LEFT SIDE
          Chrome/metallic mechanical hand
          ============================================ */}
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-auto transition-all duration-1000 ease-out"
        viewBox="0 0 300 400"
        style={{
          transform: `translateX(${animationPhase >= 1 ? '0%' : '-100%'}) translateY(-50%)`,
          opacity: animationPhase >= 1 ? 1 : 0,
        }}
      >
        <defs>
          {/* Metallic gradient for robot hand */}
          <linearGradient id="robotMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 85%)" />
            <stop offset="20%" stopColor="hsl(0, 0%, 45%)" />
            <stop offset="40%" stopColor="hsl(0, 0%, 75%)" />
            <stop offset="60%" stopColor="hsl(0, 0%, 30%)" />
            <stop offset="80%" stopColor="hsl(0, 0%, 60%)" />
            <stop offset="100%" stopColor="hsl(0, 0%, 20%)" />
          </linearGradient>
          
          <linearGradient id="robotHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="hsl(0, 0%, 70%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(0, 0%, 30%)" stopOpacity="0.2" />
          </linearGradient>

          <filter id="robotGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Robot Arm */}
        <g filter="url(#robotGlow)">
          {/* Forearm segments */}
          <rect x="-20" y="170" width="180" height="60" rx="8" fill="url(#robotMetallic)" stroke="hsl(0, 0%, 50%)" strokeWidth="1">
            <animate attributeName="y" values="170;168;170" dur="3s" repeatCount="indefinite" />
          </rect>
          
          {/* Joint rings */}
          <ellipse cx="160" cy="200" rx="20" ry="35" fill="hsl(0, 0%, 25%)" stroke="hsl(0, 0%, 60%)" strokeWidth="2">
            <animate attributeName="ry" values="35;33;35" dur="2s" repeatCount="indefinite" />
          </ellipse>
          
          {/* Hand base/palm */}
          <path 
            d="M 155 155 
               C 175 145, 210 140, 230 150 
               L 260 180 
               C 270 195, 270 210, 260 225 
               L 230 250 
               C 210 260, 175 258, 155 248
               Z"
            fill="url(#robotMetallic)"
            stroke="hsl(0, 0%, 55%)"
            strokeWidth="1.5"
          >
            <animate attributeName="d" 
              values="M 155 155 C 175 145, 210 140, 230 150 L 260 180 C 270 195, 270 210, 260 225 L 230 250 C 210 260, 175 258, 155 248 Z;
                      M 155 157 C 175 147, 210 142, 230 152 L 260 182 C 270 197, 270 212, 260 227 L 230 252 C 210 262, 175 260, 155 250 Z;
                      M 155 155 C 175 145, 210 140, 230 150 L 260 180 C 270 195, 270 210, 260 225 L 230 250 C 210 260, 175 258, 155 248 Z"
              dur="4s" repeatCount="indefinite" />
          </path>

          {/* Mechanical finger joints */}
          {/* Thumb */}
          <path 
            d="M 175 245 L 190 270 C 195 280, 205 285, 215 280 L 230 265"
            fill="none"
            stroke="url(#robotMetallic)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          
          {/* Index finger - extended pointing */}
          <path 
            d="M 245 160 L 275 145 L 295 140"
            fill="none"
            stroke="url(#robotMetallic)"
            strokeWidth="12"
            strokeLinecap="round"
          >
            <animate attributeName="d" 
              values="M 245 160 L 275 145 L 295 140;M 245 158 L 275 143 L 297 138;M 245 160 L 275 145 L 295 140"
              dur="3.5s" repeatCount="indefinite" />
          </path>
          
          {/* Middle finger */}
          <path 
            d="M 255 175 L 280 170 L 295 168"
            fill="none"
            stroke="url(#robotMetallic)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          
          {/* Ring finger - slightly curled */}
          <path 
            d="M 260 195 L 280 200 L 285 210"
            fill="none"
            stroke="url(#robotMetallic)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          
          {/* Pinky - curled */}
          <path 
            d="M 255 215 L 270 225 L 268 240"
            fill="none"
            stroke="url(#robotMetallic)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Finger joints/knuckles */}
          <circle cx="275" cy="145" r="5" fill="hsl(0, 0%, 20%)" stroke="hsl(0, 0%, 70%)" strokeWidth="1.5" />
          <circle cx="280" cy="170" r="4.5" fill="hsl(0, 0%, 20%)" stroke="hsl(0, 0%, 70%)" strokeWidth="1.5" />
          <circle cx="280" cy="200" r="4" fill="hsl(0, 0%, 20%)" stroke="hsl(0, 0%, 70%)" strokeWidth="1.5" />
          <circle cx="270" cy="225" r="3.5" fill="hsl(0, 0%, 20%)" stroke="hsl(0, 0%, 70%)" strokeWidth="1.5" />

          {/* Chrome highlights */}
          <path 
            d="M 160 160 C 180 155, 200 155, 220 160"
            fill="none"
            stroke="hsl(0, 0%, 95%)"
            strokeWidth="2"
            strokeOpacity="0.6"
          />
          <path 
            d="M 40 175 L 150 175"
            fill="none"
            stroke="hsl(0, 0%, 90%)"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
        </g>
      </svg>

      {/* ============================================
          HUMAN HAND - RIGHT SIDE
          Organic, elegant reaching gesture
          ============================================ */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[55%] w-auto transition-all duration-1000 ease-out"
        viewBox="0 0 300 400"
        style={{
          transform: `translateX(${animationPhase >= 1 ? '0%' : '100%'}) translateY(-50%) scaleX(-1)`,
          opacity: animationPhase >= 1 ? 1 : 0,
        }}
      >
        <defs>
          {/* Grayscale skin tone gradient */}
          <linearGradient id="humanSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 75%)" />
            <stop offset="30%" stopColor="hsl(0, 0%, 60%)" />
            <stop offset="70%" stopColor="hsl(0, 0%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 0%, 40%)" />
          </linearGradient>

          <radialGradient id="humanDepth" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(0, 0%, 70%)" />
            <stop offset="100%" stopColor="hsl(0, 0%, 35%)" />
          </radialGradient>

          <filter id="humanSoftness">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#humanSoftness)">
          {/* Forearm */}
          <path 
            d="M -20 170 
               C 20 165, 80 160, 130 165
               L 135 235
               C 90 242, 30 240, -20 235
               Z"
            fill="url(#humanDepth)"
            stroke="hsl(0, 0%, 45%)"
            strokeWidth="0.5"
          >
            <animate attributeName="d" 
              values="M -20 170 C 20 165, 80 160, 130 165 L 135 235 C 90 242, 30 240, -20 235 Z;
                      M -20 168 C 20 163, 80 158, 130 163 L 135 233 C 90 240, 30 238, -20 233 Z;
                      M -20 170 C 20 165, 80 160, 130 165 L 135 235 C 90 242, 30 240, -20 235 Z"
              dur="5s" repeatCount="indefinite" />
          </path>
          
          {/* Wrist */}
          <ellipse cx="140" cy="200" rx="18" ry="40" fill="url(#humanSkin)" />
          
          {/* Palm */}
          <path 
            d="M 135 155 
               C 160 145, 200 140, 225 155 
               L 250 185 
               C 258 200, 258 210, 250 225 
               L 225 250 
               C 200 262, 165 260, 140 250
               Z"
            fill="url(#humanDepth)"
            stroke="hsl(0, 0%, 50%)"
            strokeWidth="0.5"
          >
            <animate attributeName="d" 
              values="M 135 155 C 160 145, 200 140, 225 155 L 250 185 C 258 200, 258 210, 250 225 L 225 250 C 200 262, 165 260, 140 250 Z;
                      M 135 153 C 160 143, 200 138, 225 153 L 250 183 C 258 198, 258 208, 250 223 L 225 248 C 200 260, 165 258, 140 248 Z;
                      M 135 155 C 160 145, 200 140, 225 155 L 250 185 C 258 200, 258 210, 250 225 L 225 250 C 200 262, 165 260, 140 250 Z"
              dur="4.5s" repeatCount="indefinite" />
          </path>

          {/* Thumb */}
          <path 
            d="M 165 245 
               Q 180 268, 200 275 
               Q 215 278, 225 265"
            fill="none"
            stroke="url(#humanSkin)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Index finger - elegantly extended */}
          <path 
            d="M 238 158 
               Q 265 148, 285 145 
               Q 295 144, 298 145"
            fill="none"
            stroke="url(#humanSkin)"
            strokeWidth="14"
            strokeLinecap="round"
          >
            <animate attributeName="d" 
              values="M 238 158 Q 265 148, 285 145 Q 295 144, 298 145;
                      M 238 156 Q 265 146, 285 143 Q 295 142, 300 143;
                      M 238 158 Q 265 148, 285 145 Q 295 144, 298 145"
              dur="4s" repeatCount="indefinite" />
          </path>

          {/* Middle finger */}
          <path 
            d="M 250 175 
               Q 275 172, 290 172"
            fill="none"
            stroke="url(#humanSkin)"
            strokeWidth="13"
            strokeLinecap="round"
          />

          {/* Ring finger - gracefully curved */}
          <path 
            d="M 252 195 
               Q 272 200, 280 210"
            fill="none"
            stroke="url(#humanSkin)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Pinky - naturally curled */}
          <path 
            d="M 248 215 
               Q 262 228, 260 245"
            fill="none"
            stroke="url(#humanSkin)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Subtle highlights on fingers */}
          <path 
            d="M 260 148 L 285 145"
            fill="none"
            stroke="hsl(0, 0%, 80%)"
            strokeWidth="2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* ============================================
          CENTER "AI" TEXT
          Starts small, grows to full size
          ============================================ */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-700 ease-out"
        style={{
          transform: `translate(-50%, -50%) scale(${animationPhase >= 2 ? 1 : 0.3})`,
          opacity: animationPhase >= 1 ? 1 : 0,
        }}
      >
        {/* Outer glow */}
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, hsl(0 0% 100% / 0.3) 0%, hsl(0 0% 80% / 0.15) 40%, transparent 70%)',
            filter: 'blur(30px)',
            transform: 'scale(2.5)',
            opacity: animationPhase >= 3 ? 1 : 0,
          }}
        />
        
        {/* AI Text */}
        <span 
          className="relative font-bold tracking-tighter select-none"
          style={{
            fontSize: 'clamp(4rem, 12vw, 10rem)',
            background: 'linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 70%) 50%, hsl(0 0% 40%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: animationPhase >= 3 
              ? '0 0 40px hsl(0 0% 100% / 0.5), 0 0 80px hsl(0 0% 80% / 0.3)' 
              : 'none',
            filter: animationPhase >= 3 ? 'drop-shadow(0 0 20px hsl(0 0% 100% / 0.4))' : 'none',
          }}
        >
          AI
        </span>

        {/* Pulsing energy ring */}
        <div 
          className="absolute rounded-full border transition-all duration-500"
          style={{
            width: 'clamp(100px, 25vw, 200px)',
            height: 'clamp(100px, 25vw, 200px)',
            borderColor: 'hsl(0 0% 100% / 0.2)',
            opacity: animationPhase >= 3 ? 1 : 0,
            animation: animationPhase >= 3 ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* Energy particles floating toward center */}
      {animationPhase >= 2 && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/60"
              style={{
                left: `${20 + i * 12}%`,
                top: `${40 + (i % 3) * 10}%`,
                animation: `float-to-center ${2 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Bottom fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/4 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)',
        }}
      />

      <style>{`
        @keyframes float-to-center {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.6;
          }
          50% {
            transform: translate(calc(50vw - 100%), calc(50vh - 100%));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

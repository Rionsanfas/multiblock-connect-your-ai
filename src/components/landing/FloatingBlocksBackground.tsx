import { useMemo } from 'react';

interface FloatingBlock {
  id: number;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  color: string;
}

const BLOCK_COLORS = [
  'hsl(var(--primary) / 0.15)',
  'hsl(var(--accent) / 0.12)',
  'hsl(220 50% 50% / 0.1)',
  'hsl(280 40% 50% / 0.08)',
  'hsl(30 40% 50% / 0.1)',
];

export function FloatingBlocksBackground() {
  const blocks = useMemo<FloatingBlock[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 120 + 60,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      color: BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)],
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Deep blur layer */}
      <div className="absolute inset-0 backdrop-blur-[100px]" />
      
      {blocks.map((block) => (
        <div
          key={block.id}
          className="absolute rounded-2xl animate-floating-block"
          style={{
            width: block.size,
            height: block.size,
            left: `${block.x}%`,
            top: `${block.y}%`,
            background: block.color,
            filter: 'blur(40px)',
            animationDelay: `${block.delay}s`,
            animationDuration: `${block.duration}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

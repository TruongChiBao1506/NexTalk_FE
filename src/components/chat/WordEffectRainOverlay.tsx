import React, { useEffect, useState } from 'react';

interface WordEffectRainOverlayProps {
  emoji: string;
  onFinished?: () => void;
}

export const WordEffectRainOverlay: React.FC<WordEffectRainOverlayProps> = ({ emoji, onFinished }) => {
  const [particles] = useState(() => {
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left: Math.random() * 92 + 4, // 4% to 96% inside chat pane
      size: Math.random() * 1.4 + 1.8, // 1.8rem to 3.2rem
      duration: Math.random() * 1.0 + 2.3, // 2.3s to 3.3s
      delay: Math.random() * 0.8, // 0 to 0.8s stagger
    }));
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[35] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 select-none animate-float-up opacity-95 drop-shadow-lg"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

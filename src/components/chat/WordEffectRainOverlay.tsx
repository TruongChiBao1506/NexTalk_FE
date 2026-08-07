import React, { useEffect, useState } from 'react';

interface WordEffectRainOverlayProps {
  emoji: string;
  onFinished?: () => void;
}

export const WordEffectRainOverlay: React.FC<WordEffectRainOverlayProps> = ({ emoji, onFinished }) => {
  const [particles] = useState(() => {
    return Array.from({ length: 38 }, (_, i) => ({
      id: i,
      left: Math.random() * 92 + 4, // 4% to 96%
      size: Math.random() * 1.5 + 1.8, // 1.8rem to 3.3rem
      duration: Math.random() * 1.0 + 2.3, // 2.3s to 3.3s
      delay: Math.random() * 0.9, // 0 to 0.9s stagger
    }));
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute -top-14 select-none animate-word-effect-fall opacity-95 drop-shadow-lg"
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

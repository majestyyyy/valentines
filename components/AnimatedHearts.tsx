'use client';

import { useEffect, useState } from 'react';

interface HeartProps {
  id: number;
  left: number;
  top: number;
  size: number;
  emoji: string;
  opacity: number;
  rotation: number;
}

const HEART_EMOJIS = ['❤️', '💕', '💖', '💗', '💓', '💞', '💝', '💘'];

export default function AnimatedHearts() {
  const [hearts, setHearts] = useState<HeartProps[]>([]);

  useEffect(() => {
    // Generate static background hearts
    const generatedHearts: HeartProps[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position (0-100%)
      top: Math.random() * 100, // Random vertical position (0-100%)
      size: 20 + Math.random() * 35, // Random size (20-55px)
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      opacity: 0.08 + Math.random() * 0.12, // Very subtle opacity (0.08-0.2)
      rotation: Math.random() * 360, // Random rotation
    }));
    setHearts(generatedHearts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-b from-pink-50/40 via-white to-red-50/30">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute animate-pulse"
          style={{
            left: `${heart.left}%`,
            top: `${heart.top}%`,
            fontSize: `${heart.size}px`,
            opacity: heart.opacity,
            transform: `rotate(${heart.rotation}deg)`,
            animationDuration: `${3 + Math.random() * 4}s`, // Subtle pulse 3-7s
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          {heart.emoji}
        </div>
      ))}
    </div>
  );
}

'use client'
import React from "react";
import { useEffect, useRef } from "react";

const lineCount = 3;

export type AudioPulseProps = {
  active: boolean;
  volume: number;
  hover?: boolean;
};

export default function AudioPulse({ active, volume, hover = false }: AudioPulseProps) {
  const lines = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let timeout: number | null = null;
    const update = () => {
      if (!lines.current) return;

      lines.current.forEach(
        (line, i) => {
          if (!line) return;
          const height = Math.min(24, 4 + volume * (i === 1 ? 400 : 60));
          line.style.height = `${height}px`;
        }
      );
      timeout = window.setTimeout(update, 100);
    };

    update();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [volume]);

  return (
    <div className={`flex items-center gap-1 h-6 ${active ? 'opacity-100' : 'opacity-50'} ${hover ? 'hover:opacity-75' : ''}`}>
      {Array(lineCount)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            className={`w-0.5 bg-white rounded-full transition-all duration-200 ease-in-out animate-pulse`}
            style={{
              height: '4px',
              animationDelay: `${i * 133}ms`,
            }}
            ref={el => {
              if (el) lines.current[i] = el;
            }}
          />
        ))}
    </div>
  );
}

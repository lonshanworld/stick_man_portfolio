'use client';

import React, { useEffect, useRef } from 'react';
import { ElementType } from '../../types';
import { ELEMENT_COLORS } from '../../data/elementData';

interface MagicalCursorProps {
  activeRealm: ElementType;
}

export const MagicalCursor: React.FC<MagicalCursorProps> = ({ activeRealm }) => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const frameInterval = 1000 / 30;
    let lastFrameTime = performance.now();
    let animId = 0;
    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);

      const p = posRef.current;
      const frameScale = Math.min(elapsed / (1000 / 60), 6);
      const smoothing = 1 - Math.pow(1 - 0.22, frameScale);
      p.x += (p.targetX - p.x) * smoothing;
      p.y += (p.targetY - p.y) * smoothing;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${p.targetX}px, ${p.targetY}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const colorConfig = ELEMENT_COLORS[activeRealm] || ELEMENT_COLORS.fire;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block">
      {/* Inner precise dot */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 -ml-1 -mt-1 w-2.5 h-2.5 rounded-full pointer-events-none transition-colors duration-300"
        style={{
          backgroundColor: colorConfig.primary,
          boxShadow: `0 0 10px ${colorConfig.primary}`,
        }}
      />
      {/* Outer floating elemental ring */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 -ml-4 -mt-4 w-8 h-8 rounded-full border border-dashed pointer-events-none transition-colors duration-300 animate-spin"
        style={{
          borderColor: colorConfig.secondary,
          boxShadow: `0 0 16px ${colorConfig.glow}`,
          animationDuration: '6s',
        }}
      />
    </div>
  );
};

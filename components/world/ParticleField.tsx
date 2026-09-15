'use client';

import React, { useEffect, useRef } from 'react';
import { ElementType } from '../../types';
import { THEMES } from '../../systems/themeEngine';

interface ParticleFieldProps {
  activeRealm: ElementType;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  baseOpacity: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  phase: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({ activeRealm }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = THEMES[activeRealm] || THEMES.fire;
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = THEMES[activeRealm] || THEMES.fire;
  }, [activeRealm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create drifting atmospheric particles
    const PARTICLE_COUNT = 45;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.2 + Math.random() * 2.2,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -0.25 - Math.random() * 0.45,
      opacity: 0.2 + Math.random() * 0.5,
      baseOpacity: 0.2 + Math.random() * 0.5,
    }));

    // Create background faint starfield
    const STAR_COUNT = 90;
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.6 + Math.random() * 1.0,
      twinkleSpeed: 0.8 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
    }));

    let animId: number;
    const frameInterval = 1000 / 30;
    let lastFrameTime = performance.now();
    let time = 0;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);
      const deltaSeconds = Math.min(elapsed / 1000, 0.1);
      const frameScale = deltaSeconds * 60;
      time += deltaSeconds;
      ctx.clearRect(0, 0, width, height);

      const currentTheme = themeRef.current;

      // Draw faint twinkling stars
      ctx.fillStyle = '#ffffff';
      stars.forEach((s) => {
        const alpha = 0.15 + Math.sin(time * s.twinkleSpeed + s.phase) * 0.12;
        ctx.globalAlpha = Math.max(0.04, alpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw drifting elemental motes
      ctx.fillStyle = currentTheme.primaryColor;
      particles.forEach((p) => {
        p.x += p.speedX * frameScale;
        p.y += p.speedY * frameScale;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};

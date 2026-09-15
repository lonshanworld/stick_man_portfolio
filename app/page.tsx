'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ElementType } from '../types';
import { applyThemeVariables } from '../systems/themeEngine';
import { soundEngine } from '../systems/soundEngine';
import { CURSOR } from '../utils/cursorRef';

// Portfolio Content Components
import { NavBar } from '../components/portfolio/NavBar';
import { HeroSection } from '../components/portfolio/HeroSection';
import { ExperienceSection } from '../components/portfolio/ExperienceSection';
import { ProjectsSection } from '../components/portfolio/ProjectsSection';
import { SkillsSection } from '../components/portfolio/SkillsSection';
import { AIChatTerminal } from '../components/portfolio/AIChatTerminal';
import { ContactSection } from '../components/portfolio/ContactSection';

const MagicalCursor = dynamic(
  () => import('../components/world/MagicalCursor').then((mod) => mod.MagicalCursor),
  { ssr: false }
);
const ParticleField = dynamic(
  () => import('../components/world/ParticleField').then((mod) => mod.ParticleField),
  { ssr: false }
);
const StickManWorld3D = dynamic(
  () => import('../components/stickman/StickManWorld3D').then((mod) => mod.StickManWorld3D),
  { ssr: false }
);

export default function Home() {
  const [activeRealm, setActiveRealm] = useState<ElementType>('fire');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [effectsReady, setEffectsReady] = useState(false);

  // Apply dynamic theme variables on realm change
  useEffect(() => {
    applyThemeVariables(activeRealm);
  }, [activeRealm]);

  // Prioritize useful portfolio content, then load the visual world during idle time.
  useEffect(() => {
    const revealEffects = () => setEffectsReady(true);
    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (browserWindow.requestIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(revealEffects, { timeout: 1200 });
      return () => browserWindow.cancelIdleCallback?.(idleId);
    }
    const timer = setTimeout(revealEffects, 250);
    return () => clearTimeout(timer);
  }, []);

  // Global mouse cursor tracker without triggering React re-renders
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      CURSOR.x = e.clientX;
      CURSOR.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSelectRealm = useCallback((realm: ElementType) => {
    setActiveRealm(realm);
    soundEngine.playElementalWhoosh(realm);
  }, []);

  const handleStickManWhisper = useCallback((realm: ElementType) => {
    setActiveRealm(realm);
  }, []);

  const handleToggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      soundEngine.setEnabled(next);
      return next;
    });
  }, []);

  return (
    <main
      aria-label="Lon Shan portfolio"
      className="relative min-h-screen text-white overflow-x-clip selection:bg-white/20"
    >
      {/* ── 1. Dynamic Atmospheric Background ────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-700"
        style={{ background: 'var(--theme-bg)' }}
      />

      {/* ── 2. Atmospheric Particle Field (Stars & Elemental Motes) ─── */}
      {effectsReady && <ParticleField activeRealm={activeRealm} />}

      {/* ── 3. Magical Dual-Ring Responsive Cursor ───────────────────── */}
      {effectsReady && <MagicalCursor activeRealm={activeRealm} />}

      {/* ── 4. Full-Screen 3D Stick Men World (Roaming across website) ── */}
      {effectsReady && (
        <StickManWorld3D
          activeRealm={activeRealm}
          onStickManSelect={handleSelectRealm}
          onStickManWhisper={handleStickManWhisper}
        />
      )}

      {/* ── 6. Frosted Glass Top Navigation Bar ──────────────────────── */}
      <NavBar
        activeRealm={activeRealm}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* ── 7. Main Portfolio Content Sections (Spacious & Elegant) ──── */}
      <div className="relative z-10">
        <HeroSection activeRealm={activeRealm} />
        <ExperienceSection activeRealm={activeRealm} />
        <ProjectsSection activeRealm={activeRealm} />
        <SkillsSection activeRealm={activeRealm} />
        <AIChatTerminal activeRealm={activeRealm} />
        <ContactSection activeRealm={activeRealm} />
      </div>

    </main>
  );
}

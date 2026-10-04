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

const StickManWorld3D = dynamic(
  () =>
    import('../components/stickman/StickManWorld3D').then(
      (mod) => mod.StickManWorld3D,
    ),
  { ssr: false },
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
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (browserWindow.requestIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(revealEffects, {
        timeout: 1200,
      });
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

  // Dialogue can arrive after another character is selected; selection owns the theme.
  const handleStickManWhisper = useCallback(() => {}, []);

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
      data-realm={activeRealm}
      className="folio relative min-h-screen overflow-x-clip"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'var(--folio-bg)' }}
      />

      {effectsReady && (
        <StickManWorld3D
          activeRealm={activeRealm}
          onStickManSelect={handleSelectRealm}
          onStickManWhisper={handleStickManWhisper}
        />
      )}

      <NavBar
        activeRealm={activeRealm}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
      />

      <div className="folio-content relative">
        <HeroSection activeRealm={activeRealm} onSelectRealm={handleSelectRealm} />
        <ProjectsSection activeRealm={activeRealm} />
        <ExperienceSection activeRealm={activeRealm} />
        <SkillsSection activeRealm={activeRealm} />
        <AIChatTerminal activeRealm={activeRealm} />
        <ContactSection activeRealm={activeRealm} />
      </div>
    </main>
  );
}

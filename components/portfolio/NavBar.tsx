'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ElementType } from '../../types';
import { THEMES } from '../../systems/themeEngine';
import { soundEngine } from '../../systems/soundEngine';

interface NavBarProps {
  activeRealm: ElementType;
  isSoundEnabled?: boolean;
  onToggleSound?: () => void;
}

const NAV_LINKS = [
  { label: 'Overview', href: '#hero' },
  { label: 'Work History', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'AI Chat', href: '#ai-terminal' },
  { label: 'Contact', href: '#contact' },
];

export const NavBar: React.FC<NavBarProps> = ({
  activeRealm,
  isSoundEnabled = true,
  onToggleSound,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const theme = THEMES[activeRealm] || THEMES.fire;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      const sections = ['hero', 'experience', 'projects', 'skills', 'ai-terminal', 'contact'];
      const scrollPos = window.scrollY + 140;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      aria-label="World navigation"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 transition-all duration-500"
      style={{
        background: scrolled ? theme.cardBg : 'transparent',
        borderBottom: scrolled ? `1px solid ${theme.cardBorder}` : 'none',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}
    >
      {/* Brand Sigil */}
      <a
        href="#hero"
        onClick={() => soundEngine.playClick()}
        className="flex items-center gap-2 text-xs sm:text-sm font-black tracking-[0.2em] uppercase whitespace-nowrap cursor-pointer transition-transform hover:scale-105"
        style={{
          color: theme.primaryColor,
          textShadow: `0 0 14px ${theme.glowColor}`,
        }}
      >
        <span aria-hidden="true" className="text-sm">✦</span>
        <span>Lon Shan / Wizard World</span>
      </a>

      {/* Active Realm Pill */}
      <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase tracking-wider"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderColor: `${theme.primaryColor}55`,
          color: theme.primaryColor,
          boxShadow: `0 0 16px ${theme.glowColor}`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: theme.primaryColor }}
        />
        <span>Realm: {theme.name}</span>
      </div>

      {/* Nav Links & Controls */}
      <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
        {NAV_LINKS.map((link) => {
          const isActive = activeSection === link.href.slice(1);
          return (
            <a
              key={link.href}
              href={link.href}
              onClick={() => soundEngine.playClick()}
              className="relative py-1 font-semibold uppercase tracking-wider transition-all duration-200 hover:text-white"
              style={{
                color: isActive ? theme.primaryColor : theme.subtextColor,
                textShadow: isActive ? `0 0 10px ${theme.glowColor}` : 'none',
              }}
            >
              {link.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: theme.primaryColor, boxShadow: `0 0 8px ${theme.glowColor}` }}
                />
              )}
            </a>
          );
        })}

        {/* Sound toggle button */}
        {onToggleSound && (
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="px-2 py-1 rounded-full border text-[11px] font-mono transition-all hover:scale-105 cursor-pointer ml-1"
            style={{
              borderColor: `${theme.primaryColor}40`,
              background: 'rgba(255, 255, 255, 0.05)',
              color: isSoundEnabled ? theme.primaryColor : theme.subtextColor,
            }}
            title={isSoundEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {isSoundEnabled ? '🔊 SFX' : '🔇 Muted'}
          </button>
        )}
      </div>
    </motion.nav>
  );
};

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ElementType } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { THEMES } from '../../systems/themeEngine';
import { soundEngine } from '../../systems/soundEngine';

interface HeroSectionProps {
  activeRealm: ElementType;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ activeRealm }) => {
  const theme = THEMES[activeRealm] || THEMES.fire;

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative min-h-[95vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 py-24 sm:py-32 overflow-hidden"
    >
      {/* ── Ambient World Atmosphere Glows ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="rounded-full blur-3xl transition-colors duration-1000 opacity-20"
          style={{ width: '65vw', height: '65vh', background: theme.primaryColor }}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="rounded-full blur-2xl transition-colors duration-1000 opacity-15"
          style={{ width: '40vw', height: '40vh', background: theme.accentColor }}
        />
      </div>

      {/* ── Main Hero Content ── */}
      <div
        data-perch-card="true"
        data-card-title="Sanctuary Plaza"
        className="relative z-10 flex flex-col items-center gap-5 max-w-3xl mx-auto portfolio-card"
      >
        {/* Arrival inscription */}
        <motion.p
          className="text-[11px] sm:text-xs font-bold tracking-[0.35em] sm:tracking-[0.5em] uppercase"
          style={{ color: theme.accentColor, textShadow: `0 0 16px ${theme.glowColor}` }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ✦ You Have Arrived At ✦
        </motion.p>

        {/* World Name */}
        <motion.h1
          id="hero-title"
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none text-balance"
          style={{
            color: theme.textColor,
            textShadow: `0 0 60px ${theme.glowColor}, 0 2px 0 rgba(0,0,0,0.5)`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 80 }}
        >
          Wizard World of {PERSONAL_INFO.displayName}
        </motion.h1>

        {/* Rune Divider */}
        <motion.div
          className="flex items-center gap-4 w-full max-w-sm"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          aria-hidden="true"
        >
          <div className="flex-1 h-px" style={{ background: `${theme.primaryColor}55` }} />
          <span className="text-base" style={{ color: theme.primaryColor, textShadow: `0 0 12px ${theme.glowColor}` }}>
            ✦
          </span>
          <div className="flex-1 h-px" style={{ background: `${theme.primaryColor}55` }} />
        </motion.div>

        {/* Creator Inscription */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <p
            className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase"
            style={{ color: theme.accentColor, opacity: 0.85 }}
          >
            World shaped by
          </p>
          <p
            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight"
            style={{ color: theme.textColor }}
          >
            {PERSONAL_INFO.displayName}
          </p>
          <p
            className="text-sm sm:text-base font-light tracking-wide"
            style={{ color: theme.subtextColor }}
          >
            {PERSONAL_INFO.title}
          </p>
        </motion.div>

        {/* World Lore / Intro */}
        <motion.p
          className="text-sm md:text-base max-w-xl leading-relaxed font-normal text-balance mt-2"
          style={{ color: theme.subtextColor, opacity: 0.92 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          {PERSONAL_INFO.summary}
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3.5 mt-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <a
            href="#projects"
            onClick={() => soundEngine.playClick()}
            className="px-6 py-2.5 rounded-full font-semibold text-xs tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              color: '#000',
              boxShadow: `0 0 28px ${theme.glowColor}`,
            }}
          >
            View Projects
          </a>

          <a
            href="#experience"
            onClick={() => soundEngine.playClick()}
            className="px-6 py-2.5 rounded-full font-semibold text-xs tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 border cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: `${theme.primaryColor}40`,
              color: theme.textColor,
            }}
          >
            Work History
          </a>

          <button
            onClick={() => {
              soundEngine.playSuperMove(activeRealm);
              if (typeof window !== 'undefined') {
                const globalFunc = (window as unknown as { triggerStickManSuperMove?: () => void })
                  .triggerStickManSuperMove;
                if (globalFunc) globalFunc();
              }
            }}
            className="px-5 py-2.5 rounded-full font-semibold text-xs tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 border flex items-center gap-1.5 cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: theme.subtextColor,
            }}
          >
            <span style={{ color: theme.primaryColor }}>✦</span>
            <span>Troop Leap</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

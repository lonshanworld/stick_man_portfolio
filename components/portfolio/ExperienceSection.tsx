'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ElementType } from '../../types';
import { EXPERIENCES } from '../../data/portfolioData';
import { THEMES } from '../../systems/themeEngine';
import { ArtifactCorners } from '../ui/ArtifactCorners';

interface ExperienceSectionProps {
  activeRealm: ElementType;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ activeRealm }) => {
  const theme = THEMES[activeRealm] || THEMES.fire;

  return (
    <section
      id="experience"
      className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
      aria-labelledby="experience-title"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-[11px] sm:text-xs font-bold tracking-[0.3em] sm:tracking-[0.45em] uppercase mb-3"
            style={{ color: theme.accentColor }}
          >
            ✦ Career Chronicle
          </p>
          <h2
            id="experience-title"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            style={{ color: theme.textColor, textShadow: `0 0 30px ${theme.glowColor}` }}
          >
            Work History
          </h2>
          <p
            className="text-sm font-normal tracking-wide max-w-md mx-auto mt-2"
            style={{ color: theme.subtextColor, opacity: 0.85 }}
          >
            Production engineering across real-time systems, mobile ecosystems, and full-stack architectures.
          </p>
        </motion.div>

        {/* Experience Cards */}
        <div className="space-y-6">
          {EXPERIENCES.map((exp, i) => (
            <motion.article
              key={`${exp.company}-${exp.period}`}
              data-perch-card="true"
              data-card-title={exp.company}
              className="group portfolio-card relative rounded-2xl p-6 sm:p-8 border min-w-0 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: theme.cardBg,
                borderColor: theme.cardBorder,
                boxShadow: `0 8px 32px rgba(0,0,0,0.35)`,
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {/* Rune Corners */}
              <ArtifactCorners color={theme.primaryColor} />

              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <h3
                    className="text-xl sm:text-2xl font-black min-w-0 break-words tracking-tight"
                    style={{ color: theme.textColor }}
                  >
                    {exp.role}
                  </h3>
                  <p
                    className="text-sm font-semibold mt-0.5 break-words"
                    style={{ color: theme.accentColor }}
                  >
                    {exp.company} • {exp.location}
                  </p>
                </div>
                <span
                  className="text-xs font-mono font-bold tracking-wider uppercase px-3 py-1 rounded-full border"
                  style={{
                    color: theme.primaryColor,
                    borderColor: `${theme.primaryColor}40`,
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {exp.period}
                </span>
              </div>

              <p
                className="text-sm leading-relaxed mb-4 mt-2 break-words"
                style={{ color: theme.subtextColor }}
              >
                {exp.description}
              </p>

              {/* Bullet highlights */}
              <ul className="space-y-2 mb-4">
                {exp.highlights.map((h, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2.5 text-sm break-words">
                    <span
                      className="mt-[3px] shrink-0 text-xs"
                      style={{ color: theme.primaryColor }}
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                    <span style={{ color: theme.textColor, opacity: 0.9 }}>{h}</span>
                  </li>
                ))}
              </ul>

              {/* Tech stack pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/10">
                {exp.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: theme.subtextColor,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

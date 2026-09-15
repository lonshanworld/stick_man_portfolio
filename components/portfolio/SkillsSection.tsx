'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ElementType } from '../../types';
import { THEMES } from '../../systems/themeEngine';
import { ArtifactCorners } from '../ui/ArtifactCorners';

interface SkillsSectionProps {
  activeRealm: ElementType;
}

const SKILL_CATEGORIES = [
  {
    title: 'Frontend & Creative Web',
    subtitle: 'High performance UI & WebGL',
    icon: '⚡',
    skills: [
      { name: 'React / Next.js (App Router)', level: 96 },
      { name: 'TypeScript (Strict, Generics)', level: 94 },
      { name: 'Three.js / WebGL 3D Canvas', level: 88 },
      { name: 'Tailwind CSS & Design Systems', level: 95 },
    ],
  },
  {
    title: 'Mobile Applications',
    subtitle: 'Cross-platform iOS & Android',
    icon: '📱',
    skills: [
      { name: 'Flutter & Dart (BLoC, Riverpod)', level: 95 },
      { name: 'React Native & Expo', level: 86 },
      { name: 'Offline Data Queues & Sync', level: 92 },
      { name: 'Bluetooth BLE & Hardware Drivers', level: 88 },
    ],
  },
  {
    title: 'Backend & Systems Architecture',
    subtitle: 'Low latency & microservices',
    icon: '🛡️',
    skills: [
      { name: 'Node.js & NestJS (WebSockets)', level: 92 },
      { name: 'Go (Golang / Fiber Engine)', level: 85 },
      { name: 'PostgreSQL / SQL Performance', level: 90 },
      { name: 'Redis Low-Latency Caching & PubSub', level: 88 },
    ],
  },
  {
    title: 'Cloud, DevOps & AI Tooling',
    subtitle: 'Scalable infrastructure & intelligent agents',
    icon: '☁️',
    skills: [
      { name: 'Docker & Microservice Orchestration', level: 89 },
      { name: 'AWS Cloud (EC2, S3, CloudFront)', level: 86 },
      { name: 'CI/CD Pipelines & Test Automation', level: 88 },
      { name: 'LLM Agents, Embeddings & Web Audio', level: 87 },
    ],
  },
];

export const SkillsSection: React.FC<SkillsSectionProps> = ({ activeRealm }) => {
  const theme = THEMES[activeRealm] || THEMES.fire;

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
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
            ✦ Elemental Archive
          </p>
          <h2
            id="skills-title"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            style={{ color: theme.textColor, textShadow: `0 0 30px ${theme.glowColor}` }}
          >
            Technical Masteries
          </h2>
          <p
            className="text-sm font-normal tracking-wide max-w-md mx-auto mt-2"
            style={{ color: theme.subtextColor, opacity: 0.85 }}
          >
            Specialized engineering capabilities across frontend, backend microservices, mobile, and cloud.
          </p>
        </motion.div>

        {/* Skills Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SKILL_CATEGORIES.map((cat, idx) => (
            <motion.article
              key={cat.title}
              data-perch-card="true"
              data-card-title={cat.title}
              className="relative portfolio-card rounded-2xl p-6 sm:p-7 border min-w-0 overflow-hidden backdrop-blur-xl transition-all duration-300"
              style={{
                background: theme.cardBg,
                borderColor: theme.cardBorder,
                boxShadow: `0 8px 32px rgba(0,0,0,0.35)`,
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
            >
              <ArtifactCorners color={theme.primaryColor} />

              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{cat.title}</h3>
                  <p className="text-xs" style={{ color: theme.accentColor }}>{cat.subtitle}</p>
                </div>
              </div>

              {/* Skills with Progress Bars */}
              <div className="space-y-4">
                {cat.skills.map((skill) => (
                  <div key={skill.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white/90">{skill.name}</span>
                      <span style={{ color: theme.primaryColor }}>{skill.level}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor})`,
                          boxShadow: `0 0 8px ${theme.glowColor}`,
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

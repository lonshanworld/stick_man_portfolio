'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ElementType } from '../../types';
import { PROJECTS } from '../../data/portfolioData';
import { THEMES } from '../../systems/themeEngine';
import { soundEngine } from '../../systems/soundEngine';
import { ArtifactCorners } from '../ui/ArtifactCorners';

interface ProjectsSectionProps {
  activeRealm: ElementType;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ activeRealm }) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const theme = THEMES[activeRealm] || THEMES.fire;

  const categories = ['All', 'Web', 'Mobile', 'Full-Stack', 'Creative Dev'];

  const filteredProjects = PROJECTS.filter((p) => {
    if (activeFilter === 'All') return true;
    return p.categories.includes(activeFilter);
  });

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-[11px] sm:text-xs font-bold tracking-[0.3em] sm:tracking-[0.45em] uppercase mb-3"
            style={{ color: theme.accentColor }}
          >
            ✦ Creator&apos;s Work
          </p>
          <h2
            id="projects-title"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            style={{ color: theme.textColor, textShadow: `0 0 30px ${theme.glowColor}` }}
          >
            Featured Projects
          </h2>
          <p
            className="text-sm font-normal tracking-wide max-w-md mx-auto mt-2"
            style={{ color: theme.subtextColor, opacity: 0.85 }}
          >
            A collection of real production systems built, shipped, and actively used.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map((cat) => {
              const isActive = activeFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveFilter(cat);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'shadow-lg'
                      : 'text-white/60 hover:text-white border'
                  }`}
                  style={{
                    backgroundColor: isActive ? theme.primaryColor : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isActive ? theme.primaryColor : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#000' : theme.subtextColor,
                    boxShadow: isActive ? `0 0 20px ${theme.glowColor}` : undefined,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project, i) => (
            <motion.article
              key={project.id}
              data-perch-card="true"
              data-card-title={project.title}
              className="group portfolio-card relative rounded-2xl p-6 sm:p-7 flex flex-col gap-4 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] min-w-0 border"
              style={{
                background: theme.cardBg,
                borderColor: theme.cardBorder,
                boxShadow: `0 8px 32px rgba(0,0,0,0.35)`,
              }}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{
                borderColor: theme.primaryColor,
                boxShadow: `0 0 35px ${theme.glowColor}`,
              }}
            >
              {/* Artifact Rune Corners */}
              <ArtifactCorners color={theme.primaryColor} />

              {/* Hover Radial Radiance */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${theme.primaryColor}22, transparent 65%)`,
                }}
              />

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    className="text-xl font-bold tracking-tight text-white group-hover:text-white"
                  >
                    {project.title}
                  </h3>
                  <p
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: theme.accentColor }}
                  >
                    {project.tagline}
                  </p>
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundEngine.playClick()}
                    aria-label={`View ${project.title}`}
                    className="text-xs font-mono shrink-0 mt-1 underline-offset-4 hover:underline"
                    style={{ color: theme.primaryColor }}
                  >
                    View project →
                  </a>
                )}
              </div>

              {/* Description */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: theme.subtextColor }}
              >
                {project.description}
              </p>

              {/* Highlights */}
              <div className="space-y-1.5 flex-1">
                {project.highlights.slice(0, 2).map((h, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-2 text-xs text-white/80">
                    <span style={{ color: theme.primaryColor }}>✦</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/10">
                {project.tech.slice(0, 5).map((techName) => (
                  <span
                    key={techName}
                    className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: theme.subtextColor,
                    }}
                  >
                    {techName}
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

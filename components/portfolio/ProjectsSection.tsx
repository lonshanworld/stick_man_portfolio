'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { ElementType } from '../../types';
import { PROJECTS } from '../../data/portfolioData';
import { SectionHeading } from './SectionHeading';
import { ProjectArtwork } from './ProjectArtwork';

const FILTERS = ['All', 'Web', 'Mobile', 'Full-Stack', 'Creative Dev'];

export function ProjectsSection({ activeRealm }: { activeRealm: ElementType }) {
  const [filter, setFilter] = useState('All');
  const projects = PROJECTS.filter(
    (project) => filter === 'All' || project.categories.includes(filter),
  );
  return (
    <section
      data-realm={activeRealm}
      id="projects"
      className="folio-section folio-container"
      aria-label="Projects"
    >
      <SectionHeading
        number="01"
        label="Selected work"
        title="Ideas, made real."
      >
        Production systems and playful experiments. Different problems, the same care.
      </SectionHeading>
      <div className="folio-filters" role="group" aria-label="Filter projects">
        {FILTERS.map((item) => (
          <button
            key={item}
            aria-pressed={item === filter}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
        <span aria-live="polite">{projects.length} projects</span>
      </div>
      <div className="folio-projects">
        {projects.map((project) => {
          const index = PROJECTS.indexOf(project);
          const [name, subtitle] = project.title.split(' \u2014 ');
          return (
            <article
              key={project.id}
              className={`folio-project folio-project-${index}`}
              data-perch-card="true"
              data-card-title={project.title}
            >
              <ProjectArtwork index={index} />
              <div className="folio-project-content">
                <p className="folio-project-index folio-eyebrow"><span>0{index + 1}</span> / {index === 0 ? 'Featured creation' : project.categories.join(' + ')}</p>
                <div className="folio-project-title">
                  <h3>{name}</h3>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${name}`}
                    >
                      <ArrowUpRight size={22} />
                    </a>
                  )}
                </div>
                <p className="folio-project-subtitle">
                  {subtitle || project.tagline}
                </p>
                <p className="folio-description">{project.description}</p>
                <p className="folio-tech-line">{project.tech.join(' / ')}</p>
                <details className="folio-details">
                  <summary>Project notes</summary>
                  <ul>
                    {project.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

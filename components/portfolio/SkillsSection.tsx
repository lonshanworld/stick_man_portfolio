import type { ElementType } from '../../types';
import { SKILLS } from '../../data/portfolioData';
import { SectionHeading } from './SectionHeading';
import { Braces, Smartphone, Database, Cloud, Sparkles } from 'lucide-react';

const GLYPHS = [Braces, Smartphone, Database, Cloud, Sparkles];

const CATEGORIES = [
  'Frontend',
  'Mobile',
  'Backend',
  'Cloud & DevOps',
  'AI & Tools',
];
const NOTES = [
  'Interfaces with intention.',
  'Native feel. Shared foundations.',
  'The systems behind the experience.',
  'Ship with confidence.',
  'A little beyond the expected.',
];

export function SkillsSection({ activeRealm }: { activeRealm: ElementType }) {
  return (
    <section
      data-realm={activeRealm}
      id="skills"
      className="folio-section folio-container"
      aria-label="Skills"
    >
      <SectionHeading
        number="03"
        label="Tools of the craft"
        title="Many tools. One mindset."
      >
        I choose the stack to suit the problem, then take care of the details.
      </SectionHeading>
      <div className="folio-skills">
        {CATEGORIES.map((category, index) => {
          const Glyph = GLYPHS[index];
          return (
          <article
            key={category}
            className="folio-skill-group"
            data-perch-card="true"
            data-card-title={category}
          >
            <div className="folio-skill-top"><span className="folio-eyebrow">TOOLSET / 0{index + 1}</span><Glyph size={22} strokeWidth={1.5} aria-hidden="true" /></div>
            <h3>{category}</h3>
            <p>{NOTES[index]}</p>
            <ul>
              {SKILLS.filter((skill) => skill.category === category).map(
                (skill) => (
                  <li key={skill.name}>
                    <span>{skill.name}</span>
                    <small>{skill.description}</small>
                  </li>
                ),
              )}
            </ul>
          </article>
        ); })}
      </div>
    </section>
  );
}

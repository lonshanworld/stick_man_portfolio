import type { ElementType } from '../../types';
import { EDUCATION, EXPERIENCES, LANGUAGES } from '../../data/portfolioData';
import { SectionHeading } from './SectionHeading';

export function ExperienceSection({
  activeRealm,
}: {
  activeRealm: ElementType;
}) {
  return (
    <section
      data-realm={activeRealm}
      id="experience"
      className="folio-section folio-container"
      aria-label="Experience"
    >
      <SectionHeading
        number="02"
        label="Experience"
        title="Built on real work."
      >
        From live mobile systems to enterprise platforms. A few places
        I&#8217;ve put the work in.
      </SectionHeading>
      <div className="folio-experiences">
        {EXPERIENCES.map((exp, index) => (
          <article
            className="folio-experience"
            key={exp.company}
            data-perch-card="true"
            data-card-title={exp.company}
          >
            <div className="folio-experience-date">
              <span className="folio-eyebrow">0{index + 1}</span>
              <p>{exp.period}</p>
              <span>{exp.location}</span>
            </div>
            <div>
              <h3>{exp.role}</h3>
              <p className="folio-company">{exp.company}</p>
              <p className="folio-description">{exp.description}</p>
              <details className="folio-details">
                <summary>Highlights & technologies</summary>
                <ul>
                  {exp.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <p className="folio-tech-line">{exp.techStack.join(' / ')}</p>
              </details>
            </div>
          </article>
        ))}
        {EDUCATION.map((education) => (
          <article className="folio-experience" key={education.institution}>
            <div className="folio-experience-date">
              <span className="folio-eyebrow">Education</span>
              <p>{education.period}</p>
            </div>
            <div>
              <h3>{education.degree}</h3>
              <p className="folio-company">{education.institution}</p>
            </div>
          </article>
        ))}
        <article className="folio-experience">
          <div className="folio-experience-date">
            <span className="folio-eyebrow">Languages</span>
          </div>
          <div>
            <h3>Languages</h3>
            <p className="folio-description">
              {LANGUAGES.map((language) => `${language.name}: ${language.proficiency}`).join(' / ')}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

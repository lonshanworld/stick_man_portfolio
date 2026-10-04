'use client';

import { useState } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import type { ElementType } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { ArcaneSigil } from './ArcaneSigil';

export function ContactSection({ activeRealm }: { activeRealm: ElementType }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PERSONAL_INFO.email);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };
  return (
    <section
      data-realm={activeRealm}
      id="contact"
      className="folio-contact folio-container"
      aria-labelledby="contact-title"
    >
      <div className="folio-contact-seal"><ArcaneSigil realm={activeRealm} /></div>
      <p className="folio-eyebrow">05 / Make something matter</p>
      <div className="folio-contact-heading">
        <h2 id="contact-title">
          Your next idea.
          <br />
          <em>Our next creation.</em>
        </h2>
        <ArrowUpRight size={84} strokeWidth={1} aria-hidden="true" />
      </div>
      <div className="folio-contact-row">
        <div>
          <p>Have a project, a role, or just a good question?</p>
          <a className="folio-email" href={`mailto:${PERSONAL_INFO.email}`}>
            {PERSONAL_INFO.email}
          </a>
          <button
            className="folio-copy"
            onClick={copyEmail}
            aria-label="Copy email address"
          >
            {copyState === 'copied' ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <p className="folio-copy-status" role="status">
            {copyState === 'copied'
              ? 'Email copied.'
              : copyState === 'error'
                ? 'Select the email link to open your email app.'
                : ''}
          </p>
        </div>
        <div className="folio-socials">
          <a
            href={PERSONAL_INFO.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <ArrowUpRight size={16} />
          </a>
          <a
            href={PERSONAL_INFO.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <footer className="folio-footer">
        <a href="#hero">
          Lon Shan <span>&copy; {new Date().getFullYear()}</span>
        </a>
        <span>Creative by instinct. Steady by design.</span>
        <a href="#hero">Back to top &uarr;</a>
      </footer>
    </section>
  );
}

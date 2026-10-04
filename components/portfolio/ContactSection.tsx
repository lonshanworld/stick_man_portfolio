'use client';

import { useState } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import type { ElementType } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { ArcaneSigil } from './ArcaneSigil';

export function ContactSection({ activeRealm }: { activeRealm: ElementType }) {
  const [copyState, setCopyState] = useState<{
    field: 'email' | 'phone';
    status: 'copied' | 'error';
  } | null>(null);
  const copyContact = async (field: 'email' | 'phone', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState({ field, status: 'copied' });
    } catch {
      setCopyState({ field, status: 'error' });
    }
  };
  const phoneHref = PERSONAL_INFO.phone
    .replace(/[^\d+]/g, '')
    .replace(/^\+660/, '+66');
  const locationHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PERSONAL_INFO.location)}`;

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
        <div className="folio-contact-main">
          <p>Have a project, a role, or just a good question?</p>
          <div className="folio-contact-list">
            <div className="folio-contact-item">
              <span className="folio-contact-label">Email</span>
              <a
                className="folio-contact-link folio-email"
                href={`mailto:${PERSONAL_INFO.email}`}
              >
                {PERSONAL_INFO.email}
              </a>
              <button
                type="button"
                className="folio-copy"
                onClick={() => copyContact('email', PERSONAL_INFO.email)}
                aria-label="Copy email address"
                title="Copy email address"
              >
                {copyState?.field === 'email' && copyState.status === 'copied'
                  ? <Check size={16} />
                  : <Copy size={16} />}
              </button>
            </div>
            <div className="folio-contact-item">
              <span className="folio-contact-label">Phone</span>
              <a className="folio-contact-link" href={`tel:${phoneHref}`}>
                {PERSONAL_INFO.phone}
              </a>
              <button
                type="button"
                className="folio-copy"
                onClick={() => copyContact('phone', PERSONAL_INFO.phone)}
                aria-label="Copy phone number"
                title="Copy phone number"
              >
                {copyState?.field === 'phone' && copyState.status === 'copied'
                  ? <Check size={16} />
                  : <Copy size={16} />}
              </button>
            </div>
            <div className="folio-contact-item">
              <span className="folio-contact-label">Website</span>
              <a
                className="folio-contact-link"
                href={PERSONAL_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {PERSONAL_INFO.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
            <div className="folio-contact-item">
              <span className="folio-contact-label">Location</span>
              <a
                className="folio-contact-link"
                href={locationHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {PERSONAL_INFO.location}
              </a>
            </div>
          </div>
          <p className="folio-copy-status" role="status" aria-live="polite">
            {copyState?.status === 'copied'
              ? `${copyState.field === 'email' ? 'Email address' : 'Phone number'} copied.`
              : copyState?.status === 'error'
                ? `Could not copy ${copyState.field === 'email' ? 'email address' : 'phone number'}.`
                : ''}
          </p>
        </div>
        <div className="folio-socials">
          <a
            href={PERSONAL_INFO.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit GitHub profile"
          >
            GitHub · {PERSONAL_INFO.github.replace(/^https?:\/\//, '')}{' '}
            <ArrowUpRight size={16} />
          </a>
          <a
            href={PERSONAL_INFO.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit LinkedIn profile"
          >
            LinkedIn · {PERSONAL_INFO.linkedin.replace(/^https?:\/\//, '')}{' '}
            <ArrowUpRight size={16} />
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

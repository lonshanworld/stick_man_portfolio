'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import type { ElementType } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { ArcaneSigil } from './ArcaneSigil';
import { ElementLogo } from './ElementLogo';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';

export function HeroSection({ activeRealm, onSelectRealm }: { activeRealm: ElementType; onSelectRealm: (realm: ElementType) => void }) {
  const [casts, setCasts] = useState(0);
  const element = STICK_MAN_ARCHETYPES[activeRealm];
  return (
    <section data-realm={activeRealm} id="hero" className="folio-hero folio-container" aria-labelledby="hero-title">
      <div className="folio-hero-top">
        <p className="folio-eyebrow">Independent mind. Thoughtful engineering.</p>
        <span className="folio-location">Bangkok, Thailand <span> / </span> Open to the world</span>
      </div>
      <div className="folio-masthead">
        <h1 id="hero-title" tabIndex={-1}>{PERSONAL_INFO.displayName}<span aria-hidden="true"><ElementLogo realm={activeRealm} /></span></h1>
        <p className="folio-masthead-note">Software engineer<br />Creative developer<br /><span>Personal portfolio / 01</span></p>
      </div>
      <div className="folio-hero-grid">
        <div className="folio-hero-copy">
          <p className="folio-hero-kicker"><span>01 / THE WAY I BUILD</span><span aria-hidden="true">↳</span></p>
          <h2 className="folio-hero-statement">Creative by instinct.<br /><em>Steady by design.</em></h2>
          <p className="folio-hero-description">I’m Lon Shan. I build web, mobile, and the systems behind them. I like giving ambitious ideas a solid foundation — and leaving a little room for the unexpected.</p>
          <div className="folio-hero-links">
            <a className="folio-button" href="#projects">Explore the work <ArrowDown size={16} /></a>
            <a className="folio-text-link" href="#contact">Start a conversation <ArrowUpRight size={16} /></a>
          </div>
          <div className="folio-hero-expertise" aria-label="Engineering focus">
            <span>Web & systems</span><span>Mobile</span><span>Creative code</span>
          </div>
        </div>
        <div className="folio-conjuring" data-perch-card="true" data-card-title="The elemental observatory">
          <div className="folio-conjuring-meta"><span><i /> THE ELEMENTAL STUDY</span><span>FIG. 001</span></div>
          <div className="folio-portal">
            <div className="folio-portal-halo" />
            <ArcaneSigil key={activeRealm} realm={activeRealm} />
            {casts > 0 && <div key={casts} className="folio-cast-wave" />}
            <button className="folio-cast-button" aria-label={`Conjure ${element.name.toLowerCase()} magic`} onClick={() => { onSelectRealm(element.id); setCasts(count => count + 1); }}><span>Conjure</span></button>
            <span className="folio-portal-coordinate top">N / 13.7563</span>
            <span className="folio-portal-coordinate bottom">E / 100.5018</span>
          </div>
          <div className="folio-conjuring-caption" aria-live="polite"><div><span>{element.name}</span><p>{element.title}</p></div><p>Click a companion.<br />See the world change.</p></div>
        </div>
      </div>
      <div className="folio-hero-bottom">
        <p><ElementLogo realm={activeRealm} className="folio-star" size={20} /> A solid foundation. An untamed imagination.</p>
        <p className="folio-world-note">The little inhabitants? They’re part of the personality.</p>
        <a href="#projects" className="folio-scroll-link" aria-label="Scroll to projects"><ArrowDown size={18} /></a>
      </div>
    </section>
  );
}

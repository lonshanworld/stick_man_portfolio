'use client';

import { useEffect, useState } from 'react';
import { Menu, X, Volume2, VolumeX, ArrowUpRight, Sun, Moon } from 'lucide-react';
import type { ThemeMode } from '../../systems/themeEngine';
import type { ElementType } from '../../types';
import { ElementLogo } from './ElementLogo';

const LINKS = [
  ['About', 'hero'],
  ['Work', 'projects'],
  ['Experience', 'experience'],
  ['Toolkit', 'skills'],
  ['Ask me', 'ai-terminal'],
  ['Contact', 'contact'],
];

export function NavBar({
  activeRealm,
  isSoundEnabled = true,
  onToggleSound,
  themeMode,
  onToggleTheme,
}: {
  activeRealm: ElementType;
  isSoundEnabled?: boolean;
  onToggleSound?: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('hero');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-15% 0px -65% 0px' },
    );
    LINKS.forEach(([, id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return (
    <>
      <a className="folio-skip" href="#hero-title">
        Skip to content
      </a>
      <nav className="folio-nav" aria-label="Main navigation">
        <a className="folio-brand" href="#hero" onClick={() => setOpen(false)}>
          <span className="folio-brand-mark" aria-hidden="true">
            LS<span><ElementLogo realm={activeRealm} /></span>
          </span>
          <span>
            Lon Shan
            <span className="folio-brand-caption">
              Creative mind. Steady hands.
            </span>
          </span>
        </a>
        <div className="folio-nav-actions">
          <button
            type="button"
            className="folio-icon-button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}
            aria-pressed={themeMode === 'light'}
          >
            {themeMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {onToggleSound && (
            <button
              className="folio-icon-button"
              onClick={onToggleSound}
              aria-label={isSoundEnabled ? 'Mute audio' : 'Unmute audio'}
              aria-pressed={isSoundEnabled}
            >
              {isSoundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
          )}
          <a href="#contact" className="folio-nav-contact">
            Let&#8217;s talk <ArrowUpRight size={15} />
          </a>
          <button
            className="folio-menu-toggle folio-icon-button"
            aria-expanded={open}
            aria-controls="portfolio-navigation"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <div
          id="portfolio-navigation"
          className={`folio-nav-links ${open ? 'is-open' : ''}`}
        >
          {LINKS.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? 'location' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Swords, X, Zap } from 'lucide-react';
import type { StickManEntity } from '../../systems/stickManPopulation';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { ELEMENTAL_SPELLS } from '../../data/elementalSpells';

interface FightConfirmationModalProps {
  first: StickManEntity;
  second: StickManEntity;
  onStart: (playerId: string) => void;
  onCancel: () => void;
}

export function FightConfirmationModal({ first, second, onStart, onCancel }: FightConfirmationModalProps) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    panel?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (!focusable.length) return;
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const fighters = [first, second];
  const selected = fighters.find(fighter => fighter.id === playerId);

  return (
    <div className="fight-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div
        ref={panelRef}
        className="fight-confirmation-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fight-confirmation-title"
        tabIndex={-1}
      >
        <button className="fight-modal-close" onClick={onCancel} aria-label="Cancel fight">
          <X size={19} />
        </button>
        <div className="fight-kicker"><Swords size={14} /> Incoming challenge</div>
        <h2 id="fight-confirmation-title">{first.name} <span>VS</span> {second.name}</h2>
        <p className="fight-modal-copy">Choose your fighter. The other warrior will be controlled by the arena AI.</p>

        <div className="fight-picker" role="radiogroup" aria-label="Choose your fighter">
          {fighters.map((fighter, index) => {
            const def = STICK_MAN_ARCHETYPES[fighter.element];
            const spells = ELEMENTAL_SPELLS[fighter.element];
            const isSelected = playerId === fighter.id;
            return (
              <button
                key={fighter.id}
                className={`fight-picker-card${isSelected ? ' is-selected' : ''}`}
                style={{ '--fighter-color': def.primaryColor } as React.CSSProperties}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setPlayerId(fighter.id)}
              >
                <span className="fight-card-side">Fighter {index + 1}</span>
                <span className="fight-card-symbol">{def.symbol}</span>
                <strong>{fighter.name}</strong>
                <span className="fight-card-title">{fighter.title}</span>
                <span className="fight-card-stats">
                  <span>SPD {def.stats.speed}</span><span>POW {def.stats.power}</span>
                  <span>AGI {def.stats.agility}</span><span>MAG {def.stats.elementalMastery}</span>
                </span>
                <span className="fight-card-spells">
                  {spells.map(spell => <span key={spell.id}><Zap size={10} /> {spell.name}</span>)}
                </span>
                <span className="fight-play-label">{isSelected ? `Playing as ${fighter.name}` : `Play as ${fighter.name}`}</span>
              </button>
            );
          })}
        </div>

        <div className="fight-modal-actions">
          <button className="fight-secondary-button" onClick={onCancel}>Not now</button>
          <button
            className="fight-primary-button"
            disabled={!selected}
            onClick={() => selected && onStart(selected.id)}
          >
            <Swords size={17} /> {selected ? `Start as ${selected.name}` : 'Choose a fighter'}
          </button>
        </div>
      </div>
    </div>
  );
}

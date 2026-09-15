'use client';

import React from 'react';
import type { ElementalSpell } from '../../data/elementalSpells';
import type { FightInput, FighterState } from '../../systems/fight/types';

interface FightControlsProps {
  fighter: FighterState;
  spells: ElementalSpell[];
  onMove: (move: -1 | 0 | 1) => void;
  onAction: (action: Pick<FightInput, 'jump' | 'punch' | 'kick' | 'spell'>) => void;
}

export function FightControls({ fighter, spells, onMove, onAction }: FightControlsProps) {
  const stopMove = (direction: -1 | 1) => onMove(fighter.facing === direction ? 0 : 0);
  return (
    <div className="fight-touch-controls" aria-label="Fight controls">
      <div className="fight-movement-controls">
        <button aria-label="Move left" onPointerDown={() => onMove(-1)} onPointerUp={() => stopMove(-1)} onPointerCancel={() => onMove(0)}>◀</button>
        <button
          aria-label={fighter.element === 'wind' ? 'Jump; double tap to fly' : 'Jump; double tap for double jump'}
          title={fighter.element === 'wind' ? 'Double tap: Wind Flight' : 'Double tap: double jump'}
          onPointerDown={() => onAction({ jump: true, punch: false, kick: false, spell: null })}
        >{fighter.element === 'wind' ? '↑ FLY' : '↑↑'}</button>
        <button aria-label="Move right" onPointerDown={() => onMove(1)} onPointerUp={() => stopMove(1)} onPointerCancel={() => onMove(0)}>▶</button>
      </div>
      <div className="fight-attack-controls">
        <button aria-label="Punch" onPointerDown={() => onAction({ jump: false, punch: true, kick: false, spell: null })}>PUNCH</button>
        <button aria-label="Kick" onPointerDown={() => onAction({ jump: false, punch: false, kick: true, spell: null })}>KICK</button>
        <div className="fight-mobile-spells">
          {spells.slice(0, 3).map((spell, index) => (
            <button
              key={spell.id}
              aria-label={`Cast ${spell.name}`}
              disabled={fighter.cooldowns[index] > 0}
              onPointerDown={() => onAction({ jump: false, punch: false, kick: false, spell: index as 0 | 1 | 2 })}
            >
              {spell.icon}<small>{index + 1}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

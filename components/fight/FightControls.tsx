'use client';

import React from 'react';
import type { ElementalSpell } from '../../data/elementalSpells';
import type { FightInput, FighterState } from '../../systems/fight/types';
import { SpellIcon } from '../ui/SpellIcon';
import { FIGHT_RULES } from '../../systems/fight/combatEngine';

interface FightControlsProps {
  fighter: FighterState;
  spells: ElementalSpell[];
  onMove: (move: -1 | 0 | 1) => void;
  onAction: (action: Pick<FightInput, 'jump' | 'punch' | 'kick' | 'spell'>) => void;
  disabled?: boolean;
}

export function FightControls({ fighter, spells, onMove, onAction, disabled = false }: FightControlsProps) {
  const actionLocked = disabled || fighter.stasisTime > 0 || fighter.freezeTime > 0
    || fighter.hitStun > 0 || fighter.action.startsWith('spell') || fighter.action === 'punch' || fighter.action === 'kick';
  const movementLocked = actionLocked || fighter.rootTime > 0;
  const spellLocked = actionLocked || fighter.silenceTime > 0;
  return (
    <div className="fight-touch-controls" aria-label="Fight controls">
      <div className="fight-movement-controls">
        <button disabled={movementLocked} aria-label="Move left" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); onMove(-1); }} onPointerUp={() => onMove(0)} onPointerCancel={() => onMove(0)} onLostPointerCapture={() => onMove(0)}>◀</button>
        <button
          aria-label={fighter.element === 'wind' ? 'Jump; double tap to fly' : 'Jump; double tap for double jump'}
          disabled={movementLocked || fighter.jumpsUsed >= 2}
          title={fighter.element === 'wind' ? 'Double tap: Wind Flight' : 'Double tap: double jump'}
          onPointerDown={() => onAction({ jump: true, punch: false, kick: false, spell: null })}
        >{fighter.element === 'wind' ? '↑ FLY' : '↑↑'}</button>
        <button disabled={movementLocked} aria-label="Move right" onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); onMove(1); }} onPointerUp={() => onMove(0)} onPointerCancel={() => onMove(0)} onLostPointerCapture={() => onMove(0)}>▶</button>
      </div>
      <div className="fight-attack-controls">
        <button disabled={actionLocked} aria-label="Punch" onPointerDown={() => onAction({ jump: false, punch: true, kick: false, spell: null })}>PUNCH</button>
        <button disabled={actionLocked || fighter.rootTime > 0} aria-label="Kick" onPointerDown={() => onAction({ jump: false, punch: false, kick: true, spell: null })}>KICK</button>
        <div className="fight-mobile-spells">
          {spells.slice(0, 3).map((spell, index) => (
            <button
              key={spell.id}
              aria-label={`Cast ${spell.name}`}
              data-cooldown={fighter.cooldowns[index].toFixed(2)}
              disabled={spellLocked || fighter.cooldowns[index] > 0 || fighter.energy < FIGHT_RULES.spellCosts[index]}
              title={`${spell.name}: ${spell.castType} · ${FIGHT_RULES.spellCosts[index]} energy${fighter.silenceTime > 0 ? ' · Silenced' : ''}`}
              style={{ '--spell-color': spell.primaryColor, '--spell-accent': spell.secondaryColor } as React.CSSProperties}
              onPointerDown={() => onAction({ jump: false, punch: false, kick: false, spell: index as 0 | 1 | 2 })}
            >
              <SpellIcon spell={spell} /><small>{index + 1}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

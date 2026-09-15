'use client';

import React from 'react';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { FIGHT_RULES } from '../../systems/fight/combatEngine';
import type { FighterState, FightSnapshot } from '../../systems/fight/types';

function FighterMeters({ fighter, align }: { fighter: FighterState; align: 'left' | 'right' }) {
  const def = STICK_MAN_ARCHETYPES[fighter.element];
  return (
    <div className={`fight-fighter-meters ${align}`}>
      <div className="fight-name-line">
        <span>{def.symbol}</span><strong>{fighter.name}</strong><small>{align === 'left' ? 'YOU' : 'AI'}</small>
      </div>
      <div className="fight-health-track" aria-label={`${fighter.name} health ${Math.ceil(fighter.health)}`}>
        <span style={{ width: `${fighter.health}%`, background: `linear-gradient(90deg, ${def.primaryColor}, ${def.secondaryColor})` }} />
      </div>
      <div className="fight-energy-track" aria-label={`${fighter.name} energy ${Math.floor(fighter.energy)}`}>
        <span style={{ width: `${fighter.energy}%` }} />
      </div>
      <div className="fight-spell-cooldowns">
        {fighter.spells.slice(0, 3).map((spell, index) => {
          const remaining = fighter.cooldowns[index];
          const fraction = Math.min(1, remaining / FIGHT_RULES.spellCooldowns[index]);
          return (
            <span key={spell.id} title={spell.name} className={remaining > 0 ? 'is-cooling' : ''}>
              {spell.icon}<i style={{ transform: `scaleY(${fraction})` }} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function FightHUD({ snapshot }: { snapshot: FightSnapshot }) {
  const seconds = Math.max(0, Math.ceil(snapshot.timeLeft));
  return (
    <div className="fight-hud">
      <FighterMeters fighter={snapshot.player} align="left" />
      <div className={`fight-timer${seconds <= 10 ? ' is-urgent' : ''}`} aria-label={`${seconds} seconds remaining`}>
        <small>ROUND 1</small><strong>{seconds}</strong>
      </div>
      <FighterMeters fighter={snapshot.opponent} align="right" />
    </div>
  );
}

'use client';

import React from 'react';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { FIGHT_RULES } from '../../systems/fight/combatEngine';
import type { FighterState, FightSnapshot } from '../../systems/fight/types';
import { ElementSigil, SpellIcon } from '../ui/SpellIcon';

function FighterMeters({ fighter, align }: { fighter: FighterState; align: 'left' | 'right' }) {
  const def = STICK_MAN_ARCHETYPES[fighter.element];
  return (
    <div className={`fight-fighter-meters ${align}`}>
      <div className="fight-name-line">
        <span style={{ color: def.primaryColor }}><ElementSigil element={fighter.element} size={22} /></span><strong>{fighter.name}</strong><small>{align === 'left' ? 'YOU' : 'AI'}</small>
      </div>
      <div className="fight-health-track" aria-label={`${fighter.name} health ${Math.ceil(fighter.health)}`}>
        <span style={{ width: `${fighter.health}%`, background: `linear-gradient(90deg, ${def.primaryColor}, ${def.secondaryColor})` }} />
      </div>
      <div className="fight-energy-track" aria-label={`${fighter.name} energy ${Math.floor(fighter.energy)}`}>
        <span style={{ width: `${fighter.energy}%` }} />
      </div>
      {fighter.shieldTime > 0 && (
        <div className="fight-shield-status" role="status" aria-label={`${fighter.name} shield ${Math.ceil(fighter.shieldHealth)} remaining`}>
          <strong>SHIELD {Math.ceil(fighter.shieldHealth)}</strong> · {fighter.shieldTime.toFixed(1)}s
          <span className="fight-shield-track"><i style={{ width: `${fighter.shieldHealth / fighter.shieldMaxHealth * 100}%` }} /></span>
        </div>
      )}
      <div className="fight-condition-status" aria-live="polite">
        {fighter.hitStun > .8 && <span>STUNNED {fighter.hitStun.toFixed(1)}s</span>}
        {fighter.freezeTime > 0 && <span>FROZEN {fighter.freezeTime.toFixed(1)}s</span>}
        {fighter.stasisTime > 0 && <span>TIME STOP {fighter.stasisTime.toFixed(1)}s</span>}
        {fighter.silenceTime > 0 && <span>SILENCED {fighter.silenceTime.toFixed(1)}s</span>}
        {fighter.rootTime > 0 && <span>ROOTED {fighter.rootTime.toFixed(1)}s</span>}
        {fighter.slowTime > 0 && <span>SLOWED {fighter.slowTime.toFixed(1)}s</span>}
      </div>
      {fighter.archangelTime > 0 && (
        <div className="fight-archangel-status" role="status" aria-label={`Archangel Michael ${fighter.archangelTime.toFixed(1)} seconds remaining`}>
          <strong>ARCHANGEL MICHAEL</strong> {fighter.archangelTime.toFixed(1)}s | 2x melee | 50% damage taken
        </div>
      )}
      {fighter.demonTime > 0 && (
        <div className="fight-demon-status" role="status" aria-label={`Fallen Lucifer ${fighter.demonTime.toFixed(1)} seconds remaining`}>
          <strong>FALLEN LUCIFER</strong> {fighter.demonTime.toFixed(1)}s | 2x melee | 50% damage taken | 2 HP/s poison
        </div>
      )}
      <div className="fight-spell-cooldowns">
        {fighter.spells.slice(0, 3).map((spell, index) => {
          const remaining = fighter.cooldowns[index];
          const fraction = Math.min(1, remaining / FIGHT_RULES.spellCooldowns[index]);
          return (
            <span key={spell.id} title={spell.name} className={remaining > 0 ? 'is-cooling' : ''}
              style={{ '--spell-color': spell.primaryColor, '--spell-accent': spell.secondaryColor } as React.CSSProperties}>
              <SpellIcon spell={spell} size={20} /><i style={{ transform: `scaleY(${fraction})` }} />
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

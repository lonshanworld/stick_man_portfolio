import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';
import { CombatEngine } from '../systems/fight/combatEngine';
import { EMPTY_FIGHT_INPUT } from '../systems/fight/types';
import { getCombatSpellHitRadius, getCombatSpellPresentation, isCombatSupportSpell } from '../systems/fight/spellPresentation';
import { SpellEffectSystem } from '../systems/spellEffectSystem';
import { isUltimateSpell } from '../systems/spellPresentation';

for (const spells of Object.values(ELEMENTAL_SPELLS)) {
  for (const [index, spell] of spells.entries()) {
    if (isCombatSupportSpell(spell)) continue;
    test(`${spell.name} damages on contact with its actual arena meshes`, () => {
      const config = (element: typeof spell.element, id: string) => ({
        id, element, name: id, spells: ELEMENTAL_SPELLS[element], stats: STICK_MAN_ARCHETYPES[element].stats,
      });
      const engine = new CombatEngine(config(spell.element, 'caster'), config('fire', 'target'));
      const idle = { ...EMPTY_FIGHT_INPUT };
      for (let i = 0; i < 168; i++) engine.step(1 / 60, idle, idle);
      for (let i = 0; i < 48; i++) engine.step(1 / 60, { ...idle, move: 1 }, { ...idle, move: -1 });
      engine.step(1 / 60, { ...idle, spell: index as 0 | 1 | 2 }, idle);
      const cast = engine.drainEvents().find(event => event.type === 'cast');
      if (!cast || cast.type !== 'cast') throw new Error('Expected cast');
      const scene = new THREE.Scene();
      const effects = new SpellEffectSystem(scene);
      const unit = 92;
      const presentation = getCombatSpellPresentation(spell, cast.originX * unit, cast.targetX * unit);
      const multiplier = spell.id === 'fire-dragon-meteor' ? 1.2 : isUltimateSpell(spell.id) ? 1.08 : 1;
      const scale = 1.45 * 1.25 * multiplier * presentation.scale;
      const handle = effects.castSpell(spell,
        (presentation.anchor === 'target' ? cast.targetX : cast.originX) * unit, 0,
        Math.PI / 2, 1,
        spell.element === 'robot' ? presentation.travelPixels : presentation.travelPixels / scale,
        presentation.scale, true, spell.target === 'area' ? getCombatSpellHitRadius(spell) * unit : 0)!;
      try {
        for (let time = 0; time < spell.duration; time += 1 / 60) {
          effects.update(1 / 60);
          engine.setSpellHitAreas(cast.castId, handle.getHitAreas().map(area => ({
            minX: area.minX / unit, maxX: area.maxX / unit, minY: area.minY / unit, maxY: area.maxY / unit,
          })));
          engine.step(1 / 60, idle, idle);
        }
        expect(engine.snapshot().opponent.health).toBeLessThan(100);
        expect(engine.drainEvents().filter(event => event.type === 'hit')).toHaveLength(1);
      } finally { effects.dispose(); }
    });
  }
}

test('Robot target brackets cannot damage before its beam becomes visible', () => {
  const effects = new SpellEffectSystem(new THREE.Scene());
  const spell = ELEMENTAL_SPELLS.robot[0];
  const handle = effects.castSpell(spell, 0, 0, Math.PI / 2, 1, 400, 1, true)!;
  effects.update(spell.duration * .15);
  expect(handle.getHitAreas()).toEqual([]);
  effects.update(spell.duration * .3);
  expect(handle.getHitAreas().some(area => area.maxX > 350)).toBe(true);
  effects.dispose();
});

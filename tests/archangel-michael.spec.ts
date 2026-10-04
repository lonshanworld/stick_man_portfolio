import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';
import { CombatEngine } from '../systems/fight/combatEngine';
import { EMPTY_FIGHT_INPUT, type FighterConfig, type FightInput } from '../systems/fight/types';
import { createStickMan3DCharacter } from '../systems/stickManModelFactory';
import { updateArchangelMichael } from '../systems/archangelMichael';
import { SpellActionSystem } from '../systems/spellActionSystem';
import type { StickManEntity } from '../systems/stickManPopulation';
import type { ElementType } from '../types';

const config = (element: ElementType): FighterConfig => ({ id: element, element,
  name: STICK_MAN_ARCHETYPES[element].name, spells: ELEMENTAL_SPELLS[element], stats: STICK_MAN_ARCHETYPES[element].stats });
const idle = () => ({ ...EMPTY_FIGHT_INPUT });
function advance(engine: CombatEngine, seconds: number, player = idle(), opponent = idle()) {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) engine.step(1 / 60, player, opponent);
}
function ready() {
  const engine = new CombatEngine(config('light'), config('fire'));
  advance(engine, 2.8);
  advance(engine, .86, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  engine.drainEvents(); return engine;
}
function transform(engine: CombatEngine) {
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle()); advance(engine, 1.8); engine.drainEvents();
}
function attackDamage(engine: CombatEngine, input: Partial<FightInput>, incoming = false) {
  engine.step(1 / 60, incoming ? idle() : { ...idle(), ...input }, incoming ? { ...idle(), ...input } : idle());
  advance(engine, 1.8);
  const hits = engine.drainEvents().filter(event => event.type === 'hit');
  expect(hits).toHaveLength(1);
  return hits[0].type === 'hit' ? hits[0].damage : 0;
}

test('Michael doubles punches and kicks, without doubling spell damage', () => {
  for (const input of [{ punch: true }, { kick: true }, { spell: 1 as const }]) {
    const ordinary = ready(), michael = ready(); transform(michael);
    const normal = attackDamage(ordinary, input), empowered = attackDamage(michael, input);
    expect(empowered).toBe(normal * ('spell' in input ? 1 : 2));
  }
});

test('Michael halves all incoming physical and spell damage, including odd damage amounts', () => {
  for (const input of [{ punch: true }, { kick: true }, { spell: 0 as const }, { spell: 1 as const }, { spell: 2 as const }]) {
    const ordinary = ready(), michael = ready(); transform(michael);
    expect(attackDamage(michael, input, true)).toBe(attackDamage(ordinary, input, true) / 2);
  }
});

test('transformation heals 25% once, lasts seven seconds from activation, expires, and resets', () => {
  const engine = ready(); attackDamage(engine, { spell: 2 }, true);
  const before = engine.snapshot().player.health;
  expect(before).toBeLessThan(75);
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle());
  advance(engine, .6);
  expect(engine.snapshot().player.archangelTime).toBe(0);
  expect(engine.snapshot().player.health).toBe(before);
  advance(engine, 1 / 60);
  expect(engine.snapshot().player.archangelTime).toBe(0);
  advance(engine, 1 / 60);
  expect(engine.snapshot().player.archangelTime).toBe(7);
  expect(engine.snapshot().player.health).toBe(before + 25);
  expect(engine.snapshot().player.shieldTime).toBe(0);
  advance(engine, 6.98);
  expect(engine.snapshot().player.archangelTime).toBeGreaterThan(0);
  expect(engine.snapshot().player.health).toBe(before + 25);
  advance(engine, .04);
  expect(engine.snapshot().player.archangelTime).toBe(0);
  const baseline = ready();
  for (let i = 0; i < 300 && Math.abs(engine.snapshot().player.x - engine.snapshot().opponent.x) > 1; i++) {
    const snap = engine.snapshot(), toward = snap.player.x < snap.opponent.x ? 1 : -1;
    engine.step(1 / 60, { ...idle(), move: toward }, { ...idle(), move: toward === 1 ? -1 : 1 });
  }
  expect(attackDamage(engine, { kick: true })).toBe(attackDamage(baseline, { kick: true }));
  engine.reset(); expect(engine.snapshot().player.archangelTime).toBe(0);
  const fullHealth = ready(); transform(fullHealth); expect(fullHealth.snapshot().player.health).toBe(100);
});

test('the world form survives the casting effect, remains mobile, and expires after seven seconds', () => {
  const actions = new SpellActionSystem();
  const caster = { id: 'luma', docX: 50, docY: 50, targetDocX: 50, targetDocY: 50, scaleVariant: 1, headingAngle: 0 } as StickManEntity;
  actions.cast(ELEMENTAL_SPELLS.light[2], caster, [caster], 1000, 1000);
  actions.update(.7, [caster]);
  expect(actions.pose(caster.id)?.archangelTime).toBeCloseTo(6.92);
  actions.update(.8, [caster]);
  expect(actions.pose(caster.id)?.archangelTime).toBeCloseTo(6.12);
  expect(actions.pose(caster.id)?.casting).toBeFalsy();
  expect(actions.pose(caster.id)?.paused).toBe(false);
  actions.update(6.2, [caster]); expect(actions.pose(caster.id)?.archangelTime ?? 0).toBe(0);
  actions.dispose();
});

test('Michael armor and wings follow the skeleton and restore the normal form without frame allocations', () => {
  const char = createStickMan3DCharacter('luma', 'light');
  const armor = char.bodyGroup.getObjectByName('archangel-michael')!;
  const sword = char.rightArm.hand.getObjectByName('michael-sword-of-light')!;
  expect(armor.visible).toBe(false);
  const primaries: THREE.Mesh[] = [], secondaries: THREE.Mesh[] = [];
  armor.traverse(node => {
    if (node instanceof THREE.Mesh && node.name === 'michael-primary-feather') primaries.push(node);
    if (node instanceof THREE.Mesh && node.name === 'michael-secondary-feather') secondaries.push(node);
  });
  expect(primaries).toHaveLength(20); expect(secondaries).toHaveLength(30);
  char.group.updateMatrixWorld(true);
  const wingSpan = new THREE.Box3().setFromObject(armor).applyMatrix4(char.bodyGroup.matrixWorld.clone().invert());
  expect(wingSpan.max.x - wingSpan.min.x).toBeGreaterThan(2.8);
  expect(primaries.some(feather => { feather.geometry.computeBoundingBox(); return feather.geometry.boundingBox!.max.y > .65; })).toBe(true);
  const meshes: THREE.Mesh[] = []; char.group.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
  const geometry = meshes.map(node => node.geometry), materials = meshes.map(node => node.material);
  for (const time of [.1, 1, 4, 6.99]) {
    updateArchangelMichael(char, 7 - time, time);
    expect(armor.visible).toBe(true); expect(sword.visible).toBe(true);
    expect(char.headElementGroup.visible).toBe(false);
    expect(meshes.map(node => node.geometry)).toEqual(geometry);
    expect(meshes.map(node => node.material)).toEqual(materials);
    expect(meshes.every(node => Array.from(node.geometry.attributes.position?.array ?? []).every(Number.isFinite))).toBe(true);
  }
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    char.group.rotation.y = heading;
    updateArchangelMichael(char, 3, 4);
    char.group.updateMatrixWorld(true);
    const visibleSpan = new THREE.Box3().setFromObject(armor);
    expect((visibleSpan.max.x - visibleSpan.min.x) / char.scale).toBeGreaterThan(2.7);
  }
  updateArchangelMichael(char, 0, 7);
  expect(armor.visible).toBe(false); expect(sword.visible).toBe(false);
  expect(char.headElementGroup.visible).toBe(true); expect(char.bodyElementGroup.visible).toBe(true);
  new Set(geometry).forEach(item => item.dispose());
  new Set(materials.flat()).forEach(item => item.dispose());
});

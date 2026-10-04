import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';
import { CombatEngine } from '../systems/fight/combatEngine';
import { EMPTY_FIGHT_INPUT, type FighterConfig, type FightInput } from '../systems/fight/types';
import { createStickMan3DCharacter } from '../systems/stickManModelFactory';
import { updateFallenLucifer } from '../systems/fallenLucifer';
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
  const engine = new CombatEngine(config('dark'), config('fire'));
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

test('Lucifer doubles punches and kicks, without doubling spell damage', () => {
  for (const input of [{ punch: true }, { kick: true }, { spell: 1 as const }]) {
    const ordinary = ready(), lucifer = ready(); transform(lucifer);
    const normal = attackDamage(ordinary, input), empowered = attackDamage(lucifer, input);
    expect(empowered).toBe(normal * ('spell' in input ? 1 : 2));
  }
});

test('Lucifer halves all incoming physical and spell damage, including odd damage amounts', () => {
  for (const input of [{ punch: true }, { kick: true }, { spell: 0 as const }, { spell: 1 as const }, { spell: 2 as const }]) {
    const ordinary = ready(), lucifer = ready(); transform(lucifer);
    expect(attackDamage(lucifer, input, true)).toBe(attackDamage(ordinary, input, true) / 2);
  }
});

test('Lucifer lasts seven seconds without healing, grants no cloak, expires and resets', () => {
  const engine = ready(); attackDamage(engine, { spell: 2 }, true);
  const before = engine.snapshot().player.health;
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle());
  advance(engine, .6); expect(engine.snapshot().player.demonTime).toBe(0);
  advance(engine, 2 / 60);
  expect(engine.snapshot().player.demonTime).toBe(7);
  expect(engine.snapshot().player.health).toBe(before);
  expect(engine.snapshot().player.shieldTime).toBe(0);
  expect(engine.snapshot().player.invulnerable).toBe(0);
  advance(engine, 6.98); expect(engine.snapshot().player.demonTime).toBeGreaterThan(0);
  advance(engine, .04); expect(engine.snapshot().player.demonTime).toBe(0);
  engine.reset(); expect(engine.snapshot().player.demonTime).toBe(0);
  expect(engine.snapshot().player.demonPoisonClock).toBe(0);
});

test('the world form survives the casting effect, remains mobile, and expires after seven seconds', () => {
  const actions = new SpellActionSystem();
  const caster = { id: 'umbra', docX: 50, docY: 50, targetDocX: 50, targetDocY: 50, scaleVariant: 1, headingAngle: 0 } as StickManEntity;
  actions.cast(ELEMENTAL_SPELLS.dark[2], caster, [caster], 1000, 1000);
  actions.update(.7, [caster]);
  expect(actions.pose(caster.id)?.demonTime).toBeCloseTo(6.92);
  actions.update(.8, [caster]);
  expect(actions.pose(caster.id)?.demonTime).toBeCloseTo(6.12);
  expect(actions.pose(caster.id)?.casting).toBeFalsy();
  expect(actions.pose(caster.id)?.paused).toBe(false);
  actions.update(6.2, [caster]); expect(actions.pose(caster.id)?.demonTime ?? 0).toBe(0);
  actions.dispose();
});

test('Lucifer has large scalloped bat wings, horned armor, and a hand-held spear that expire together', () => {
  const char = createStickMan3DCharacter('umbra', 'dark');
  const body = char.bodyGroup.getObjectByName('fallen-lucifer')!;
  const spear = char.rightArm.hand.getObjectByName('lucifer-demon-spear')!;
  const aura = char.group.getObjectByName('lucifer-dark-poison-aura')!;
  expect(body.visible).toBe(false); expect(spear.visible).toBe(false);
  const membranes: THREE.Mesh[] = [], fingers: THREE.Mesh[] = [], meshes: THREE.Mesh[] = [];
  char.group.traverse(node => {
    if (node instanceof THREE.Mesh) {
      meshes.push(node);
      if (node.name === 'lucifer-leather-membrane') membranes.push(node);
      if (node.name === 'lucifer-wing-finger') fingers.push(node);
    }
  });
  expect(membranes).toHaveLength(2); expect(fingers).toHaveLength(8);
  const geometries = meshes.map(node => node.geometry);
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    char.group.rotation.y = heading; updateFallenLucifer(char, 4, 3, 3.6);
    char.group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(body);
    expect((bounds.max.x - bounds.min.x) / char.scale).toBeGreaterThan(2.7);
    expect(body.visible && spear.visible && aura.visible).toBe(true);
    expect(spear.parent).toBe(char.rightArm.hand);
    expect(char.headElementGroup.visible).toBe(false);
    expect(meshes.map(node => node.geometry)).toEqual(geometries);
    expect(meshes.every(node => Array.from(node.geometry.attributes.position?.array ?? []).every(Number.isFinite))).toBe(true);
  }
  updateFallenLucifer(char, 0, 7);
  expect(body.visible || spear.visible || aura.visible).toBe(false);
  expect(char.headElementGroup.visible && char.bodyElementGroup.visible).toBe(true);
  new Set(geometries).forEach(item => item.dispose());
  const materials = new Set<THREE.Material>();
  meshes.forEach(mesh => { (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(mat => materials.add(mat)); });
  materials.forEach(material => material.dispose());
});

function poisonSetup(gap: number, power = 90, timestep = 1 / 60) {
  const player = config('dark'), enemy = config('fire');
  player.stats = { ...player.stats, power, elementalMastery: power };
  const engine = new CombatEngine(player, enemy);
  // The engine has no debug setters; approach through normal movement.
  advance(engine, 2.8);
  while (Math.abs(engine.snapshot().player.x - engine.snapshot().opponent.x) > gap) {
    engine.step(timestep, { ...idle(), move: 1 }, idle());
  }
  engine.step(timestep, idle(), idle());
  advance(engine, .6); // allow movement inertia to settle
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle());
  advance(engine, 38 / 60); // activation, exactly seven seconds remain
  engine.drainEvents(); return engine;
}

test('poison deals fixed 2 HP each second across its wide radius and includes the final tick', () => {
  for (const power of [20, 99]) {
    const engine = poisonSetup(4, power);
    const before = engine.snapshot().opponent.health;
    advance(engine, .98); expect(engine.snapshot().opponent.health).toBe(before);
    advance(engine, .04); expect(engine.snapshot().opponent.health).toBe(before - 2);
    advance(engine, 5.96); expect(engine.snapshot().opponent.health).toBe(before - 12);
    advance(engine, .04); expect(engine.snapshot().opponent.health).toBe(before - 14);
    expect(engine.snapshot().player.demonTime).toBe(0);
    advance(engine, 2); expect(engine.snapshot().opponent.health).toBe(before - 14);
    const ticks = engine.drainEvents().filter(event => event.type === 'poison');
    expect(ticks).toHaveLength(7);
    expect(ticks.every(event => event.type === 'poison' && event.damage === 2)).toBe(true);
    expect(engine.snapshot().opponent.hitStun).toBe(0);
    expect(engine.snapshot().opponent.invulnerable).toBe(0);
  }
});

test('poison cannot drain an enemy outside its radius, and re-entry never releases missed ticks', () => {
  const engine = new CombatEngine(config('dark'), config('fire'));
  advance(engine, 2.8);
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle()); advance(engine, 2);
  expect(engine.snapshot().opponent.health).toBe(100);
  expect(engine.drainEvents().filter(event => event.type === 'poison')).toHaveLength(0);
  advance(engine, .8, { ...idle(), move: 1 });
  const health = engine.snapshot().opponent.health;
  advance(engine, .8);
  expect(engine.snapshot().opponent.health).toBeGreaterThanOrEqual(health - 2);
  engine.reset(); advance(engine, 3.8);
  expect(engine.snapshot().opponent.health).toBe(100);
});

test('poison timing is stable at different frame steps', () => {
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    const engine = poisonSetup(4);
    const before = engine.snapshot().opponent.health;
    for (let elapsed = 0; elapsed < 7.01; elapsed += dt) engine.step(dt, idle(), idle());
    expect(engine.snapshot().opponent.health).toBe(before - 14);
  }
});

test('physical damage and resistance return to normal when the demon timer expires', () => {
  for (const incoming of [false, true]) for (const input of [{ punch: true }, { kick: true }]) {
    const baseline = ready(), expired = ready(); transform(expired); advance(expired, 6);
    expect(expired.snapshot().player.demonTime).toBe(0); expired.drainEvents();
    expect(attackDamage(expired, input, incoming)).toBe(attackDamage(baseline, input, incoming));
  }
});

test('Michael also halves the incoming poison damage without being stunned', () => {
  const engine = new CombatEngine(config('dark'), config('light'));
  advance(engine, 2.8);
  advance(engine, .5, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  engine.step(1 / 60, { ...idle(), spell: 2 }, { ...idle(), spell: 2 });
  advance(engine, 38 / 60); engine.drainEvents();
  expect(engine.snapshot().player.demonTime).toBe(7);
  expect(engine.snapshot().opponent.archangelTime).toBe(7);
  advance(engine, 1.1);
  const ticks = engine.drainEvents().filter(event => event.type === 'poison');
  expect(ticks).toHaveLength(1);
  expect(ticks[0].type === 'poison' && ticks[0].damage).toBe(1);
  expect(engine.snapshot().opponent.health).toBe(99);
  expect(engine.snapshot().opponent.hitStun).toBe(0);
});

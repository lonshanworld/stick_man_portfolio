import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';
import { CombatEngine } from '../systems/fight/combatEngine';
import { FighterAI } from '../systems/fight/fighterAI';
import { EMPTY_FIGHT_INPUT, type FighterState } from '../systems/fight/types';
import { isCombatSupportSpell } from '../systems/fight/spellPresentation';
import { SpellEffectSystem } from '../systems/spellEffectSystem';
import type { ElementType } from '../types';

const idle = { ...EMPTY_FIGHT_INPUT };
const config = (element: ElementType, id: string) => ({ id, element, name: id,
  spells: ELEMENTAL_SPELLS[element], stats: STICK_MAN_ARCHETYPES[element].stats });
function advance(engine: CombatEngine, seconds: number, player = idle, opponent = idle) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) engine.step(1 / 60, player, opponent);
}
function setup(element: ElementType, opponent: ElementType = 'fire') {
  const engine = new CombatEngine(config(element, 'player'), config(opponent, 'opponent'));
  advance(engine, 2.8);
  // Initialize scenario positions/health. Every outcome below uses real inputs and engine steps.
  const state = engine as unknown as { player: FighterState; opponent: FighterState };
  state.player.x = -1;
  state.opponent.x = 1;
  state.player.health = 60;
  engine.drainEvents();
  return { engine, state };
}
function castUntil(engine: CombatEngine, index: number, predicate: () => boolean, opponent = false) {
  const input = { ...idle, spell: index as 0 | 1 | 2 };
  engine.step(1 / 60, opponent ? idle : input, opponent ? input : idle);
  for (let frame = 0; frame < 200 && !predicate(); frame++) engine.step(1 / 60, idle, idle);
  expect(predicate()).toBe(true);
}

test('the audit includes exactly three spells for each of fourteen elements', () => {
  expect(Object.values(ELEMENTAL_SPELLS)).toHaveLength(14);
  expect(Object.values(ELEMENTAL_SPELLS).flat()).toHaveLength(42);
  for (const spells of Object.values(ELEMENTAL_SPELLS)) expect(spells).toHaveLength(3);
});

for (const [element, spells] of Object.entries(ELEMENTAL_SPELLS)) for (const [index, spell] of spells.entries()) {
  test(`${element} ${index + 1}: ${spell.name} implements ${spell.action}`, () => {
    const { engine, state } = setup(element as ElementType);
    if (spell.action === 'rewind') {
      advance(engine, 2.1);
      const recordedX = engine.snapshot().player.x;
      advance(engine, .5, { ...idle, move: -1 });
      state.player.health = 40;
      castUntil(engine, index, () => engine.snapshot().player.health > 40);
      expect(engine.snapshot().player.x).toBeCloseTo(recordedX, 1);
      expect(engine.snapshot().player.health).toBe(60);
    } else if (spell.action === 'restore' || spell.action === 'cleanse') {
      if (spell.action === 'cleanse') {
        state.player.rootTime = 3;
        state.player.slowTime = 3;
        // A cleanse already being cast must clear a silence arriving during wind-up.
        engine.step(1 / 60, { ...idle, spell: index as 0 | 1 | 2 }, idle);
        state.player.silenceTime = 3;
        advance(engine, .8);
        expect(engine.snapshot().player.rootTime).toBe(0);
        expect(engine.snapshot().player.slowTime).toBe(0);
        expect(engine.snapshot().player.silenceTime).toBe(0);
      } else castUntil(engine, index, () => engine.snapshot().player.health > 60);
      expect(engine.snapshot().player.health).toBeGreaterThan(60);
      expect(engine.snapshot().player.health).toBeLessThanOrEqual(100);
      expect(engine.drainEvents().some(event => event.type === 'heal')).toBe(true);
    } else if (spell.action === 'shield') {
      castUntil(engine, index, () => engine.snapshot().player.shieldTime > 0);
      const protectedState = engine.snapshot().player;
      expect(protectedState.shieldTime).toBeCloseTo(spell.statusDuration!, 1);
      expect(protectedState.shieldHealth).toBeGreaterThan(0);
      state.opponent.x = state.player.x + 1;
      engine.step(1 / 60, idle, { ...idle, kick: true });
      advance(engine, .6);
      const after = engine.snapshot().player;
      expect(after.health).toBe(60);
      expect(after.hitStun).toBe(0);
      expect(after.shieldHealth).toBeLessThan(protectedState.shieldHealth);
      expect(engine.drainEvents().some(event => event.type === 'block')).toBe(true);
      advance(engine, spell.statusDuration!);
      expect(engine.snapshot().player.shieldTime).toBe(0);
      expect(engine.snapshot().player.shieldHealth).toBe(0);
    } else if (spell.action === 'teleport') {
      const start = state.player.x;
      castUntil(engine, index, () => Math.abs(engine.snapshot().player.x - start) > 1);
      expect(engine.snapshot().player.x).toBeGreaterThan(state.opponent.x);
      expect(engine.snapshot().player.invulnerable).toBeGreaterThan(0);
    } else if (spell.action === 'levitate') {
      castUntil(engine, index, () => engine.snapshot().player.flightTime > 0);
      advance(engine, .4);
      expect(engine.snapshot().player.y).toBeGreaterThan(.8);
      expect(engine.snapshot().player.flightTime).toBeGreaterThan(0);
    } else if (spell.action === 'transform') {
      castUntil(engine, index, () => engine.snapshot().player.demonTime > 0 || engine.snapshot().player.archangelTime > 0);
      const fighter = engine.snapshot().player;
      expect(spell.element === 'dark' ? fighter.demonTime : fighter.archangelTime).toBeCloseTo(7, 1);
      expect(fighter.shieldTime).toBe(0);
      expect(fighter.health).toBe(spell.element === 'light' ? 85 : 60);
      advance(engine, 7.1);
      expect(engine.snapshot().player.archangelTime + engine.snapshot().player.demonTime).toBe(0);
    } else {
      castUntil(engine, index, () => engine.snapshot().opponent.health < 100);
      const target = engine.snapshot().opponent;
      switch (spell.action) {
        case 'stun': expect(target.hitStun).toBeCloseTo(spell.statusDuration!, 1); expect(target.slowTime).toBe(0); break;
        case 'freeze': expect(target.freezeTime).toBeCloseTo(spell.statusDuration!, 1); expect(target.stasisTime).toBe(0); break;
        case 'stasis': expect(target.stasisTime).toBeCloseTo(4, 1); break;
        case 'root': expect(target.rootTime).toBeCloseTo(spell.statusDuration!, 1); break;
        case 'slow': expect(target.slowTime).toBeCloseTo(spell.statusDuration!, 1); break;
        case 'silence': expect(target.silenceTime).toBeCloseTo(spell.statusDuration!, 1); expect(target.slowTime).toBe(0); break;
        case 'push': expect(target.vx).toBeGreaterThan(3); break;
        case 'pull': {
          // The target starts in the center. Moving it off-center must create an inward force.
          state.opponent.x += .6;
          engine.step(1 / 60, idle, idle);
          expect(engine.snapshot().opponent.vx).toBeLessThan(0);
          break;
        }
      }
      expect(engine.snapshot().player.health).toBe(60);
    }
    if (isCombatSupportSpell(spell)) expect(engine.snapshot().opponent.health).toBe(spell.element === 'dark' && spell.action === 'transform' ? 86 : 100);
    expect(engine.snapshot().player.energy).toBeLessThanOrEqual(100);
    expect(engine.snapshot().player.health).toBeLessThanOrEqual(100);
  });
}

for (const [element, spells] of Object.entries(ELEMENTAL_SPELLS)) for (const [index, spell] of spells.entries()) {
  if (spell.action !== 'shield') continue;
  test(`${spell.name} blocks hostile spell damage and control, and its visual persists`, () => {
    for (const attacker of ['ice', 'trees', 'void', 'time', 'lightning'] as const) {
      const { engine, state } = setup(element as ElementType, attacker);
      castUntil(engine, index, () => engine.snapshot().player.shieldTime > 0);
      const attackIndex = attacker === 'trees' || attacker === 'void' ? 0 : 2;
      castUntil(engine, attackIndex, () => engine.snapshot().player.shieldHealth < 30 + index * 20, true);
      expect(state.player.health).toBe(60);
      expect(state.player.freezeTime + state.player.stasisTime + state.player.rootTime + state.player.silenceTime + state.player.hitStun).toBe(0);
    }
    const scene = new THREE.Scene();
    const effects = new SpellEffectSystem(scene);
    const handle = effects.castSpell(spell, 0, 0, Math.PI / 2, 1, 150, 1, true, 0, spell.statusDuration! + .62)!;
    effects.update(spell.duration + .3);
    expect(handle.isAlive()).toBe(true);
    expect(handle.getHitAreas().length).toBeGreaterThan(0);
    handle.setPosition(200, 100);
    expect(scene.children[0].position.toArray()).toEqual([200, 100, 0]);
    handle.stop();
    expect(handle.isAlive()).toBe(false);
    expect(scene.children).toHaveLength(0);
    effects.dispose();
  });
}

test('shield break absorbs its remaining capacity and only excess damage reaches health', () => {
  const normal = setup('water');
  castUntil(normal.engine, 2, () => normal.state.player.health < 60, true);
  const normalDamage = 60 - normal.state.player.health;
  const { engine, state } = setup('water');
  castUntil(engine, 1, () => state.player.shieldTime > 0);
  state.player.shieldHealth = 10;
  castUntil(engine, 2, () => state.player.health < 60, true);
  const events = engine.drainEvents();
  expect(events).toContainEqual({ type: 'block', fighterId: 'opponent', targetId: 'player', absorbed: 10, broken: true });
  expect(state.player.shieldTime).toBe(0);
  const hit = events.find(event => event.type === 'hit');
  expect(hit?.type === 'hit' && hit.damage).toBe(normalDamage - 10);
  expect(state.player.health).toBe(60 - normalDamage + 10);
});

test('silence prevents new magic while allowing movement and physical attacks, then expires', () => {
  const { engine, state } = setup('void');
  castUntil(engine, 0, () => state.opponent.silenceTime > 0);
  advance(engine, .5);
  const energy = state.opponent.energy;
  engine.step(1 / 60, idle, { ...idle, spell: 0 });
  expect(state.opponent.cooldowns[0]).toBe(0);
  expect(state.opponent.energy).toBeGreaterThanOrEqual(energy);
  const position = state.opponent.x;
  advance(engine, .1, idle, { ...idle, move: -1 });
  expect(state.opponent.x).toBeLessThan(position);
  engine.step(1 / 60, idle, { ...idle, punch: true });
  expect(state.opponent.action).toBe('punch');
  advance(engine, 2);
  engine.step(1 / 60, idle, { ...idle, spell: 0 });
  expect(state.opponent.cooldowns[0]).toBeGreaterThan(0);
});

test('freeze blocks movement, jumps, physical attacks and spells, then releases', () => {
  const { engine, state } = setup('ice');
  castUntil(engine, 2, () => state.opponent.freezeTime > 0);
  const x = state.opponent.x;
  advance(engine, 1, idle, { ...idle, move: -1, jump: true, punch: true, spell: 0 });
  expect(state.opponent.x).toBe(x);
  expect(state.opponent.y).toBe(0);
  expect(state.opponent.cooldowns[0]).toBe(0);
  advance(engine, .9, idle, { ...idle, move: -1 });
  expect(state.opponent.freezeTime).toBe(0);
  expect(state.opponent.x).toBeLessThan(x);
});

test('rematch clears protection, conditions, flight, forms, and recorded history', () => {
  const { engine, state } = setup('water');
  castUntil(engine, 1, () => state.player.shieldTime > 0);
  state.player.silenceTime = state.player.freezeTime = 2;
  engine.reset();
  const player = engine.snapshot().player;
  expect(player.shieldHealth + player.shieldTime + player.silenceTime + player.freezeTime + player.demonTime + player.archangelTime + player.flightTime).toBe(0);
  expect(player.shieldSpellId).toBeNull();
});

test('wards absorb poison ticks without health loss or hit reactions', () => {
  const { engine, state } = setup('water', 'dark');
  castUntil(engine, 1, () => state.player.shieldTime > 0);
  state.opponent.demonTime = 4;
  const capacity = state.player.shieldHealth;
  advance(engine, 3.1);
  expect(state.player.health).toBe(60);
  expect(state.player.shieldHealth).toBe(capacity - 6);
  expect(state.player.hitStun).toBe(0);
});

test('AI uses healing, every ward, escape magic, and transformations according to their purpose', () => {
  for (const spells of Object.values(ELEMENTAL_SPELLS)) {
    const healer = spells.findIndex(spell => ['restore', 'cleanse'].includes(spell.action));
    if (healer >= 0) {
      const { engine, state } = setup('fire', spells[0].element);
      state.opponent.health = 60;
      expect(new FighterAI(() => .99).update(.1, engine.snapshot()).spell).toBe(healer);
    }
    const shield = spells.findIndex(spell => spell.action === 'shield');
    if (shield >= 0) {
      const { engine, state } = setup('fire', spells[0].element);
      state.player.action = 'spell1';
      expect(new FighterAI(() => .99).update(.1, engine.snapshot()).spell).toBe(shield);
    }
    const transform = spells.findIndex(spell => spell.action === 'transform');
    if (transform >= 0) {
      const { engine } = setup('fire', spells[0].element);
      expect(new FighterAI(() => .99).update(9, engine.snapshot()).spell).toBe(transform);
    }
    const escape = spells.findIndex(spell => ['teleport', 'rewind', 'levitate'].includes(spell.action));
    if (escape >= 0) {
      const { engine, state } = setup('fire', spells[0].element);
      state.opponent.health = 40;
      state.opponent.x = 0;
      expect(new FighterAI(() => .2).update(.1, engine.snapshot()).spell).toBe(escape);
    }
  }
});

test('insufficient energy and silence never consume a cast or start a cooldown', () => {
  const { engine, state } = setup('water');
  state.player.energy = 5;
  engine.step(1 / 60, { ...idle, spell: 1 }, idle);
  expect(state.player.cooldowns[1]).toBe(0);
  expect(engine.drainEvents()).toEqual([]);
  state.player.energy = 100;
  state.player.silenceTime = 1;
  engine.step(1 / 60, { ...idle, spell: 1 }, idle);
  expect(state.player.energy).toBe(100);
  expect(state.player.cooldowns[1]).toBe(0);
  expect(engine.drainEvents()).toEqual([]);
});

test('Updraft Ride lifts its caster out of grounded melee reach', () => {
  const { engine, state } = setup('wind');
  castUntil(engine, 2, () => state.player.flightTime > 0);
  advance(engine, .4);
  state.opponent.x = state.player.x + 1;
  engine.step(1 / 60, idle, { ...idle, kick: true });
  advance(engine, .4);
  expect(state.player.health).toBe(60);
  expect(state.player.y).toBeGreaterThan(1);
});

test('follow-up melee damage cannot shorten Arc Snare stun', () => {
  const { engine, state } = setup('lightning');
  castUntil(engine, 2, () => state.opponent.hitStun > 1);
  advance(engine, 1.1);
  state.player.x = state.opponent.x - .8;
  expect(state.opponent.hitStun).toBeGreaterThan(.6);
  engine.step(1 / 60, { ...idle, punch: true }, idle);
  advance(engine, .1);
  expect(state.opponent.hitStun).toBeGreaterThan(.45);
  expect(state.opponent.health).toBeLessThan(58);
});

test('a breaking ward still blocks control and knockback from that hit', () => {
  for (const [attacker, index] of [
    ['ice', 2], ['time', 2], ['trees', 0], ['lightning', 2],
    ['void', 0], ['dark', 0], ['water', 0], ['wind', 0],
  ] as const) {
    const { engine, state } = setup('water', attacker);
    castUntil(engine, 1, () => state.player.shieldTime > 0);
    state.player.shieldHealth = 1;
    castUntil(engine, index, () => state.player.health < 60, true);
    expect(state.player.shieldTime).toBe(0);
    expect(state.player.freezeTime + state.player.stasisTime + state.player.rootTime
      + state.player.silenceTime + state.player.slowTime + state.player.hitStun).toBe(0);
    expect(state.player.vx).toBe(0);
    advance(engine, .1);
    expect(state.player.vx).toBe(0);
  }
});

test('freeze preserves separate slow, silence, root, and stun timers', () => {
  const { engine, state } = setup('ice');
  state.opponent.slowTime = state.opponent.silenceTime = state.opponent.rootTime = state.opponent.hitStun = 4;
  castUntil(engine, 2, () => state.opponent.freezeTime > 0);
  const before = engine.snapshot().opponent;
  expect(before.slowTime).toBeGreaterThan(3);
  expect(before.hitStun).toBeGreaterThan(3);
  advance(engine, .5);
  const after = engine.snapshot().opponent;
  for (const key of ['slowTime', 'silenceTime', 'rootTime', 'hitStun', 'freezeTime'] as const) {
    expect(after[key]).toBeCloseTo(before[key] - .5, 5);
  }
});

test('AI never substitutes support magic for a distant attack or accesses missing slots', () => {
  for (const element of ['healing', 'water', 'space', 'wind', 'time'] as const) {
    const { engine, state } = setup('fire', element);
    state.player.x = -3;
    state.opponent.x = 3;
    state.opponent.health = 100;
    state.opponent.spells = state.opponent.spells.filter(isCombatSupportSpell);
    const input = new FighterAI(() => .99).update(.1, engine.snapshot());
    expect(input.spell).toBeNull();
    expect(input.move).toBe(-1);
  }
});

test('AI clears movement immediately when controlled during its thinking interval', () => {
  const { engine, state } = setup('fire');
  state.player.x = -3;
  state.opponent.x = 3;
  const ai = new FighterAI(() => .2);
  expect(ai.update(.1, engine.snapshot()).move).toBe(-1);
  state.opponent.freezeTime = 1;
  expect(ai.update(.01, engine.snapshot())).toEqual(idle);
});

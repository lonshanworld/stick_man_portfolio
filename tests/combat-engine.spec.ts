import { expect, test } from '@playwright/test';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { STICK_MAN_ARCHETYPES, ALL_ELEMENTS } from '../data/stickManArchetypes';
import { CombatEngine } from '../systems/fight/combatEngine';
import { FighterAI } from '../systems/fight/fighterAI';
import { EMPTY_FIGHT_INPUT, type FighterConfig, type FightInput } from '../systems/fight/types';
import type { ElementType } from '../types';
import { resolveFightSelection } from '../systems/fight/selectionRules';
import { getCombatSpellHitRadius, getCombatSpellPresentation } from '../systems/fight/spellPresentation';

const idle = (): FightInput => ({ ...EMPTY_FIGHT_INPUT });
const config = (element: ElementType, id: string = element): FighterConfig => ({
  id,
  name: STICK_MAN_ARCHETYPES[element].name,
  element,
  spells: ELEMENTAL_SPELLS[element],
  stats: STICK_MAN_ARCHETYPES[element].stats,
});

function advance(engine: CombatEngine, seconds: number, playerInput = idle(), opponentInput = idle()) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) {
    engine.step(1 / 60, playerInput, opponentInput);
  }
}

function beginRound(engine: CombatEngine) {
  advance(engine, 2.8);
  expect(engine.snapshot().phase).toBe('fighting');
}

test('starts one 60 second round and resolves an equal-health timeout as a draw', () => {
  const engine = new CombatEngine(config('fire'), config('water'));
  expect(engine.snapshot().timeLeft).toBe(60);
  beginRound(engine);
  advance(engine, 60.1);
  expect(engine.snapshot().result).toEqual({ winnerId: null, reason: 'draw' });
});

test('a physical attack connects only once during its active window', () => {
  const engine = new CombatEngine(config('fire'), config('water'));
  beginRound(engine);
  advance(engine, 0.86, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  engine.step(1 / 60, { ...idle(), punch: true }, idle());
  advance(engine, 0.5);
  const healthAfterOnePunch = engine.snapshot().opponent.health;
  expect(healthAfterOnePunch).toBeLessThan(100);
  expect(healthAfterOnePunch).toBeGreaterThanOrEqual(97);
});

test('same-frame jump plus punch or kick produces an aerial attack', () => {
  for (const attack of ['punch', 'kick'] as const) {
    const engine = new CombatEngine(config('wind'), config('soil'));
    beginRound(engine);
    engine.step(1 / 60, { ...idle(), jump: true, [attack]: true }, idle());
    const started = engine.snapshot().player;
    expect(started.action).toBe(attack);
    expect(started.vy).toBeGreaterThan(0);
    advance(engine, 0.12);
    expect(engine.snapshot().player.y).toBeGreaterThan(0);
  }
});

test('every elemental fighter can jump twice but not a third time before landing', () => {
  for (const element of ALL_ELEMENTS) {
    const engine = new CombatEngine(config(element), config('fire', `${element}-target`));
    beginRound(engine);
    engine.step(1 / 60, { ...idle(), jump: true }, idle());
    expect(engine.snapshot().player.jumpsUsed).toBe(1);
    advance(engine, 0.08);
    engine.step(1 / 60, { ...idle(), jump: true }, idle());
    const afterSecond = engine.snapshot().player;
    expect(afterSecond.jumpsUsed).toBe(2);
    expect(afterSecond.vy).toBeGreaterThan(0);

    const velocityBeforeThird = afterSecond.vy;
    engine.step(1 / 60, { ...idle(), jump: true }, idle());
    const afterThird = engine.snapshot().player;
    expect(afterThird.jumpsUsed).toBe(2);
    expect(afterThird.vy).toBeLessThan(velocityBeforeThird);
  }
});

test('a running double jump can cross over the opponent', () => {
  const engine = new CombatEngine(config('fire'), config('soil'));
  beginRound(engine);
  advance(engine, 0.86, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  engine.step(1 / 60, { ...idle(), move: 1, jump: true }, idle());
  advance(engine, 0.12, { ...idle(), move: 1 });
  engine.step(1 / 60, { ...idle(), move: 1, jump: true }, idle());
  advance(engine, 0.48, { ...idle(), move: 1 });
  const snapshot = engine.snapshot();
  expect(snapshot.player.y).toBeGreaterThan(0.68);
  expect(snapshot.player.x).toBeGreaterThan(snapshot.opponent.x);
});

test('Wind turns its second jump into passive flight', () => {
  const engine = new CombatEngine(config('wind'), config('fire'));
  beginRound(engine);
  engine.step(1 / 60, { ...idle(), jump: true }, idle());
  advance(engine, 0.08);
  engine.step(1 / 60, { ...idle(), jump: true }, idle());
  const activated = engine.snapshot().player;
  expect(activated.action).toBe('fly');
  expect(activated.flightTime).toBeGreaterThan(2.7);

  advance(engine, 2.2, { ...idle(), move: 1 });
  const flying = engine.snapshot().player;
  expect(flying.flightTime).toBeGreaterThan(0);
  expect(flying.y).toBeGreaterThan(0.8);
  expect(flying.action).toBe('fly');
});

test('a retreating fighter turns around instead of moonwalking', () => {
  const engine = new CombatEngine(config('fire'), config('water'));
  beginRound(engine);
  engine.step(1 / 60, { ...idle(), move: -1 }, idle());
  const retreating = engine.snapshot().player;
  expect(retreating.facing).toBe(-1);
  expect(retreating.vx).toBeLessThan(0);
});

test('Portal Step relocates the fighter to its locked exit portal', () => {
  const engine = new CombatEngine(config('space'), config('water'));
  beginRound(engine);
  const startX = engine.snapshot().player.x;
  engine.step(1 / 60, { ...idle(), spell: 1 }, idle());
  const cast = engine.drainEvents().find(event => event.type === 'cast');
  expect(cast?.type).toBe('cast');
  if (!cast || cast.type !== 'cast') return;
  expect(cast.targetX).toBeGreaterThan(startX + 2);
  advance(engine, 0.5);
  expect(engine.snapshot().player.x).toBeCloseTo(cast.targetX, 1);
  expect(engine.snapshot().player.invulnerable).toBeGreaterThan(0);
});

test('combat spell presentation separates self effects, projectiles, and target zones', () => {
  const tideguard = ELEMENTAL_SPELLS.water[1];
  const fireballs = ELEMENTAL_SPELLS.fire[1];
  const thunderbolt = ELEMENTAL_SPELLS.lightning[0];
  expect(getCombatSpellPresentation(tideguard, -200, 200).anchor).toBe('caster');
  expect(getCombatSpellPresentation(fireballs, -200, 200).anchor).toBe('caster');
  expect(getCombatSpellPresentation(thunderbolt, -200, 200).anchor).toBe('target');
  expect(getCombatSpellPresentation(thunderbolt, -200, 200).scale).toBeGreaterThan(1);
  const stillSecond = ELEMENTAL_SPELLS.time[2];
  expect(getCombatSpellPresentation(stillSecond, -200, 200).anchor).toBe('target');
  expect(getCombatSpellHitRadius(stillSecond)).toBe(1.5);
});

test('AI builds toward stronger spells instead of opening with an ultimate', () => {
  const engine = new CombatEngine(config('fire'), config('fire', 'ai-fire'));
  beginRound(engine);
  const ai = new FighterAI(() => 0.9);
  const opening = ai.update(0.1, engine.snapshot());
  expect(opening.spell).toBe(0);
});

test('Still Second completely stops the enemy for four seconds', () => {
  const engine = new CombatEngine(config('time'), config('fire'));
  beginRound(engine);
  advance(engine, 0.12, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle());
  const cast = engine.drainEvents().find(event => event.type === 'cast');
  expect(cast?.type).toBe('cast');
  if (cast?.type === 'cast') expect(cast.targetX).toBeCloseTo(engine.snapshot().opponent.x, 5);
  advance(engine, 0.7);
  const frozen = engine.snapshot().opponent;
  expect(frozen.action).toBe('stasis');
  expect(frozen.stasisTime).toBeGreaterThan(3.8);
  const frozenX = frozen.x;

  advance(engine, 3.6, idle(), { ...idle(), move: -1, punch: true });
  expect(engine.snapshot().opponent.x).toBeCloseTo(frozenX, 5);
  expect(engine.snapshot().opponent.action).toBe('stasis');

  advance(engine, 0.5, idle(), { ...idle(), move: -1 });
  expect(engine.snapshot().opponent.stasisTime).toBe(0);
  expect(engine.snapshot().opponent.x).toBeLessThan(frozenX);
});

test('a fighter remains damageable without knockback while frozen by Still Second', () => {
  const engine = new CombatEngine(config('time'), config('fire'));
  beginRound(engine);
  advance(engine, 0.86, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle());
  advance(engine, 1.7);

  const frozen = engine.snapshot().opponent;
  expect(frozen.action).toBe('stasis');
  expect(frozen.stasisTime).toBeGreaterThan(2);
  const healthBeforeCombo = frozen.health;
  const frozenX = frozen.x;

  engine.step(1 / 60, { ...idle(), punch: true }, idle());
  advance(engine, 0.35);
  const afterPunch = engine.snapshot().opponent;
  expect(afterPunch.health).toBeLessThan(healthBeforeCombo);
  expect(afterPunch.action).toBe('stasis');
  expect(afterPunch.stasisTime).toBeGreaterThan(1.5);
  expect(afterPunch.x).toBeCloseTo(frozenX, 5);
});

test('spell energy and cooldown prevent an immediate repeat cast', () => {
  const engine = new CombatEngine(config('fire'), config('water'));
  beginRound(engine);
  advance(engine, 0.12, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle());
  advance(engine, 1.8);
  const first = engine.snapshot();
  expect(first.opponent.health).toBeLessThanOrEqual(63);
  expect(first.player.cooldowns[2]).toBeGreaterThan(0);
  const health = first.opponent.health;
  engine.step(1 / 60, { ...idle(), spell: 2 }, idle());
  advance(engine, 1);
  expect(engine.snapshot().opponent.health).toBe(health);
});

test('all three equipped attack spells resolve through the combat engine', () => {
  for (const spell of [0, 1, 2] as const) {
    const engine = new CombatEngine(config('fire'), config('water'));
    beginRound(engine);
    advance(engine, 0.86, { ...idle(), move: 1 }, { ...idle(), move: -1 });
    engine.step(1 / 60, { ...idle(), spell }, idle());
    advance(engine, 1.8);
    expect(engine.snapshot().opponent.health).toBeLessThan(100);
  }
});

test('repeated legal attacks produce a KO and rematch resets all state', () => {
  const engine = new CombatEngine(config('soil'), config('ice'));
  beginRound(engine);
  advance(engine, 0.86, { ...idle(), move: 1 }, { ...idle(), move: -1 });
  for (let hit = 0; hit < 35 && engine.snapshot().phase === 'fighting'; hit += 1) {
    advance(engine, 0.38, { ...idle(), move: 1 });
    engine.step(1 / 60, { ...idle(), kick: true }, idle());
    advance(engine, 0.72);
  }
  expect(engine.snapshot().result?.reason).toBe('ko');
  engine.reset();
  const reset = engine.snapshot();
  expect(reset.phase).toBe('intro');
  expect(reset.timeLeft).toBe(60);
  expect(reset.player.health).toBe(100);
  expect(reset.opponent.health).toBe(100);
});

test('all elemental archetypes can start and finish with exactly three combat spells', () => {
  for (const element of ALL_ELEMENTS) {
    const engine = new CombatEngine(config(element, `${element}-player`), config('fire', `${element}-ai`));
    expect(engine.snapshot().player.spells).toHaveLength(3);
    beginRound(engine);
    advance(engine, 60.1);
    expect(engine.snapshot().phase).toBe('finished');
  }
});

test('opponent selection accepts only a different fighter from 1 through 5 seconds', () => {
  const first = { id: 'first' };
  const second = { id: 'second' };
  const opened = resolveFightSelection(null, first, 10_000);
  expect(opened.type).toBe('start-window');
  if (opened.type !== 'start-window') return;
  expect(resolveFightSelection(opened.pending, second, 10_999).type).toBe('too-early');
  expect(resolveFightSelection(opened.pending, first, 12_000).type).toBe('same-fighter');
  expect(resolveFightSelection(opened.pending, second, 11_000).type).toBe('match');
  expect(resolveFightSelection(opened.pending, second, 15_000).type).toBe('match');
  const expired = resolveFightSelection(opened.pending, second, 15_001);
  expect(expired.type).toBe('start-window');
  if (expired.type === 'start-window') expect(expired.pending.entity.id).toBe('second');
});

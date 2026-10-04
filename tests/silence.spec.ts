import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';
import { CombatEngine } from '../systems/fight/combatEngine';
import { EMPTY_FIGHT_INPUT, type FighterConfig } from '../systems/fight/types';
import { createStickMan3DCharacter } from '../systems/stickManModelFactory';
import { updateSilenceMarker } from '../systems/silenceMarker';
import { SpellActionSystem } from '../systems/spellActionSystem';
import type { StickManEntity } from '../systems/stickManPopulation';

test('world silence and its marker outlast the visual effect and expire together', () => {
  const entity = (id: string, x: number): StickManEntity => ({
    id, element: 'void', name: id, title: '', dialogueQuote: '', specialMove: '',
    homeDistrict: 0, docX: x, docY: 50, targetDocX: x, targetDocY: 50, headingAngle: Math.PI / 2,
    walkCycle: 0, state: 'idle', speed: 60, wanderTimer: 0, personalityOffset: 0, scaleVariant: 1,
    districtName: '', waypoints: [{ x, y: 50 }], currentWaypointIdx: 0, isSpeaking: false,
  });
  const caster = entity('caster', 50), target = entity('target', 68);
  const actions = new SpellActionSystem(), spell = ELEMENTAL_SPELLS.void[0];
  const char = createStickMan3DCharacter('world-target', 'fire', 1);
  const marker = char.group.getObjectByName('all-spells-silenced-marker')!;
  actions.cast(spell, caster, [caster, target], 1000, 1000);
  actions.update(spell.duration * .25, [caster, target]);
  expect(actions.pose(target.id)?.silenceTime).toBe(7);
  actions.update(6.9, [caster, target]);
  updateSilenceMarker(char, actions.pose(target.id)?.silenceTime ?? 0, 6.9);
  expect(marker.visible).toBe(true);
  expect(actions.cast(ELEMENTAL_SPELLS.void[1], target, [caster, target], 1000, 1000)).toBe(0);
  expect(target.docX).toBe(68);
  actions.update(.11, [caster, target]);
  updateSilenceMarker(char, actions.pose(target.id)?.silenceTime ?? 0, 7.01);
  expect(marker.visible).toBe(false);
  expect(actions.isSilenced(target.id)).toBe(false);
  expect(actions.cast(ELEMENTAL_SPELLS.void[1], target, [caster, target], 1000, 1000)).toBeGreaterThan(0);
  actions.dispose();
  (marker as THREE.Sprite).material.dispose();
});

test('Null Obelisk locks every spell for seven seconds and then permits casting', () => {
  const config = (element: 'void' | 'space'): FighterConfig => ({
    id: element, element, name: element, spells: ELEMENTAL_SPELLS[element], stats: STICK_MAN_ARCHETYPES[element].stats,
  });
  const engine = new CombatEngine(config('void'), config('space'));
  const idle = { ...EMPTY_FIGHT_INPUT };
  const advance = (seconds: number) => {
    for (let t = 0; t < seconds; t += 1 / 60) engine.step(1 / 60, idle, idle);
  };
  advance(2.8);
  for (let i = 0; i < 52; i++) engine.step(1 / 60, { ...idle, move: 1 }, { ...idle, move: -1 });
  engine.step(1 / 60, { ...idle, spell: 0 }, idle);
  // Stop on the exact hit frame rather than consuming part of the silence duration.
  for (let i = 0; i < 120 && engine.snapshot().opponent.silenceTime === 0; i++) engine.step(1 / 60, idle, idle);
  expect(engine.snapshot().opponent.silenceTime).toBeCloseTo(7, 3);
  advance(1);
  for (const spell of [0, 1, 2] as const) {
    engine.step(1 / 60, idle, { ...idle, spell });
    expect(engine.snapshot().opponent.action).not.toMatch(/^spell/);
  }
  advance(5.8);
  expect(engine.snapshot().opponent.silenceTime).toBeGreaterThan(0);
  advance(.3);
  expect(engine.snapshot().opponent.silenceTime).toBe(0);
  engine.step(1 / 60, idle, { ...idle, spell: 1 });
  expect(engine.snapshot().opponent.action).toBe('spell2');
});

test('silence marker follows the head, faces the camera, and hides when silence expires', () => {
  const char = createStickMan3DCharacter('silence-target', 'fire', 1);
  const marker = char.group.getObjectByName('all-spells-silenced-marker') as THREE.Sprite;
  expect(marker).toBeInstanceOf(THREE.Sprite);
  expect(marker.visible).toBe(false);
  char.group.rotation.y = Math.PI / 2;
  char.bodyGroup.position.y += .4;
  updateSilenceMarker(char, 7, 0);
  expect(marker.visible).toBe(true);
  expect(marker.userData.label).toBe('All spells silenced');
  const head = char.group.worldToLocal(char.headMesh.getWorldPosition(new THREE.Vector3()));
  expect(marker.position.y).toBeGreaterThan(head.y + .5);
  const texture = marker.material.map!;
  updateSilenceMarker(char, .1, 6.9);
  expect(marker.visible).toBe(true);
  expect(marker.material.map).toBe(texture);
  updateSilenceMarker(char, 0, 7);
  expect(marker.visible).toBe(false);
  let disposed = false;
  texture.addEventListener('dispose', () => { disposed = true; });
  marker.material.dispose();
  expect(disposed).toBe(true);
});

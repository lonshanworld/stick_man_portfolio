import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { buildBedrockFissure, buildBoulderCatapult, buildFortressBastion } from '../systems/soilSpellBuilders';
import { soilCastPose } from '../systems/soilCastPose';
import { createMineralCrest } from '../systems/soilStone';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';
import { CombatEngine } from '../systems/fight/combatEngine';
import { EMPTY_FIGHT_INPUT } from '../systems/fight/types';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';

test('the fault displaces layered ground in sequence and settles after the thrust', () => {
  const spell = ELEMENTAL_SPELLS.soil[0], effect = buildBedrockFissure(spell, .8, 160);
  const slabs: THREE.Object3D[] = [];
  effect.root.traverse(node => { if (node.name === 'soil-fault-slab') slabs.push(node); });
  expect(slabs).toHaveLength(16);
  effect.update(0, .22, spell.duration);
  expect(slabs[0].visible).toBe(true);
  expect(slabs.at(-1)!.visible).toBe(false);
  const initial = slabs[0].position.y;
  effect.update(0, .48, spell.duration);
  expect(slabs[0].position.y).toBeGreaterThan(initial);
  const peak = slabs[0].position.y;
  effect.update(0, 1.4, spell.duration);
  expect(slabs[0].position.y).toBeLessThan(peak);
});

test('the boulder excavates, travels a gravity arc to its target, and breaks into resting rubble', () => {
  const spell = ELEMENTAL_SPELLS.soil[1], effect = buildBoulderCatapult(spell, 0, 170);
  const boulder = effect.root.getObjectByName('soil-catapult-boulder')!;
  effect.update(0, .1, spell.duration);
  expect(boulder.position.y).toBeLessThan(0);
  effect.update(0, .9, spell.duration);
  expect(boulder.position.y).toBeGreaterThan(50);
  const halfway = boulder.position.z;
  effect.update(0, 1.3, spell.duration);
  expect(boulder.position.z).toBeGreaterThan(halfway);
  expect(boulder.position.y).toBeLessThan(25);
  effect.update(0, 1.35, spell.duration);
  expect(boulder.visible).toBe(false);
  expect(effect.root.getObjectByName('soil-impact-crater')!.position.z).toBe(170);
  const rubble: THREE.Object3D[] = [];
  effect.root.traverse(node => { if (node.name === 'soil-ballistic-rubble') rubble.push(node); });
  expect(rubble).toHaveLength(24);
  effect.update(0, 2.35, spell.duration);
  expect(rubble.every(node => node.position.y === 1.1)).toBe(true);
});

test('the bastion braces solid interlocking walls with raw ore pockets, independent of frame rate', () => {
  const spell = ELEMENTAL_SPELLS.soil[2], effect = buildFortressBastion(spell);
  const walls = effect.root.children.filter(node => node.name === 'soil-bastion-wall');
  expect(walls).toHaveLength(7);
  expect(walls.every(node => node.children.length === 6)).toBe(true);
  effect.update(0, .9, spell.duration);
  expect(walls.every(node => node.position.y === 0)).toBe(true);
  const positions = walls.map(node => node.position.toArray());
  effect.update(.5, .9, spell.duration);
  expect(walls.map(node => node.position.toArray())).toEqual(positions);
  effect.update(0, 2.3, spell.duration);
  expect(walls.every(node => node.position.y < 0)).toBe(true);
});

test('all soil phases have finite geometry and fade completely without allocating per frame', () => {
  const builders = [buildBedrockFissure, buildBoulderCatapult, buildFortressBastion];
  for (const [index, spell] of ELEMENTAL_SPELLS.soil.entries()) {
    const effect = builders[index](spell, Math.PI / 2);
    const meshes: THREE.Mesh[] = [];
    effect.root.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
    const geometries = meshes.map(node => node.geometry);
    for (const progress of [0, .18, .5, .7, .9, 1]) {
      effect.update(.016, progress * spell.duration, spell.duration);
      expect(meshes.map(node => node.geometry)).toEqual(geometries);
      for (const mesh of meshes) {
        expect(mesh.position.toArray().every(Number.isFinite)).toBe(true);
        const positions = mesh.geometry.getAttribute('position');
        expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
        const material = mesh.material as THREE.ShaderMaterial | THREE.MeshBasicMaterial;
        if (progress === 1) expect(material instanceof THREE.ShaderMaterial ? material.uniforms.uOpacity.value : material.opacity).toBe(0);
      }
    }
  }
});

test('Terra has three distinct planted casting motions and a gently suspended mineral geode', () => {
  const poses = ELEMENTAL_SPELLS.soil.map(spell => soilCastPose(spell.id, .3));
  expect(new Set(poses.map(pose => JSON.stringify(pose))).size).toBe(3);
  expect(poses.every(pose => pose.bodyY <= .55 && pose.bodyY >= .4)).toBe(true);
  for (const spell of ELEMENTAL_SPELLS.soil) expect(soilCastPose(spell.id, 1).bodyY).toBe(.55);
  const crest = createMineralCrest();
  expect(crest.root.children).toHaveLength(7);
  crest.update(1);
  expect(Math.abs(crest.root.rotation.z)).toBeLessThan(.03);
  expect(Math.abs(crest.root.position.y)).toBeLessThan(.01);
});

test('Soil forms a compact physical mineral seal at its palm and releases it cleanly', () => {
  const torso = new THREE.Group(), palm = new THREE.Group();
  torso.position.y = .5; palm.position.x = .2;
  const seal = createHandMagicSeal('soil', '#B7976D', '#6C513D', torso); palm.add(seal);
  expect(seal.visible).toBe(false);
  expect(seal.children).toHaveLength(11);
  updateHandMagicSeal(seal, true, .3, 1);
  expect(seal.visible).toBe(true);
  expect(seal.position.toArray()).toEqual([0, 0, 0]);
  expect(seal.quaternion.toArray().every(Number.isFinite)).toBe(true);
  const bounds = new THREE.Box3().setFromObject(seal).getSize(new THREE.Vector3());
  expect(bounds.length()).toBeLessThan(.85);
  for (const node of seal.children) expect((node as THREE.Mesh).material).toBeInstanceOf(THREE.ShaderMaterial);
  updateHandMagicSeal(seal, false, 2, 1);
  expect(seal.visible).toBe(false);
});

test('arena boulder damage waits for the visible impact rather than hitting during excavation', () => {
  const config = (element: 'soil' | 'water') => ({ id: element, element, name: STICK_MAN_ARCHETYPES[element].name, spells: ELEMENTAL_SPELLS[element], stats: STICK_MAN_ARCHETYPES[element].stats });
  const engine = new CombatEngine(config('soil'), config('water'));
  const advance = (seconds: number, move: -1 | 0 | 1 = 0) => {
    for (let t = 0; t < seconds; t += 1 / 60) engine.step(1 / 60, { ...EMPTY_FIGHT_INPUT, move }, EMPTY_FIGHT_INPUT);
  };
  advance(3); advance(.9, 1);
  engine.step(1 / 60, { ...EMPTY_FIGHT_INPUT, spell: 1 }, EMPTY_FIGHT_INPUT);
  advance(1.25);
  expect(engine.snapshot().player.action).toBe('spell2');
  expect(engine.snapshot().opponent.health).toBe(100);
  advance(.15);
  const health = engine.snapshot().opponent.health;
  expect(health).toBeLessThan(100);
  advance(.8);
  expect(engine.snapshot().opponent.health).toBe(health);
});

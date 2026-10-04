import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { buildHyperBeam, buildOverclockGrid, buildMissileSalvo } from '../systems/robotSpellBuilders';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';
import { createStickMan3DCharacter } from '../systems/stickManModelFactory';
import { SpellEffectSystem } from '../systems/spellEffectSystem';

test('robot spells retain finite geometry at every heading and dispose after repeated casts', () => {
  const builders = [buildHyperBeam, buildOverclockGrid, buildMissileSalvo];
  for (const [i, spell] of ELEMENTAL_SPELLS.robot.entries()) for (const heading of [0, Math.PI / 2, Math.PI]) {
    const effect = builders[i](spell, heading, 147), meshes: THREE.Mesh[] = [];
    effect.root.traverse(n => { if (n instanceof THREE.Mesh) meshes.push(n); });
    const geometry = meshes.map(m => m.geometry);
    for (const p of [0, .18, .5, .7, .9, 1]) {
      effect.update(0, spell.duration * p, spell.duration);
      expect(meshes.map(m => m.geometry)).toEqual(geometry);
      for (const mesh of meshes) {
        expect([...mesh.position.toArray(), ...mesh.scale.toArray(), ...mesh.quaternion.toArray()].every(Number.isFinite)).toBe(true);
        expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
      }
    }
  }
  const scene = new THREE.Scene(), system = new SpellEffectSystem(scene);
  for (let j = 0; j < 3; j++) for (const spell of ELEMENTAL_SPELLS.robot) {
    const handle = system.castSpell(spell, 0, 0, .35, 1, 147)!;
    if (spell.id !== 'robot-overclock-grid') {
      const presentation = scene.children[0];
      const destination = presentation.getObjectByName(spell.id === 'robot-hyper-beam' ? 'robot-target-lock' : 'missile-small-explosion')!;
      expect(destination.position.z * presentation.scale.x).toBeCloseTo(147);
    }
    system.update(spell.duration + .01);
    expect(handle.isAlive()).toBe(false); expect(scene.children).toHaveLength(0);
  }
  system.dispose();
});

test('missiles face their curved trajectory and make compact explosions at the supplied destination', () => {
  const spell = ELEMENTAL_SPELLS.robot[2], effect = buildMissileSalvo(spell, Math.PI / 2, 147);
  const rockets = effect.root.children.filter(n => n.name === 'robot-guided-missile');
  const impacts = effect.root.children.filter(n => n.name === 'missile-small-explosion');
  expect(rockets).toHaveLength(8); expect(impacts).toHaveLength(8);
  for (const rocket of rockets) {
    expect((rocket.getObjectByName('missile-cylindrical-fuselage') as THREE.Mesh).geometry.type).toBe('CylinderGeometry');
    expect(rocket.children.filter(n => n.name === 'missile-tail-fin')).toHaveLength(4);
  }
  effect.update(0, spell.duration * .3, spell.duration);
  expect(rockets.some(r => r.visible && Math.abs(r.quaternion.x) > .01)).toBe(true);
  expect(impacts.every(n => !n.visible)).toBe(true);
  effect.update(0, spell.duration * .55, spell.duration);
  expect(impacts.some(n => n.visible)).toBe(true);
  for (const impact of impacts) {
    expect(impact.position.z).toBe(147);
    expect(impact.getObjectByName('compact-impact-flash')!.scale.x).toBeLessThanOrEqual(7);
  }
  effect.update(0, spell.duration, spell.duration);
  expect(rockets.every(n => !n.visible)).toBe(true); expect(impacts.every(n => !n.visible)).toBe(true);
});

test('robot AI chassis and computer palm replace shared magical ornaments', () => {
  const char = createStickMan3DCharacter('robot-test', 'robot');
  expect(char.headMesh.geometry.type).toBe('BoxGeometry');
  expect(char.bodyElementGroup.getObjectByName('robot-shoulder-launch-pod')).toBeDefined();
  expect(char.headElementGroup.getObjectByName('robot-temple-processor')).toBeDefined();
  expect(char.magicSealMesh.getObjectByName('robot-ground-target-bracket')).toBeDefined();
  expect((char.magicSealMesh.material as THREE.Material).visible).toBe(false);
  const body = new THREE.Group(), seal = createHandMagicSeal('robot', '#92A2B0', '#37DFEA', body); body.add(seal);
  expect(seal.userData.seal).toBeUndefined(); expect(seal.getObjectByName('robot-chip-die')).toBeDefined();
  updateHandMagicSeal(seal, true, .5, .2); expect(seal.visible).toBe(true);
  updateHandMagicSeal(seal, false, 1.5, 1); expect(seal.visible).toBe(false);
});

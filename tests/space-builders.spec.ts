import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { buildMeteorShower, buildCosmicRay, buildPlanetaryRings } from '../systems/spaceSpellBuilders';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';
import { createStickMan3DCharacter } from '../systems/stickManModelFactory';
import { updateSpacePower } from '../systems/spaceCosmos';
import { SpellEffectSystem } from '../systems/spellEffectSystem';

test('Space owns three distinct cosmic surfaces and reuses finite geometry throughout casting', () => {
  const builders = [buildMeteorShower, buildCosmicRay, buildPlanetaryRings];
  const signatures = [new Set(['blackhole', 'metric']), new Set(['wormhole']), new Set(['planet', 'metric'])];
  for (const [i, spell] of ELEMENTAL_SPELLS.space.entries()) {
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      const effect = builders[i](spell, heading, 147);
      const meshes: THREE.Mesh[] = [], materials = new Set<THREE.ShaderMaterial>();
      effect.root.traverse(node => { if (node instanceof THREE.Mesh) {
        meshes.push(node); if (node.material instanceof THREE.ShaderMaterial) materials.add(node.material);
      } });
      const geometry = meshes.map(mesh => mesh.geometry);
      expect(new Set([...materials].map(m => m.userData.cosmicSurface))).toEqual(signatures[i]);
      for (const p of [0, .18, .5, .7, .9, 1]) {
        effect.update(0, p * spell.duration, spell.duration);
        expect(meshes.map(mesh => mesh.geometry)).toEqual(geometry);
        for (const mesh of meshes) {
          expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
          expect(mesh.position.toArray().every(Number.isFinite)).toBe(true);
        }
        for (const material of materials) {
          expect(material.userData.element).toBe('space');
          if (p === 1) expect(material.uniforms.uOpacity.value).toBe(0);
        }
      }
    }
  }
});

test('gravity well warps its fabric inward and consumes stretched matter', () => {
  const effect = buildMeteorShower(ELEMENTAL_SPELLS.space[0]);
  const fabric = effect.root.getObjectByName('gravity-well-curved-spacetime') as THREE.Mesh;
  const positions = fabric.geometry.getAttribute('position');
  const depth = Array.from({ length: positions.count }, (_, i) => positions.getZ(i));
  expect(Math.min(...depth)).toBeLessThan(-20);
  expect(Math.max(...depth)).toBeGreaterThan(-.1);
  const hole = effect.root.getObjectByName('gravity-well-event-horizon')!;
  expect(hole.children).toHaveLength(2);
  expect(effect.root.children.filter(node => node.name === 'gravity-captured-asteroid')).toHaveLength(18);
  effect.update(0, .8, 2.4);
  const fragments = effect.root.children.filter(node => node.name === 'gravity-captured-asteroid');
  expect(fragments.some(node => node.scale.z > 2)).toBe(true);
});

test('wormholes respect the requested heading and destination and shut down cleanly', () => {
  const spell = ELEMENTAL_SPELLS.space[1], effect = buildCosmicRay(spell, Math.PI / 2, 147);
  const entrance = effect.root.getObjectByName('wormhole-entrance')!;
  const exit = effect.root.getObjectByName('wormhole-exit')!;
  expect(effect.root.rotation.y).toBe(Math.PI / 2);
  expect(entrance.position.z).toBe(0); expect(exit.position.z).toBe(147);
  effect.update(0, .7, spell.duration);
  expect(entrance.scale.x).toBe(1); expect(exit.scale.x).toBe(1);
  effect.update(0, spell.duration, spell.duration);
  expect(entrance.scale.x).toBe(0); expect(exit.scale.x).toBe(0);
});

test('Space palm has an accreting horizon instead of the shared rune seal and fades after casting', () => {
  const body = new THREE.Group(), hand = new THREE.Group(); body.add(hand);
  const seal = createHandMagicSeal('space', '#819DBD', '#E9C998', body); hand.add(seal);
  expect(seal.userData.seal).toBeUndefined(); expect(seal.userData.spaceSeal.facingTarget).toBe(body);
  updateHandMagicSeal(seal, true, .5, .2); expect(seal.visible).toBe(true);
  updateHandMagicSeal(seal, false, 1, 1); expect(seal.visible).toBe(false);
});

test('Space character uses cosmic head, chest and ground power; its ward persists with the shield status', () => {
  const char = createStickMan3DCharacter('space-test', 'space');
  const ward = char.bodyElementGroup.getObjectByName('space-spacetime-ward')!;
  expect(char.headElementGroup.getObjectByName('space-gravitational-crown')).toBeDefined();
  expect((char.magicSealMesh.material as THREE.Material).visible).toBe(false);
  updateSpacePower(char, 3, true); expect(ward.visible).toBe(true);
  updateSpacePower(char, 4.9, true); expect(ward.visible).toBe(true);
  updateSpacePower(char, 5.1, false); expect(ward.visible).toBe(false);
  expect(ward.children).toHaveLength(4);
});

test('cosmic effects are disposed at their lifetime and repeated casts do not retain scene objects', () => {
  const scene = new THREE.Scene(), system = new SpellEffectSystem(scene);
  for (const spell of ELEMENTAL_SPELLS.space) {
    const handle = system.castSpell(spell, 0, 0, .35, 1, 147)!;
    expect(handle.isAlive()).toBe(true); expect(system.activeCount()).toBe(1);
    system.update(spell.duration + .01);
    expect(handle.isAlive()).toBe(false); expect(scene.children).toHaveLength(0);
  }
  system.dispose();
});

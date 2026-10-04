import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { buildAbyssalGrasp, buildShadowPhantomWave, buildLuciferAscension } from '../systems/darkSpellBuilders';
import { createBatWing, createShadowMaterial, createShadowCloth, createSpectralHand, createDarkCrest, createDarkMantle } from '../systems/darkNature';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';
import { darkCastPose } from '../systems/darkCastPose';

test('the shadow grasp emerges before its articulated fingers close around the target', () => {
  const spell = ELEMENTAL_SPELLS.dark[0], effect = buildAbyssalGrasp(spell);
  const hands = effect.root.children.filter(node => node.name === 'dark-skeletal-hand');
  expect(hands).toHaveLength(3);
  expect(effect.root.children.filter(node => node.name === 'dark-grave-revenant')).toHaveLength(2);
  effect.update(0, .1, spell.duration);
  expect(hands[2].visible).toBe(false);
  const finger = hands[0].getObjectByName('dark-finger-2-joint-2')!;
  expect(finger.rotation.x).toBe(0);
  effect.update(0, 1.1, spell.duration);
  expect(hands.every(hand => hand.visible)).toBe(true);
  expect(finger.rotation.x).toBeGreaterThan(1);
  expect(hands[0].position.y).toBeGreaterThan(15);
});

test('the retained bat swarm has seven bodies and fourteen curved, scalloped wings', () => {
  const spell = ELEMENTAL_SPELLS.dark[1], effect = buildShadowPhantomWave(spell, Math.PI / 2, 210);
  const bats = effect.root.children.filter(node => node.name === 'dark-phantom-bat'); expect(bats).toHaveLength(7);
  const membrane = bats[0].getObjectByName('dark-cambered-bat-membrane') as THREE.Mesh;
  const p = membrane.geometry.getAttribute('position');
  expect(Math.max(...Array.from({ length: p.count }, (_, i) => p.getZ(i)))).toBeGreaterThan(3);
  effect.update(0, .6, spell.duration); const z = bats[0].position.z;
  const wing = bats[0].getObjectByName('dark-articulated-bat-wing')!; const flap = wing.rotation.y;
  effect.update(0, .9, spell.duration);
  expect(wing.rotation.y).not.toBe(flap); expect(bats[0].position.z).toBeGreaterThan(z);
  effect.update(0, 1.95, spell.duration);
  expect(bats.every(bat => Math.abs(bat.position.z - 210) < .001)).toBe(true);
  for (const side of [-1, 1]) {
    const geometry = createBatWing(side), vertices = geometry.getAttribute('position');
    expect(Array.from(vertices.array).every(Number.isFinite)).toBe(true);
    expect(geometry.getAttribute('normal').count).toBe(vertices.count);
  }
});

test('Lucifer ascends through low poison and shadow wisps without a separate skeletal guardian', () => {
  const spell = ELEMENTAL_SPELLS.dark[2], effect = buildLuciferAscension(spell);
  const pool = effect.root.getObjectByName('lucifer-ascension-poison')!;
  effect.update(0, .1, spell.duration); const earlyScale = pool.scale.x;
  effect.update(0, .7, spell.duration);
  expect(pool.scale.x).toBeGreaterThan(earlyScale);
  expect(effect.root.getObjectByName('dark-dread-sovereign')).toBeUndefined();
  expect(effect.root.userData.darkDesign).toBe('fallen-lucifer-ascension');
});

test('dark cloth preserves GPU buffers and all three spells fully dissolve with finite geometry', () => {
  const shade = createShadowMaterial(), cloth = createShadowCloth((u, t) => [Math.sin(u + t), 10 * u, 0], u => Math.sin(u * Math.PI) * 3, shade);
  const buffer = cloth.root.geometry.getAttribute('position'); cloth.update(1); expect(cloth.root.geometry.getAttribute('position')).toBe(buffer);
  const builders = [buildAbyssalGrasp, buildShadowPhantomWave, buildLuciferAscension];
  for (const [i, spell] of ELEMENTAL_SPELLS.dark.entries()) {
    const effect = builders[i](spell, Math.PI / 2); const meshes: THREE.Mesh[] = [];
    effect.root.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); }); const geometries = meshes.map(mesh => mesh.geometry);
    for (const progress of [0, .18, .5, .7, .9, 1]) {
      effect.update(.016, spell.duration * progress, spell.duration);
      expect(meshes.map(mesh => mesh.geometry)).toEqual(geometries);
      for (const mesh of meshes) {
        expect([...mesh.position.toArray(), ...mesh.quaternion.toArray(), ...mesh.scale.toArray()].every(Number.isFinite)).toBe(true);
        expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
        const material = mesh.material as THREE.ShaderMaterial | THREE.MeshBasicMaterial;
        if (progress === 1) expect(material instanceof THREE.ShaderMaterial ? material.uniforms.uOpacity.value : material.opacity).toBe(0);
      }
    }
  }
});

test('Umbra wears a compact reaper crown and swaying shroud with a fading skeletal palm', () => {
  for (const build of [createDarkCrest, createDarkMantle]) {
    const feature = build(); feature.update(.2); const bounds = new THREE.Box3().setFromObject(feature.root);
    feature.update(1.4); expect(bounds.getSize(new THREE.Vector3()).length()).toBeLessThan(.7);
    expect(feature.root.rotation.y).toBe(0);
  }
  const shade = createShadowMaterial(), bone = createShadowMaterial(1, true), hand = createSpectralHand(.1, shade, bone); hand.update(1);
  const digits = hand.root.children.filter(node => node.name.startsWith('dark-finger')); expect(digits).toHaveLength(5);
  const palm = new THREE.Group(), torso = new THREE.Group(); torso.position.y = .5;
  const seal = createHandMagicSeal('dark', '#343D48', '#D1C9B8', torso); palm.add(seal);
  updateHandMagicSeal(seal, true, .5, 1); expect(seal.visible).toBe(true);
  expect(seal.quaternion.toArray().every(Number.isFinite)).toBe(true);
  expect(new THREE.Box3().setFromObject(seal).getSize(new THREE.Vector3()).length()).toBeLessThan(.4);
  updateHandMagicSeal(seal, false, 2, 1); expect(seal.visible).toBe(false);
});

test('grasping, summoning bats and unfurling the demon form have different grounded cast gestures', () => {
  const poses = ELEMENTAL_SPELLS.dark.map(spell => darkCastPose(spell.id, .4));
  expect(new Set(poses.map(pose => JSON.stringify(pose))).size).toBe(3);
  expect(poses.every(pose => pose.bodyY >= .5 && pose.bodyY <= .55)).toBe(true);
  for (const spell of ELEMENTAL_SPELLS.dark) expect(darkCastPose(spell.id, 1).bodyY).toBe(.55);
});

import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { SPELL_BUILDERS } from '../systems/spellEffectSystem';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';
import { createStickMan3DCharacter } from '../systems/stickManModelFactory';
import { updateHealingPower } from '../systems/healingVitality';
import { healingCastPose } from '../systems/healingCastPose';

function dispose(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(node => {
    if (node instanceof THREE.Mesh) {
      geometries.add(node.geometry);
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => materials.add(m));
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

test('healing spells own separate restorative silhouettes, retain geometry, and fully fade', () => {
  const signatures = ['healing-heart-sanctuary', 'healing-mender-moth', 'healing-apothecary-canopy'];
  for (const [i, spell] of ELEMENTAL_SPELLS.healing.entries()) {
    const effect = SPELL_BUILDERS[spell.id](spell, .35, 150), meshes: THREE.Mesh[] = [];
    expect(effect.root.getObjectByName(signatures[i])).toBeDefined();
    for (const other of signatures.filter(name => name !== signatures[i])) expect(effect.root.getObjectByName(other)).toBeUndefined();
    effect.root.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
    const geometries = meshes.map(m => m.geometry);
    expect(meshes.some(m => m.material instanceof THREE.ShaderMaterial)).toBe(true);
    expect(meshes.some(m => ['TorusGeometry','RingGeometry','ConeGeometry','SphereGeometry'].includes(m.geometry.type))).toBe(false);
    for (const p of [0, .18, .5, .72, .9, 1]) {
      effect.update(0, spell.duration*p, spell.duration);
      expect(meshes.map(m => m.geometry)).toEqual(geometries);
      for (const mesh of meshes) {
        expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
        expect(mesh.position.toArray().every(Number.isFinite)).toBe(true);
        expect(mesh.scale.toArray().every(Number.isFinite)).toBe(true);
        if (p === 1) {
          const material = mesh.material as THREE.MeshBasicMaterial | THREE.ShaderMaterial;
          expect(material instanceof THREE.ShaderMaterial ? material.uniforms.uOpacity.value : material.opacity).toBe(0);
        }
      }
    }
    dispose(effect.root);
  }
});

test('cleansing contact appears as capsules land and harmful symptoms disappear', () => {
  const spell = ELEMENTAL_SPELLS.healing[2], effect = SPELL_BUILDERS[spell.id](spell, 0, 150);
  const capsule = effect.root.getObjectByName('healing-dew-capsule')!;
  const contact = effect.root.getObjectByName('healing-cleansing-contact')!;
  const symptom = effect.root.getObjectByName('healing-cleansed-symptom')!;
  effect.update(0, .2, spell.duration); expect(capsule.visible).toBe(true); expect(contact.scale.x).toBe(0);
  effect.update(0, 1.38, spell.duration); expect(capsule.visible).toBe(false); expect(contact.scale.x).toBeGreaterThan(.5);
  effect.update(0, 1.5, spell.duration); expect(symptom.scale.x).toBe(0);
  dispose(effect.root);
});

test('healing palm fades without generic runes and power carriers never expose cylinders or rings', () => {
  const body = new THREE.Group(), hand = new THREE.Group(); body.add(hand);
  const seal = createHandMagicSeal('healing', '#E9699C', '#87C99B', body); hand.add(seal);
  expect(seal.userData.healingSeal.facingTarget).toBe(body); expect(seal.userData.seal).toBeUndefined();
  updateHandMagicSeal(seal, true, .5, .2); expect(seal.visible).toBe(true);
  updateHandMagicSeal(seal, false, 1, 1); expect(seal.visible).toBe(false); dispose(seal);
  const char = createStickMan3DCharacter('healer-test', 'healing', 1);
  for (const mesh of [char.powerBeamMesh, char.shockwaveMesh]) {
    expect(mesh.geometry.type).toBe('BufferGeometry');
    expect((mesh.material as THREE.Material).opacity).toBe(0);
    expect(mesh.children.every(node => !node.visible)).toBe(true);
  }
  updateHealingPower(char, 1);
  expect(char.powerBeamMesh.children.every(node => !node.visible)).toBe(true);
  (char.powerBeamMesh.material as THREE.Material).opacity = .6;
  updateHealingPower(char, 1.1);
  expect(char.powerBeamMesh.children.every(node => node.visible)).toBe(true);
  for (const spell of ELEMENTAL_SPELLS.healing) {
    const pose = healingCastPose(spell.id, .5); expect(pose.bodyY).toBe(.55); expect(pose.bodyX).toBeLessThanOrEqual(0);
  }
  dispose(char.group);
});

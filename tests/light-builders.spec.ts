import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { buildSolarDawn, buildSunburstLance, buildArchangelAscension } from '../systems/lightSpellBuilders';
import { createLightRay } from '../systems/lightRadiance';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';

test('optical feathers remain finite at fractional lengths and from side views', () => {
  for (const length of [.16, .148, .112, 17, 38.85]) {
    const ray = createLightRay(length, .025, .65, true);
    expect(ray.root.children).toHaveLength(2);
    const geometry = (ray.root.children[0] as THREE.Mesh).geometry;
    expect(Array.from(geometry.attributes.position.array).every(Number.isFinite)).toBe(true);
    expect(Number.isFinite(geometry.boundingSphere!.radius)).toBe(true);
    geometry.dispose(); ray.material.dispose();
  }
});

test('light spells retain geometry across phases and fade their optical surfaces completely', () => {
  const builders = [buildSolarDawn, buildSunburstLance, buildArchangelAscension];
  for (const [i, spell] of ELEMENTAL_SPELLS.light.entries()) {
    const effect = builders[i](spell, .35, 145);
    const meshes: THREE.Mesh[] = [], surfaces = new Set<THREE.ShaderMaterial>();
    effect.root.traverse(node => {
      if (node instanceof THREE.Mesh) { meshes.push(node);
        if (node.material instanceof THREE.ShaderMaterial) surfaces.add(node.material); }
    });
    const geometry = meshes.map(mesh => mesh.geometry);
    expect(surfaces.size).toBeGreaterThan(0);
    for (const p of [0, .18, .5, .7, .9, 1]) {
      effect.update(0, p * spell.duration, spell.duration);
      expect(meshes.map(mesh => mesh.geometry)).toEqual(geometry);
      expect(meshes.every(mesh => Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite))).toBe(true);
      for (const surface of surfaces) {
        expect(surface.userData.element).toBe('light');
        if (p === 1) expect(surface.uniforms.uOpacity.value).toBe(0);
      }
    }
    const geometries = new Set(geometry);
    geometries.forEach(item => item.dispose()); surfaces.forEach(item => item.dispose());
    effect.root.traverse(node => {
      if (node instanceof THREE.Sprite) { node.material.map?.dispose(); node.material.dispose(); }
    });
  }
});

test('the photon lance launches at the caster and hits the requested distance', () => {
  const spell = ELEMENTAL_SPELLS.light[1], effect = buildSunburstLance(spell, Math.PI / 2, 145);
  const spear = effect.root.getObjectByName('seraph-photon-lance')!;
  const impact = effect.root.getObjectByName('lance-optical-impact')!;
  effect.update(0, .4, spell.duration);
  expect(spear.position.z).toBe(15); expect(impact.visible).toBe(false);
  effect.update(0, 1.13, spell.duration);
  expect(spear.position.z).toBe(160); expect(impact.position.z).toBe(160);
  expect(impact.visible).toBe(true); expect(effect.root.rotation.y).toBe(Math.PI / 2);
});

test('light palm uses an optical corona and fades out after casting', () => {
  const body = new THREE.Group(), hand = new THREE.Group(); body.add(hand);
  const seal = createHandMagicSeal('light', '#FFF3D8', '#D3A43D', body); hand.add(seal);
  expect(seal.userData.lightSeal.facingTarget).toBe(body);
  expect(seal.userData.seal).toBeUndefined();
  updateHandMagicSeal(seal, true, .5, .2); expect(seal.visible).toBe(true);
  updateHandMagicSeal(seal, false, 1, 1); expect(seal.visible).toBe(false);
  seal.traverse(node => { if (node instanceof THREE.Mesh) {
    expect(node.geometry.type).toBe('PlaneGeometry');
    node.geometry.dispose(); (node.material as THREE.Material).dispose();
  } });
});

import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { buildChronoRewind, buildGearBarrage, buildStasisField } from '../systems/timeSpellBuilders';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';
import { createStickMan3DCharacter } from '../systems/stickManModelFactory';
import { updateTimePower } from '../systems/timeChronology';
import { SpellEffectSystem } from '../systems/spellEffectSystem';

test('time spells reuse finite geometry and fade all their dedicated materials', () => {
  for (const [i, builder] of [buildChronoRewind, buildGearBarrage, buildStasisField].entries()) {
    const spell = ELEMENTAL_SPELLS.time[i], effect = builder(spell), meshes: THREE.Mesh[] = [];
    effect.root.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
    const geometries = meshes.map(mesh => mesh.geometry);
    expect(meshes.some(mesh => mesh.material instanceof THREE.ShaderMaterial)).toBe(false);
    for (const p of [0, .2, .5, .8, 1]) {
      effect.update(0, spell.duration * p, spell.duration);
      expect(meshes.map(mesh => mesh.geometry)).toEqual(geometries);
      for (const mesh of meshes) {
        expect(mesh.position.toArray().every(Number.isFinite)).toBe(true);
        expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
        if (p === 1) expect((mesh.material as THREE.MeshBasicMaterial).opacity).toBe(0);
      }
    }
  }
});

test('stasis stops its hands and sand, while rewind moves its playhead backward', () => {
  const stasis = buildStasisField(ELEMENTAL_SPELLS.time[2]);
  const hand = stasis.root.getObjectByName('time-second-hand')!;
  const grain = stasis.root.getObjectByName('time-suspended-grain')!;
  stasis.update(0, .7, 2.2); const rotation = hand.rotation.z, position = grain.position.clone();
  stasis.update(0, 1.5, 2.2); expect(hand.rotation.z).toBe(rotation); expect(grain.position.equals(position)).toBe(true);
  const rewind = buildChronoRewind(ELEMENTAL_SPELLS.time[0]);
  const cursor = rewind.root.getObjectByName('time-reverse-playhead')!;
  rewind.update(0, .4, 2.5); const x = cursor.position.x;
  rewind.update(0, 1.4, 2.5); expect(cursor.position.x).toBeLessThan(x);
});

test('time palm and character replace shared seals and show the shield only while active', () => {
  const body = new THREE.Group(), seal = createHandMagicSeal('time', '#24958E', '#D79B50', body);
  expect(seal.userData.seal).toBeUndefined(); expect(seal.userData.timeSeal.facingTarget).toBe(body);
  updateHandMagicSeal(seal, true, .5, .2); expect(seal.visible).toBe(true);
  updateHandMagicSeal(seal, false, 2, 1); expect(seal.visible).toBe(false);
  const char = createStickMan3DCharacter('time-test', 'time');
  expect(char.headElementGroup.getObjectByName('time-fixed-clock-crown')).toBeDefined();
  expect((char.magicSealMesh.material as THREE.Material).visible).toBe(false);
  const ward = char.bodyElementGroup.getObjectByName('time-chronometer')!;
  updateTimePower(char, 3, true); expect(ward.visible).toBe(true);
  updateTimePower(char, 4, false); expect(ward.visible).toBe(false);
  expect(char.powerBeamMesh.children[0].visible).toBe(false);
});

test('time casts release their scene objects at the end of each lifetime', () => {
  const scene = new THREE.Scene(), system = new SpellEffectSystem(scene);
  for (const spell of ELEMENTAL_SPELLS.time) {
    system.castSpell(spell, 0, 0, .35, 1, 147);
    expect(system.activeCount()).toBe(1);
    system.update(spell.duration + .01); expect(scene.children).toHaveLength(0);
  }
  system.dispose();
});

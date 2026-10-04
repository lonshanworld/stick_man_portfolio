import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, ease, noise, type BuiltSpellEffect } from './spellDrawing';
import { createLightRay } from './lightRadiance';

function ray(d: SpellDrawing, length: number, width: number, opacity: number,
  parent: THREE.Object3D = d.root, feather = false) {
  const light = createLightRay(length, width, opacity, feather);
  parent.add(light.root); d.surfaces.push(light.material); return light.root;
}

// Restorative light falls through an overhead aperture and pools around the caster.
export function buildSolarDawn(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); d.root.userData.lightDesign = 'descending-solar-aperture';
  const canopy = new THREE.Group(); canopy.position.set(0, 100, -4); d.root.add(canopy);
  for (let i = 0; i < 13; i++) {
    const beam = ray(d, 85 + noise(i) * 22, 5 + noise(i + 2) * 6, i % 3 ? .42 : .8, canopy);
    beam.position.set((i - 6) * 4, 0, Math.sin(i * 2.4) * 17);
    beam.rotation.z = Math.PI + (i - 6) * .035;
    d.motions.push(t => { beam.scale.y = ease((t - noise(i) * .22) / .45); });
  }
  d.halo([0, 91, -4], 28, '#fff8df', d.root, .5);
  const pool = d.halo([0, 4, 0], 43, '#fff0ba', d.root, .35);
  pool.scale.y = 16;
  for (let i = 0; i < 16; i++) {
    const glint = ray(d, 4 + noise(i) * 3, 2, .65);
    d.motions.push(t => { const phase = (t * .32 + noise(i)) % 1;
      glint.position.set((noise(i + 10) - .5) * 48, 8 + phase * 57, (noise(i + 20) - .5) * 28);
      glint.scale.setScalar(Math.sin(phase * Math.PI)); });
  }
  return d.finish();
}

// One continuous feathered photon lance: charge, release, travel, optical impact.
export function buildSunburstLance(spell: ElementalSpell, heading: number, distance = 210): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading); d.root.userData.lightDesign = 'seraph-photon-lance';
  d.root.userData.travelDistance = distance;
  const spear = new THREE.Group(); spear.name = 'seraph-photon-lance'; d.root.add(spear);
  const core = ray(d, 52, 8, 1, spear); core.rotation.x = Math.PI / 2; core.position.z = -30;
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const feather = ray(d, 17 - i, 3.8, .75, spear, true);
    feather.rotation.set(Math.PI / 2, 0, side * (.45 + i * .08));
    feather.position.set(0, 0, 4 - i * 4);
  }
  d.halo([0, 0, 18], 12, '#fff9e6', spear, .6);
  const impact = new THREE.Group(); impact.name = 'lance-optical-impact'; impact.position.set(7, 37, 15 + distance); d.root.add(impact);
  for (let i = 0; i < 12; i++) {
    const flash = ray(d, 20 + i % 3 * 6, 4, .8, impact);
    flash.rotation.z = i * Math.PI / 6;
  }
  d.halo([0, 0, 0], 25, '#fff6dc', impact, .5);
  d.motions.push(t => {
    const flight = ease((t - .42) / .7);
    spear.position.set(7, 37, 15 + flight * distance);
    spear.scale.setScalar(ease(t / .32)); spear.visible = t < 1.14;
    impact.visible = t >= 1.12; impact.scale.setScalar(.25 + ease((t - 1.12) / .3));
    const fade = 1 - ease((t - 1.16) / .4);
    impact.traverse(node => { if (node instanceof THREE.Mesh && node.material instanceof THREE.ShaderMaterial) node.material.uniforms.uOpacity.value *= fade; });
  });
  return d.finish();
}

// A brief ascension aperture announces the transformation; the form belongs to the character.
export function buildArchangelAscension(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); d.root.userData.lightDesign = 'michael-ascension';
  for (let i = 0; i < 9; i++) {
    const beam = ray(d, 110, 5, .6);
    beam.position.set((i - 4) * 5, 0, Math.sin(i * 2.4) * 12);
    d.motions.push(t => {
      beam.scale.y = ease(t / .4);
      beam.scale.x = 1 - ease((t - .65) / .55);
    });
  }
  d.halo([0, 35, 0], 38, '#fff7df', d.root, .45);
  return d.finish();
}

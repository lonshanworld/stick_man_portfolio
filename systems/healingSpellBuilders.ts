import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, TAU, ease, noise, type BuiltSpellEffect } from './spellDrawing';
import { createHealingHeartGeometry, createHealingCrossGeometry, healingBeat, HEALING_ROSE, HEALING_MINT, HEALING_PEARL } from './healingVitality';

function heart(d: SpellDrawing, size: number, parent: THREE.Object3D = d.root) {
  const mesh = d.mesh(createHealingHeartGeometry(size), d.primary, parent);
  mesh.name = 'healing-restorative-heart'; return mesh;
}

function cross(d: SpellDrawing, size: number, parent: THREE.Object3D = d.root) {
  const mesh = d.mesh(createHealingCrossGeometry(size), d.material(HEALING_PEARL), parent);
  mesh.name = 'healing-mending-cross'; return mesh;
}

/** A heart-shaped refuge closes broken seams, then restores a steady heartbeat. */
export function buildSakuraSanctuary(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), pearl = d.material(HEALING_PEARL), mint = d.material(HEALING_MINT);
  const refuge = new THREE.Group(); refuge.name = 'healing-heart-sanctuary'; d.root.add(refuge);
  const emblem = heart(d, 13, refuge); emblem.position.set(0, 48, -8);
  const sign = cross(d, 4, refuge); sign.position.set(0, 48, -4);
  // Heart boundary lies under the caster, with open halves drawn together like a wound.
  for (const side of [-1, 1]) {
    const half = new THREE.Group(); half.name = 'healing-closing-seam'; refuge.add(half);
    d.stroke(u => { const a = u * Math.PI, x = 16 * Math.pow(Math.sin(a), 3);
      const z = -(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));
      return [side*x*2.2, 2, z*2.2]; }, .75, mint, half, 48, false);
    d.motions.push(t => { half.position.x = side * 11 * (1 - ease(t / .65)); });
  }
  for (let i = 0; i < 7; i++) {
    const seam = d.mesh(new THREE.BoxGeometry(9, .7, 1.4), pearl, refuge);
    seam.name = 'healing-suture'; seam.position.set(0, 3, -22 + i * 7);
    d.motions.push(t => { seam.scale.x = ease((t - .2 - i * .05) / .45); });
  }
  const trace = [[-28,0],[-15,0],[-10,3],[-6,-4],[-2,11],[3,-7],[7,0],[28,0]];
  d.line(trace.map(([x,y]) => [x, 25+y, 9]), .65, pearl).name = 'healing-heartbeat-trace';
  for (let i = 0; i < 12; i++) {
    const plus = cross(d, 1.6); const a = i * 2.399, r = 17 + noise(i) * 16;
    d.motions.push(t => { const p = (noise(i+6) + t * .32) % 1;
      plus.position.set(Math.cos(a)*r, 8 + p*36, Math.sin(a)*r); plus.scale.setScalar(Math.sin(p*Math.PI)); });
  }
  // A slow heartbeat travels across the refuge, distinct from rays or flowing wind.
  d.ribbon(u => [u*56-28, 25 + Math.sin(u*TAU)*2, 8], 2.2, refuge, HEALING_ROSE, .35);
  d.motions.push(t => { emblem.scale.setScalar(ease(t/.4)*(1+healingBeat(t)*.14)); });
  return d.finish();
}

/** A soft, round-winged familiar carries a heart and sews a restorative thread. */
export function buildPetalBreeze(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), moth = new THREE.Group(); moth.name = 'healing-mender-moth'; d.root.add(moth);
  const pearl = d.material(HEALING_PEARL), mint = d.material(HEALING_MINT);
  const core = heart(d, 3, moth); core.position.z = 2;
  for (const side of [-1, 1]) {
    const wing = new THREE.Group(); wing.name = 'healing-rounded-moth-wing'; moth.add(wing);
    for (let i = 0; i < 2; i++) {
      const lobe = heart(d, i ? 4 : 6, wing); lobe.position.set(side*(i ? 5 : 7), i ? -4 : 3, 0); lobe.rotation.z = -side * .45;
      const mark = cross(d, i ? 1 : 1.6, wing); mark.position.copy(lobe.position); mark.position.z = 1.6;
    }
    d.line([[side,3,0],[side*3,8,0],[side*5,8,0]], .22, pearl, moth);
    d.motions.push(t => { wing.rotation.y = side*Math.sin(t*11)*.55; });
  }
  const path = (t: number): [number,number,number] => [Math.sin(t*2.8)*28, 40+Math.cos(t*2.1)*12, Math.cos(t*2.8)*12];
  d.motions.push(t => { moth.position.set(...path(t)); moth.scale.setScalar(ease(t/.32)); moth.rotation.z = Math.cos(t*2.8)*-.2; core.scale.setScalar(1+healingBeat(t)*.15); });
  d.ribbon((u,t) => path(Math.max(0,t-u*.8)), 1.7, d.root, HEALING_MINT, .45);
  for (let i = 0; i < 14; i++) {
    const stitch = d.mesh(new THREE.BoxGeometry(.65, 3, .8), mint); stitch.name = 'healing-moth-thread-stitch';
    d.motions.push(t => { stitch.position.set(...path(Math.max(0,t-i*.055))); stitch.position.y -= i*.6; stitch.rotation.z = -.55; stitch.scale.setScalar(ease((t-i*.035)/.2)); });
  }
  for (let i = 0; i < 6; i++) {
    const plus = cross(d, 1.7);
    d.motions.push(t => { const p = (t*.55+i/6)%1; plus.position.set((noise(i)-.5)*35, 5+p*20, (noise(i+4)-.5)*22); plus.scale.setScalar(Math.sin(p*Math.PI)); });
  }
  return d.finish();
}

/** Pearlescent medicine capsules descend; dark symptoms contract into mending crosses. */
export function buildVitalityRain(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), mint = d.material(HEALING_MINT), pearl = d.material(HEALING_PEARL), symptom = d.material('#785266', .65);
  const canopy = new THREE.Group(); canopy.name = 'healing-apothecary-canopy'; canopy.position.y = 67; d.root.add(canopy);
  const emblem = heart(d, 9, canopy); const sign = cross(d, 3, canopy); sign.position.z = 3;
  d.motions.push(t => { canopy.scale.setScalar(ease(t/.4)); emblem.scale.setScalar(1+healingBeat(t)*.12); });
  for (let i = 0; i < 18; i++) {
    const capsule = new THREE.Group(); capsule.name = 'healing-dew-capsule'; d.root.add(capsule);
    const shell = d.mesh(new THREE.CapsuleGeometry(1.4, 3.2, 4, 8), i%2 ? pearl : mint, capsule);
    const plus = cross(d, .95, capsule); plus.position.z = 1.6;
    const landing = cross(d, 2.3); landing.name = 'healing-cleansing-contact';
    const ailment = d.mesh(new THREE.BoxGeometry(2.8, .55, 2.8), symptom); ailment.name = 'healing-cleansed-symptom';
    const x = (noise(i+10)-.5)*54, z = (noise(i+32)-.5)*34;
    landing.position.set(x, 4, z); ailment.position.set(x, 7, z);
    d.motions.push(t => { const p = (t*.65+i/18)%1;
      capsule.position.set(x, 62*(1-p)+6, z); capsule.visible = p < .83;
      shell.scale.setScalar(1+healingBeat(t+i*.05)*.05);
      landing.scale.setScalar(p < .83 ? 0 : Math.sin((p-.83)/.17*Math.PI));
      ailment.scale.setScalar((1-ease((t-.2)/1.2))*(.5+noise(i)*.5)); });
  }
  // Descending dotted sutures, rather than a water curtain or a generic star shower.
  for (const side of [-1,1]) d.ribbon(u => [side*31, 8+u*51, -6], 1.4, d.root, HEALING_MINT, .25);
  return d.finish();
}

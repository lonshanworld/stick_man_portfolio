import { createDarkPoisonMaterial } from './fallenLucifer';
import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, ease, clamp, noise, TAU } from './spellDrawing';
import { createShadowMaterial, createShadowCloth, createSpectralHand, createDeathMask, createBatWing } from './darkNature';

function addMesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D) {
  const node = new THREE.Mesh(geometry, material); parent.add(node); return node;
}

function darkness(spell: ElementalSpell, heading = 0) {
  const d = new SpellDrawing(spell, heading), shadow = createShadowMaterial(.84), bone = createShadowMaterial(.9, true);
  d.surfaces.push(shadow, bone);
  const soul = d.material('#A4BDB1', .72);
  return { d, shadow, bone, soul };
}

function driftingAsh(d: SpellDrawing, spread: number, height: number, count = 24) {
  const ash = d.material('#82938E', .38);
  for (let i = 0; i < count; i++) {
    const flake = d.mesh(new THREE.PlaneGeometry(.7, 1.4), ash); flake.name = 'dark-mortality-ash';
    d.motions.push(t => {
      flake.position.set((noise(i + 2) - .5) * spread + Math.sin(t + i) * 4, (noise(i) * height + t * 9) % height, (noise(i + 6) - .5) * spread);
      flake.rotation.set(i + t * .5, i * .8 + t, t * .3);
    });
  }
}

function hood(d: SpellDrawing, material: THREE.ShaderMaterial, parent: THREE.Object3D) {
  const shape = new THREE.Shape(); shape.moveTo(-9, -2); shape.lineTo(-10, 4);
  shape.quadraticCurveTo(-10, 13, 0, 15); shape.quadraticCurveTo(10, 13, 10, 4);
  shape.lineTo(9, -2); shape.lineTo(5, 1); shape.quadraticCurveTo(7, 10, 0, 10);
  shape.quadraticCurveTo(-7, 10, -5, 1); shape.closePath();
  const mesh = addMesh(new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: true, bevelSize: .7, bevelThickness: .5, bevelSegments: 2, steps: 1, curveSegments: 16 }), material, parent);
  mesh.name = 'dark-revenant-hood'; return mesh;
}

/** Three jointed skeletal hands rise from shadow and close around the target. */
export function buildAbyssalGrasp(spell: ElementalSpell) {
  const { d, shadow, bone } = darkness(spell); d.root.userData.darkDesign = 'articulated-death-grasp';
  for (let i = 0; i < 3; i++) {
    const angle = i * TAU / 3 + .45, hand = createSpectralHand(17, shadow, bone);
    d.root.add(hand.root); hand.root.rotation.y = angle + Math.PI;
    hand.root.rotation.z = i === 1 ? -.25 : .17;
    d.motions.push(t => {
      const emerge = ease((t - i * .08) / .52), grip = ease((t - .5) / .48);
      hand.root.visible = emerge > .002; hand.root.scale.setScalar(17 * emerge);
      hand.root.position.set(Math.sin(angle) * (29 - grip * 7), 8 + emerge * 10, Math.cos(angle) * (29 - grip * 7));
      hand.update(grip);
    });
    const cloth = createShadowCloth((u, t) => [Math.sin(angle) * (28 - u * 6), 2 + u * 17 * ease(t / .5), Math.cos(angle) * 25 + Math.sin(u * 5 + t) * 2], u => 7 * Math.sin(u * Math.PI), shadow);
    d.root.add(cloth.root); d.motions.push(t => cloth.update(t));
  }
  for (const side of [-1, 1]) {
    const witness = new THREE.Group(); witness.name = 'dark-grave-revenant'; witness.position.set(side * 34, 23, -14); d.root.add(witness);
    hood(d, shadow, witness); witness.scale.setScalar(.64);
    const mask = createDeathMask(6, bone); mask.position.set(0, 5, 3); witness.add(mask); d.materials.push(...mask.userData.materials);
    const robe = createShadowCloth((u, t) => [Math.sin(u * 4 + t) * u * 3, 1 - u * 32, -2 - u * 4], u => 7 * (1 - u * .9), shadow);
    witness.add(robe.root);
    d.motions.push(t => { const emerge = ease((t - .18) / .55); witness.visible = emerge > .002; witness.scale.setScalar(.64 * emerge); robe.update(t); });
  }
  driftingAsh(d, 65, 43); return d.finish();
}

/** Seven shadow bats fly on cambered membranes, articulated bones and cold soul eyes. */
export function buildShadowPhantomWave(spell: ElementalSpell, heading: number, distance = 165) {
  const { d, shadow, soul } = darkness(spell, heading);
  d.root.userData.darkDesign = 'cambered-phantom-bat-swarm';
  d.root.userData.travelDistance = distance;
  for (let i = 0; i < 7; i++) {
    const bat = new THREE.Group(); bat.name = 'dark-phantom-bat'; d.root.add(bat); bat.rotation.y = -heading;
    const scale = .55 + noise(i) * .22;
    const body = addMesh(new THREE.SphereGeometry(2.1, 12, 10), shadow, bat); body.scale.set(.75, 1.6, .75);
    const head = addMesh(new THREE.SphereGeometry(1.8, 10, 8), shadow, bat); head.position.y = 3;
    const wings: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const ear = addMesh(new THREE.ConeGeometry(.8, 3.5, 5), shadow, bat); ear.position.set(side * 1.05, 5.2, 0); ear.rotation.z = -side * .22;
      const eye = d.mote([side * .72, 3.25, 1.62], .28, soul, bat); eye.name = 'dark-soul-eye';
      const wing = new THREE.Group(); wing.name = 'dark-articulated-bat-wing'; bat.add(wing); wings.push(wing);
      const membrane = addMesh(createBatWing(side), shadow, wing); membrane.name = 'dark-cambered-bat-membrane';
      for (const end of [.4, .7, 1]) {
        const top = Math.sin(end * Math.PI * .85) * 7 + end * 4;
        d.line([[0, 0, .1], [side * 7, 6, .3], [side * end * 23, top, .1]], .24, soul, wing).name = 'dark-bat-wing-bone';
      }
    }
    const tail = addMesh(new THREE.ConeGeometry(1.5, 5, 5), shadow, bat); tail.position.y = -4; tail.rotation.z = Math.PI;
    const trail = createShadowCloth((u, t) => [(i % 3 - 1) * 17 + Math.sin(t * 3 - u * 4 + i) * 4, 29 + i % 3 * 12 - u * 4, clamp((t - i * .065 - .12) / 1.32) * distance - u * 28], u => 3 * (1 - u), shadow);
    trail.root.name = 'dark-bat-smoke-wake'; d.root.add(trail.root);
    d.motions.push(t => {
      const age = t - i * .065, launch = ease(age / .24), travel = clamp((age - .12) / 1.32);
      bat.visible = trail.root.visible = age > 0;
      bat.position.set((i % 3 - 1) * 17 + Math.sin(age * 3 + i) * 4, 29 + (i % 3) * 12 + Math.sin(age * 5 + i) * 3, travel * distance);
      bat.scale.setScalar(scale * launch); bat.rotation.z = Math.sin(age * 3 + i) * .12;
      wings.forEach((wing, j) => { wing.rotation.y = (j ? 1 : -1) * Math.sin(age * 14 + i * .7) * .75; wing.rotation.z = (j ? 1 : -1) * Math.cos(age * 14 + i * .7) * .18; });
      trail.update(t);
    });
  }
  return d.finish();
}

/** A low poison bloom announces Lucifer's ascension; the demon itself belongs to the character. */
export function buildLuciferAscension(spell: ElementalSpell) {
  const { d, shadow } = darkness(spell);
  d.root.userData.darkDesign = 'fallen-lucifer-ascension';
  const poison = createDarkPoisonMaterial(); d.surfaces.push(poison);
  const pool = addMesh(new THREE.PlaneGeometry(90, 90), poison, d.root);
  pool.name = 'lucifer-ascension-poison'; pool.rotation.x = -Math.PI / 2; pool.position.y = 1;
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8;
    const wisp = createShadowCloth((u, t) => [Math.cos(a + u * .3) * (20 - u * 10),
      u * 75 * ease(t / .4), Math.sin(a + u * .3) * (20 - u * 10)], u => Math.sin(u * Math.PI) * 2.2, shadow);
    d.root.add(wisp.root); d.motions.push(wisp.update);
  }
  d.motions.push(t => { pool.scale.setScalar(.3 + ease(t / .5) * .7); });
  return d.finish();
}

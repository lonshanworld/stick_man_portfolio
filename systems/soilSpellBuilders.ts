import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, clamp, ease, noise, TAU, type Point } from './spellDrawing';
import { createBoulderGeometry, createSoilDustMaterial, createStoneMaterial, createStrataGeometry } from './soilStone';

function stone(d: SpellDrawing, geometry: THREE.BufferGeometry, color: string, parent: THREE.Object3D = d.root, ore = false) {
  const material = createStoneMaterial(color, 1, ore); d.surfaces.push(material);
  const mesh = new THREE.Mesh(geometry, material); parent.add(mesh); return mesh;
}

/** Ground-hugging plumes swell after displacement, drift, then settle. */
function dust(d: SpellDrawing, center: Point, at: number, count = 10, spread = 20) {
  const material = createSoilDustMaterial(.34); d.surfaces.push(material);
  for (let i = 0; i < count; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material); puff.name = 'soil-dust'; d.root.add(puff);
    d.motions.push(t => {
      const age = t - at - noise(i) * .12, p = clamp(age / .85), angle = i * 2.399;
      puff.visible = age > 0 && age < 1.2;
      puff.position.set(center[0] + Math.cos(angle) * spread * p, center[1] + 2 + p * (6 + noise(i) * 7), center[2] + Math.sin(angle) * spread * p);
      const size = Math.sin(p * Math.PI) * (5 + noise(i + 5) * 6);
      puff.scale.set(size, size * .55, size);
    });
  }
}

function rubble(d: SpellDrawing, center: Point, at: number, count: number, spread: number) {
  for (let i = 0; i < count; i++) {
    const fragment = stone(d, createBoulderGeometry(1.4 + noise(i) * 1.8, i), i % 3 ? '#9B8060' : '#66584A');
    fragment.name = 'soil-ballistic-rubble';
    d.motions.push(t => {
      const age = Math.max(0, t - at), angle = i * 2.399, speed = spread * (.4 + noise(i) * .6);
      const y = center[1] + age * (20 + noise(i + 4) * 27) - 53 * age * age;
      fragment.visible = t >= at;
      fragment.position.set(center[0] + Math.cos(angle) * speed * Math.min(age, .8), Math.max(1.1, y), center[2] + Math.sin(angle) * speed * Math.min(age, .8));
      fragment.rotation.set(Math.min(age, .8) * 4 + i, age * 1.5, i);
      fragment.scale.setScalar(1 - ease((age - 1) / .4));
    });
  }
}

export function buildBedrockFissure(spell: ElementalSpell, heading: number, distance = 125) {
  const d = new SpellDrawing(spell, heading); d.root.userData.soilDesign = 'advancing-tectonic-fault';
  const shadow = d.material('#30291F');
  for (let i = 0; i < 8; i++) {
    const z = 8 + i * Math.max(48, distance - 8) / 7, delay = i * .09;
    const crack = d.line([[0, .4, z - 10], [i % 2 ? 6 : -5, .4, z], [-2, .4, z + 10]], 1.3, shadow);
    for (const side of [-1, 1]) {
      const height = 13 + noise(i * 4 + side) * 26;
      const slab = stone(d, createStrataGeometry(12 + noise(i + 3) * 8, height, 8 + noise(i) * 6, i + side), ['#897660', '#B09570', '#6B6357'][(i + (side + 1) / 2) % 3]);
      slab.name = 'soil-fault-slab';
      d.motions.push(t => {
        const lift = ease((t - delay) / .23), settle = ease((t - delay - .48) / .55);
        slab.position.set(side * (9 + lift * 4), -height * .5 + lift * height * (.92 - settle * .14), z + side * noise(i) * 4);
        slab.rotation.set((noise(i + 4) - .5) * .45 * lift, side * (.1 + noise(i + 1) * .35), -side * lift * (.1 + noise(i + 8) * .3));
        slab.visible = t > delay;
      });
    }
    d.motions.push(t => { crack.visible = t > delay; });
    dust(d, [0, 0, z], delay + .1, 4, 16);
    rubble(d, [0, 1, z], delay + .14, 3, 21);
  }
  return d.finish();
}

export function buildBoulderCatapult(spell: ElementalSpell, heading: number, distance = 150) {
  const d = new SpellDrawing(spell, heading); d.root.userData.soilDesign = 'excavate-launch-shatter';
  const travel = Math.max(24, distance - 8), launch = .48, impact = 1.35;
  const boulder = stone(d, createBoulderGeometry(18, 8), '#A88B64'); boulder.name = 'soil-catapult-boulder';
  const cradle = stone(d, createStrataGeometry(36, 8, 29, 5), '#66503A'); cradle.name = 'soil-excavation';
  const trajectory = (t: number): Point => {
    const rise = ease(t / launch), flight = clamp((t - launch) / (impact - launch));
    return [0, -15 + rise * 39 + Math.sin(flight * Math.PI) * 46 - flight * 17, 8 + flight * travel];
  };
  d.motions.push(t => {
    boulder.visible = t < impact; boulder.position.set(...trajectory(t)); boulder.rotation.set(t * 2.2, t * 1.3, t * .6);
    cradle.position.set(0, -4 + ease(t / .25) * 4, 8); cradle.rotation.x = ease((t - launch) / .2) * -.15;
  });
  // Soil shaken from the rising boulder follows delayed trajectories and gravity.
  for (let i = 0; i < 20; i++) {
    const grain = stone(d, createBoulderGeometry(.9 + noise(i), i), '#786147');
    d.motions.push(t => {
      const delay = noise(i) * .6, age = t - launch - delay, source = trajectory(launch + delay);
      grain.visible = age > 0 && age < .65;
      grain.position.set((noise(i + 2) - .5) * 21, Math.max(1, source[1] - age * age * 92), source[2] + age * 18);
      grain.rotation.x = age * 5;
    });
  }
  dust(d, [0, 0, 8], .12, 10, 25);
  dust(d, [0, 0, 8 + travel], impact, 18, 40);
  rubble(d, [0, 4, 8 + travel], impact, 24, 53);
  const crater = stone(d, createStrataGeometry(48, 3, 41, 3), '#504334'); crater.name = 'soil-impact-crater';
  d.motions.push(t => { crater.visible = t >= impact; crater.position.set(0, -.5, 8 + travel); crater.scale.setScalar(ease((t - impact) / .15)); });
  return d.finish();
}

export function buildFortressBastion(spell: ElementalSpell) {
  const d = new SpellDrawing(spell); d.root.userData.soilDesign = 'interlocking-mineral-rampart';
  for (let i = 0; i < 7; i++) {
    const angle = i * TAU / 7 + Math.PI / 7, height = Math.cos(angle) > .2 ? 19 : 35 + (i % 2) * 6, delay = i * .045;
    const wall = new THREE.Group(); wall.name = 'soil-bastion-wall'; d.root.add(wall);
    wall.rotation.y = -angle;
    for (let row = 0; row < 3; row++) {
      const block = stone(d, createStrataGeometry(25 - row, height / 3 + 1, 9, i + row), row % 2 ? '#A8906B' : '#80694E', wall);
      block.position.set(row % 2 ? 1.5 : -1, (row + .5) * height / 3, 0);
    }
    // Short raw ochre crystals grow from ore pockets, distinct from long ice spears.
    for (let j = 0; j < 3; j++) {
      const ore = stone(d, createStrataGeometry(3.5, 8 + j * 2, 4, j), '#D5BA83', wall, true);
      ore.position.set((j - 1) * 4, height * .7 + j, 5); ore.rotation.z = (j - 1) * .2;
    }
    d.motions.push(t => {
      const rise = ease((t - delay) / .42), release = ease((t / spell.duration - .78) / .22);
      wall.visible = t >= delay;
      wall.position.set(Math.sin(angle) * 31, -height * (1 - rise) - release * 10, Math.cos(angle) * 31);
      wall.rotation.z = (1 - rise) * .09;
    });
    dust(d, [Math.sin(angle) * 31, 0, Math.cos(angle) * 31], delay + .13, 4, 12);
    rubble(d, [Math.sin(angle) * 33, 1, Math.cos(angle) * 33], delay + .2, 2, 12);
  }
  return d.finish();
}
